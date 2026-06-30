const express = require("express");
const router = express.Router();
const db = require("../database/database");

// ---------- Helpers ----------
function mergeAndSum(segments) {
    if (!segments || segments.length === 0) return 0;
    const sorted = [...segments].sort((a, b) => a[0] - b[0]);
    let merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        const prev = merged[merged.length - 1];
        if (sorted[i][0] <= prev[1]) {
            prev[1] = Math.max(prev[1], sorted[i][1]);
        } else {
            merged.push([...sorted[i]]);
        }
    }
    return merged.reduce((sum, seg) => sum + (seg[1] - seg[0]), 0);
}

function parseDuration(dur) {
    if (!dur) return 0;
    if (typeof dur === "number") return dur * 60;
    dur = dur.toString().trim();
    const hourMatch = dur.match(/(\d+)\s*h/i);
    const minMatch = dur.match(/(\d+)\s*m/i);
    if (hourMatch || minMatch) {
        let sec = 0;
        if (hourMatch) sec += parseInt(hourMatch[1]) * 3600;
        if (minMatch) sec += parseInt(minMatch[1]) * 60;
        return sec;
    }
    const parts = dur.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    const num = parseFloat(dur);
    if (!isNaN(num)) return Math.round(num * 60);
    return 0;
}

// ---------- POST – save progress + badge awarding ----------
router.post("/", (req, res) => {
    const { firebase_uid, course_id, watched_segments } = req.body;
    if (!firebase_uid || !course_id) return res.status(400).json({ message: "Missing fields" });

    const segments = watched_segments || [];

    db.get("SELECT duration FROM courses WHERE id = ?", [course_id], (err, course) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!course) return res.status(404).json({ message: "Course not found" });

        let totalDuration = parseDuration(course.duration);
        if (totalDuration <= 0 && segments.length > 0) {
            const maxEnd = Math.max(...segments.map(s => s[1]));
            totalDuration = maxEnd;
        }

        const totalWatched = mergeAndSum(segments);
        const progress = totalDuration > 0
            ? Math.min(100, Math.round((totalWatched / totalDuration) * 100))
            : 0;

        const sql = `
            INSERT INTO user_progress (firebase_uid, course_id, progress, watched_segments, last_watched_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(firebase_uid, course_id)
            DO UPDATE SET progress = excluded.progress,
                          watched_segments = excluded.watched_segments,
                          last_watched_at = datetime('now')
        `;
        db.run(sql, [firebase_uid, course_id, progress, JSON.stringify(segments)], function (err) {
            if (err) return res.status(500).json({ message: err.message });

            // --- Badge awarding logic ---
            db.get("SELECT COUNT(*) AS started FROM user_progress WHERE firebase_uid = ?", [firebase_uid], (err, startedRow) => {
                if (err) return;
                const started = startedRow?.count || 0;
                db.get("SELECT COUNT(*) AS completed FROM user_progress WHERE firebase_uid = ? AND progress >= 100", [firebase_uid], (err, completedRow) => {
                    if (err) return;
                    const completed = completedRow?.count || 0;

                    const newBadgeIds = [];
                    if (started >= 1) newBadgeIds.push(1);
                    if (started >= 3) newBadgeIds.push(2);
                    if (completed >= 1) newBadgeIds.push(3);
                    if (completed >= 3) newBadgeIds.push(4);

                    // Insert missing badges + notification
                    newBadgeIds.forEach(badgeId => {
                        db.run(
                            "INSERT OR IGNORE INTO user_badges (firebase_uid, badge_id) VALUES (?, ?)",
                            [firebase_uid, badgeId],
                            function (err) {
                                if (!err && this.changes > 0) {
                                    db.get("SELECT name FROM badges WHERE id = ?", [badgeId], (err, badgeRow) => {
                                        if (err || !badgeRow) return;
                                        const message = `🏆 Félicitations ! Vous avez obtenu le badge "${badgeRow.name}".`;
                                        db.run(
                                            "INSERT INTO notifications (firebase_uid, message, type) VALUES (?, ?, 'badge_earned')",
                                            [firebase_uid, message]
                                        );
                                    });
                                }
                            }
                        );
                    });
                });
            });

            res.json({ message: "Progress saved", progress });
        });
    });
});

