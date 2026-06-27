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

            // 2. Taux d'engagement (sessions complétées vs abandonnées)
            db.get(
                "SELECT COUNT(*) as count FROM user_activity WHERE ab_group = 'A' AND event_type = 'completed'",
                (err, rowAcomp) => {
                    if (err) return res.status(500).json({ message: err.message });
                    metrics.groupA_completed = rowAcomp?.count || 0;

                    db.get(
                        "SELECT COUNT(*) as count FROM user_activity WHERE ab_group = 'A' AND event_type = 'started'",
                        (err, rowAstart) => {
                            if (err) return res.status(500).json({ message: err.message });
                            metrics.groupA_started = rowAstart?.count || 0;

                            db.get(
                                "SELECT COUNT(*) as count FROM user_activity WHERE ab_group = 'B' AND event_type = 'completed'",
                                (err, rowBcomp) => {
                                    if (err) return res.status(500).json({ message: err.message });
                                    metrics.groupB_completed = rowBcomp?.count || 0;

                                    db.get(
                                        "SELECT COUNT(*) as count FROM user_activity WHERE ab_group = 'B' AND event_type = 'started'",
                                        (err, rowBstart) => {
                                            if (err) return res.status(500).json({ message: err.message });
                                            metrics.groupB_started = rowBstart?.count || 0;

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

                                                            // 4. Distribution des types de contenu (si enregistré dans event_data)
                                                            db.all(
                                                                "SELECT event_data FROM user_activity WHERE ab_group IS NOT NULL",
                                                                (err, rows) => {
                                                                    if (err) return res.status(500).json({ message: err.message });
                                                                    const contentTypes = { A: {}, B: {} };
                                                                    rows.forEach(row => {
                                                                        try {
                                                                            const data = JSON.parse(row.event_data || "{}");
                                                                            const group = row.ab_group;
                                                                            const type = data.content_type || "inconnu";
                                                                            if (!contentTypes[group]) contentTypes[group] = {};
                                                                            contentTypes[group][type] = (contentTypes[group][type] || 0) + 1;
                                                                        } catch (e) {}
                                                                    });
                                                                    metrics.contentDistribution = contentTypes;
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
                        }
                    );
                }
            );
        });
    });
});

module.exports = router;