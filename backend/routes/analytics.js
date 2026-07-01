const express = require("express");
const router = express.Router();
const db = require("../database/database");

// GET /api/analytics/ab-testing - Métriques comparatives A/B
router.get("/ab-testing", (req, res) => {
    const metrics = {};

    // 1. Nombre d'utilisateurs par groupe
    db.get("SELECT COUNT(*) as count FROM users WHERE ab_group = 'A'", (err, rowA) => {
        if (err) return res.status(500).json({ message: err.message });
        metrics.groupA_users = rowA?.count || 0;

        db.get("SELECT COUNT(*) as count FROM users WHERE ab_group = 'B'", (err, rowB) => {
            if (err) return res.status(500).json({ message: err.message });
            metrics.groupB_users = rowB?.count || 0;

            // 2. Taux de complétion réel sur paires uniques utilisateur + contenu
            db.all(
                `
                    WITH started AS (
                        SELECT ab_group, firebase_uid, course_id
                        FROM user_activity
                        WHERE event_type = 'started'
                          AND ab_group IN ('A', 'B')
                          AND course_id IS NOT NULL
                        GROUP BY ab_group, firebase_uid, course_id
                    ),
                    completed AS (
                        SELECT ab_group, firebase_uid, course_id
                        FROM user_activity
                        WHERE event_type = 'completed'
                          AND ab_group IN ('A', 'B')
                          AND course_id IS NOT NULL
                        GROUP BY ab_group, firebase_uid, course_id
                    )
                    SELECT
                        s.ab_group AS group_name,
                        COUNT(*) AS started_count,
                        COUNT(c.course_id) AS completed_count
                    FROM started s
                    LEFT JOIN completed c
                      ON c.ab_group = s.ab_group
                     AND c.firebase_uid = s.firebase_uid
                     AND c.course_id = s.course_id
                    GROUP BY s.ab_group
                `,
                (err, rows) => {
                    if (err) return res.status(500).json({ message: err.message });

                    const byGroup = {
                        A: { started: 0, completed: 0 },
                        B: { started: 0, completed: 0 },
                    };

                    rows.forEach((row) => {
                        const group = row.group_name;
                        if (!byGroup[group]) return;
                        byGroup[group].started = row.started_count || 0;
                        byGroup[group].completed = row.completed_count || 0;
                    });

                    metrics.groupA_started = byGroup.A.started;
                    metrics.groupA_completed = byGroup.A.completed;
                    metrics.groupB_started = byGroup.B.started;
                    metrics.groupB_completed = byGroup.B.completed;

                    // 3. Temps de visionnage moyen par groupe
                    db.get(
                        "SELECT AVG(progress) as avg FROM user_progress WHERE firebase_uid IN (SELECT firebase_uid FROM users WHERE ab_group = 'A')",
                        (err, rowAavg) => {
                            if (err) return res.status(500).json({ message: err.message });
                            metrics.groupA_avgProgress = Math.round(rowAavg?.avg || 0);

                            db.get(
                                "SELECT AVG(progress) as avg FROM user_progress WHERE firebase_uid IN (SELECT firebase_uid FROM users WHERE ab_group = 'B')",
                                (err, rowBavg) => {
                                    if (err) return res.status(500).json({ message: err.message });
                                    metrics.groupB_avgProgress = Math.round(rowBavg?.avg || 0);

                                    // 4. Types de contenu préférés à partir des events started réels
                                    db.all(
                                        `
                                            SELECT
                                                ua.ab_group AS group_name,
                                                CASE
                                                    WHEN q.id IS NOT NULL AND c.id IS NULL THEN 'Quiz'
                                                    WHEN c.id IS NOT NULL THEN COALESCE(cat.name, 'Sans catégorie')
                                                    ELSE 'Inconnu'
                                                END AS content_type,
                                                COUNT(*) AS count
                                            FROM user_activity ua
                                            LEFT JOIN courses c ON c.id = ua.course_id
                                            LEFT JOIN categories cat ON cat.id = c.category_id
                                            LEFT JOIN quizzes q ON q.id = ua.course_id
                                            WHERE ua.event_type = 'started'
                                              AND ua.ab_group IN ('A', 'B')
                                              AND (c.id IS NOT NULL OR q.id IS NOT NULL)
                                            GROUP BY ua.ab_group, content_type
                                        `,
                                        (err, rows) => {
                                            if (err) return res.status(500).json({ message: err.message });
                                            const contentTypes = { A: {}, B: {} };
                                            rows.forEach(({ group_name, content_type, count }) => {
                                                if (!contentTypes[group_name]) contentTypes[group_name] = {};
                                                contentTypes[group_name][content_type] = count;
                                            });
                                            metrics.contentDistribution = contentTypes;

                                            db.all(
                                                `
                                                    SELECT content_type, SUM(count) AS count
                                                    FROM (
                                                        SELECT
                                                            CASE
                                                                WHEN LOWER(COALESCE(c.media, '')) LIKE '%youtube.com%'
                                                                  OR LOWER(COALESCE(c.media, '')) LIKE '%youtu.be%'
                                                                  OR LOWER(COALESCE(c.media, '')) LIKE '%.mp4%'
                                                                  OR LOWER(COALESCE(c.media, '')) LIKE '%.webm%'
                                                                  OR LOWER(COALESCE(c.media, '')) LIKE '%.mov%'
                                                                  OR LOWER(COALESCE(c.title, '')) LIKE '%video%'
                                                                  OR LOWER(COALESCE(c.description, '')) LIKE '%video%'
                                                                    THEN 'video'
                                                                WHEN LOWER(COALESCE(c.title, '')) LIKE '%infographie%'
                                                                  OR LOWER(COALESCE(c.description, '')) LIKE '%infographie%'
                                                                  OR LOWER(COALESCE(c.title, '')) LIKE '%infographic%'
                                                                  OR LOWER(COALESCE(c.description, '')) LIKE '%infographic%'
                                                                    THEN 'infographie'
                                                                ELSE 'text'
                                                            END AS content_type,
                                                            COUNT(*) AS count
                                                        FROM user_activity ua
                                                        JOIN courses c ON c.id = ua.course_id
                                                        WHERE ua.event_type = 'started'
                                                          AND ua.ab_group IN ('A', 'B')
                                                        GROUP BY content_type
                                                        UNION ALL
                                                        SELECT
                                                            'quiz' AS content_type,
                                                            COUNT(*) AS count
                                                        FROM user_activity ua
                                                        WHERE ua.event_type = 'quiz_submitted'
                                                          AND ua.ab_group IN ('A', 'B')
                                                    )
                                                    GROUP BY content_type
                                                `,
                                                (err, rows) => {
                                                    if (err) return res.status(500).json({ message: err.message });
                                                    const contentPreference = { video: 0, quiz: 0, infographie: 0, text: 0 };
                                                    rows.forEach(({ content_type, count }) => {
                                                        if (contentPreference[content_type] === undefined) return;
                                                        contentPreference[content_type] = count || 0;
                                                    });
                                                    metrics.contentPreference = contentPreference;
                                                    res.json(metrics);
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});

module.exports = router;