// ---------- GET – aggregated stats for a user ----------
router.get("/stats/:uid", (req, res) => {
    const { uid } = req.params;
    db.all(
        "SELECT progress, watched_segments FROM user_progress WHERE firebase_uid = ?",
        [uid],
        (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });

            let totalWatchTime = 0;
            let totalProgress = 0;
            let completedCourses = 0;
            const courseCount = rows.length;

            rows.forEach(row => {
                totalProgress += row.progress || 0;
                if (row.progress >= 100) completedCourses++;
                try {
                    const segments = JSON.parse(row.watched_segments || "[]");
                    totalWatchTime += mergeAndSum(segments);
                } catch (e) {}
            });

            const avgProgress = courseCount > 0 ? Math.round(totalProgress / courseCount) : 0;
            const hours = Math.floor(totalWatchTime / 3600);
            const minutes = Math.floor((totalWatchTime % 3600) / 60);
            const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            db.get("SELECT COUNT(*) AS count FROM user_badges WHERE firebase_uid = ?", [uid], (err, badgeRow) => {
                const badgeCount = err ? 0 : (badgeRow?.count || 0);

                res.json({
                    avgProgress,
                    totalWatchTime: formattedTime,
                    completedCourses,
                    badges: badgeCount,
                    courseCount,
                });
            });
        }
    );
});

// ---------- GET – progress for a specific user + course ----------
router.get("/:uid/:courseId", (req, res) => {
    const { uid, courseId } = req.params;
    db.get(
        "SELECT * FROM user_progress WHERE firebase_uid = ? AND course_id = ?",
        [uid, courseId],
        (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!row) return res.json({ progress: 0, watched_segments: [] });
            try {
                row.watched_segments = JSON.parse(row.watched_segments || "[]");
            } catch { row.watched_segments = []; }
            res.json(row);
        }
    );
});

// GET /api/badges/:uid – badges de l'utilisateur
router.get("/badges/:uid", (req, res) => {
    const { uid } = req.params;
    db.all(
        `SELECT b.id, b.name, b.description, b.icon, b.category, ub.earned_at
         FROM user_badges ub
         JOIN badges b ON b.id = ub.badge_id
         WHERE ub.firebase_uid = ?
         ORDER BY ub.earned_at DESC`,
        [uid],
        (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(rows || []);
        }
    );
});

// Nouvelle route : Validation stricte de complétion
router.post("/:courseId/complete", (req, res) => {
    const { firebase_uid } = req.body;
    const courseId = req.params.courseId;

    if (!firebase_uid) return res.status(400).json({ message: "UID manquant" });

    db.get("SELECT progress, watched_segments FROM user_progress WHERE firebase_uid = ? AND course_id = ?", [firebase_uid, courseId], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: "Aucune progression trouvée" });

        if (row.progress < 90) {
            return res.status(400).json({ success: false, message: "Vous devez avoir regardé au moins 90% du contenu." });
        }

        db.run("UPDATE user_progress SET progress = 100 WHERE firebase_uid = ? AND course_id = ?", [firebase_uid, courseId], function(err) {
            if (err) return res.status(500).json({ message: err.message });

            // Also trigger badge awarding after manual completion
            db.get("SELECT COUNT(*) AS started FROM user_progress WHERE firebase_uid = ?", [firebase_uid], (err, startedRow) => {
                if (err) return;
                const started = startedRow?.count || 0;
                db.get("SELECT COUNT(*) AS completed FROM user_progress WHERE firebase_uid = ? AND progress >= 100", [firebase_uid], (err, completedRow) => {
                    if (err) return;
                    const completed = completedRow?.count || 0;

                    const newBadgeIds = [];
                    if (started >= 1) newBadgeIds.push(1);
                    if (started >= 3) newBadgeIds.push(2);
                    if (completed >= 1) newBadgeIds.push(3);
                    if (completed >= 3) newBadgeIds.push(4);

                    newBadgeIds.forEach(badgeId => {
                        db.run(
                            "INSERT OR IGNORE INTO user_badges (firebase_uid, badge_id) VALUES (?, ?)",
                            [firebase_uid, badgeId],
                            function (err) {
                                if (!err && this.changes > 0) {
                                    db.get("SELECT name FROM badges WHERE id = ?", [badgeId], (err, badgeRow) => {
                                        if (err || !badgeRow) return;
                                        const message = `🏆 Félicitations ! Vous avez obtenu le badge "${badgeRow.name}".`;
                                        db.run(
                                            "INSERT INTO notifications (firebase_uid, message, type) VALUES (?, ?, 'badge_earned')",
                                            [firebase_uid, message]
                                        );
                                    });
                                }
                            }
                        );
                    });
                });
            });

            res.json({ success: true, progress: 100 });
        });
    });
});

module.exports = router;