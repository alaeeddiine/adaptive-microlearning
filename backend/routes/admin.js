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

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// ---------- DASHBOARD ----------
router.get("/dashboard", (req, res) => {
    const data = {};

    // 1. Total users (exclude admins)
    db.get("SELECT COUNT(*) AS total FROM users WHERE role != 'admin'", (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        data.users = row.total;

        // 2. Total courses
        db.get("SELECT COUNT(*) AS total FROM courses", (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            data.courses = row.total;

            // 3. Completed courses
            db.get("SELECT COUNT(*) AS total FROM user_progress WHERE progress >= 100", (err, row) => {
                if (err) return res.status(500).json({ message: err.message });
                data.completed = row.total;

                // 4. Average progress
                db.get("SELECT ROUND(AVG(progress)) AS avg FROM user_progress", (err, row) => {
                    if (err) return res.status(500).json({ message: err.message });
                    data.avgProgress = row.avg || 0;

                    // 5. Group distribution
                    db.all("SELECT ab_group, COUNT(*) AS count FROM users WHERE ab_group IS NOT NULL GROUP BY ab_group", (err, rows) => {
                        if (err) return res.status(500).json({ message: err.message });
                        data.groupA = rows.find(r => r.ab_group === 'A')?.count || 0;
                        data.groupB = rows.find(r => r.ab_group === 'B')?.count || 0;

                        // 6. Last 5 signups (no admins)
                        db.all("SELECT name, email, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5", (err, users) => {
                            if (err) return res.status(500).json({ message: err.message });
                            data.recentUsers = users || [];

                            // 7. Top courses (by distinct users who started)
                            db.all(`
                                SELECT c.id, c.title, COUNT(DISTINCT ua.firebase_uid) AS user_count
                                FROM user_activity ua
                                JOIN courses c ON c.id = ua.course_id
                                WHERE ua.event_type = 'started'
                                GROUP BY c.id
                                ORDER BY user_count DESC LIMIT 5
                            `, (err, topCourses) => {
                                if (err) return res.status(500).json({ message: err.message });
                                data.topCourses = topCourses || [];

                                // 8. Total time spent (sum of watched segments)
                                db.all("SELECT watched_segments FROM user_progress", (err, rows) => {
                                    if (err) return res.status(500).json({ message: err.message });
                                    let totalSeconds = 0;
                                    rows.forEach(r => {
                                        try {
                                            const segments = JSON.parse(r.watched_segments || "[]");
                                            totalSeconds += mergeAndSum(segments);
                                        } catch(e) {}
                                    });
                                    const hours = Math.floor(totalSeconds / 3600);
                                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                                    data.totalTimeSpent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                                    // 9. Recently played courses (last 10 distinct courses started)
                                    db.all(`
                                        SELECT c.id, c.title, MAX(ua.created_at) AS last_played
                                        FROM user_activity ua
                                        JOIN courses c ON c.id = ua.course_id
                                        WHERE ua.event_type = 'started'
                                        GROUP BY c.id
                                        ORDER BY last_played DESC
                                        LIMIT 10
                                    `, (err, recentCourses) => {
                                        if (err) return res.status(500).json({ message: err.message });
                                        data.recentCourses = recentCourses || [];

                                        // 10. Most active users (top 5 by total watch time)
                                        db.all(`
                                            SELECT u.firebase_uid, u.name, u.email,
                                                   GROUP_CONCAT(up.watched_segments) AS all_segments
                                            FROM user_progress up
                                            JOIN users u ON u.firebase_uid = up.firebase_uid
                                            GROUP BY up.firebase_uid
                                        `, (err, userRows) => {
                                            if (err) return res.status(500).json({ message: err.message });
                                            const userTimes = userRows.map(u => {
                                                let totalSec = 0;
                                                const segmentsConcat = u.all_segments || "";
                                                const segmentStrs = segmentsConcat.split(/\]\s*,\s*\[/);
                                                segmentStrs.forEach(seg => {
                                                    const cleaned = seg.replace(/^\[|\]$/g, "");
                                                    const nums = cleaned.split(",").map(Number);
                                                    if (nums.length === 2) {
                                                        totalSec += (nums[1] - nums[0]);
                                                    }
                                                });
                                                return {
                                                    firebase_uid: u.firebase_uid,
                                                    name: u.name,
                                                    email: u.email,
                                                    totalSeconds: totalSec,
                                                };
                                            });
                                            userTimes.sort((a, b) => b.totalSeconds - a.totalSeconds);
                                            const topUsers = userTimes.slice(0, 5).map(u => ({
                                                ...u,
                                                totalTimeFormatted: formatTime(u.totalSeconds),
                                            }));
                                            data.mostActiveUsers = topUsers;

                                            res.json(data);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// ---------- USERS ----------
router.get("/users", (req, res) => {
    db.all("SELECT firebase_uid, name, email, created_at FROM users WHERE role != 'admin'", (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        const users = rows.map(u => ({ ...u, completed: 0 }));
        res.json(users);
    });
});

router.get("/users/:uid", (req, res) => {
    const { uid } = req.params;

    // 1. User profile
    db.get("SELECT * FROM users WHERE firebase_uid = ?", [uid], (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        // 2. Courses with progress (joined with user_progress)
        const sqlCourses = `
            SELECT c.id, c.title, c.category_id, cat.name AS category_name,
                   c.level, c.duration, c.description, c.media, c.quiz_link,
                   up.progress, up.watched_segments, up.last_watched_at
            FROM user_progress up
            JOIN courses c ON c.id = up.course_id
            LEFT JOIN categories cat ON cat.id = c.category_id
            WHERE up.firebase_uid = ?
            ORDER BY up.last_watched_at DESC
        `;
        db.all(sqlCourses, [uid], (err, courses) => {
            if (err) {
                // Fallback if user_progress table missing
                courses = [];
            }

            // 3. Total watch time from user_progress (sum of merged segments)
            db.all("SELECT watched_segments FROM user_progress WHERE firebase_uid = ?", [uid], (err, rows) => {
                let totalSeconds = 0;
                if (!err) {
                    rows.forEach(r => {
                        try {
                            const segments = JSON.parse(r.watched_segments || "[]");
                            totalSeconds += mergeAndSum(segments);
                        } catch (e) {}
                    });
                }
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const totalTimeFormatted = h > 0 ? `${h}h ${m}m` : `${m}m`;

                // 4. Recent activity (last 10 events)
                db.all(
                    `SELECT event_type, event_data, created_at
                     FROM user_activity
                     WHERE firebase_uid = ?
                     ORDER BY created_at DESC LIMIT 10`,
                    [uid],
                    (err, activities) => {
                        if (err) activities = [];

                        // 5. Session contexts (last 5)
                        db.all(
                            `SELECT * FROM session_context
                             WHERE firebase_uid = ?
                             ORDER BY created_at DESC LIMIT 5`,
                            [uid],
                            (err, sessions) => {
                                if (err) sessions = [];

                                // 6. ARCS responses (last 5)
                                db.all(
                                    `SELECT * FROM arcs_responses
                                     WHERE firebase_uid = ?
                                     ORDER BY created_at DESC LIMIT 5`,
                                    [uid],
                                    (err, arcs) => {
                                        if (err) arcs = [];

                                        res.json({
                                            user: {
                                                ...user,
                                                total_time_watched: totalTimeFormatted,
                                                total_seconds: totalSeconds,
                                            },
                                            courses: courses || [],
                                            activities: activities || [],
                                            sessions: sessions || [],
                                            arcs: arcs || [],
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    });
});

router.delete("/users/:uid", (req, res) => {
    const { uid } = req.params;
    db.run("DELETE FROM courses WHERE firebase_uid = ?", [uid], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        db.run("DELETE FROM user_progress WHERE firebase_uid = ?", [uid], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            db.run("DELETE FROM users WHERE firebase_uid = ?", [uid], function(err) {
                if (err) return res.status(500).json({ message: err.message });
                if (this.changes === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
                res.json({ message: "Utilisateur supprimé" });
            });
        });
    });
});

// ---------- CATEGORIES ----------
router.get("/categories", (req, res) => {
    db.all("SELECT * FROM categories", (err, rows) => {
        if (err) {
            db.run("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)");
            return res.json([]);
        }
        const categories = rows.map(cat => {
            return new Promise((resolve) => {
                db.get("SELECT COUNT(*) AS count FROM courses WHERE category_id = ?", [cat.id], (err, row) => {
                    cat.courseCount = row?.count || 0;
                    resolve(cat);
                });
            });
        });
        Promise.all(categories).then(data => res.json(data));
    });
});

router.post("/categories", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nom requis" });
    db.run("INSERT INTO categories (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ id: this.lastID, name });
    });
});

// ---------- COURSES WITHIN CATEGORY ----------
router.get("/categories/:id/courses", (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM courses WHERE category_id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows || []);
    });
});

router.post("/categories/:id/courses", (req, res) => {
    const { id } = req.params;
    const { title, level, duration, description, media, quiz_link } = req.body;
    if (!title) return res.status(400).json({ message: "Titre requis" });
    db.run(
        `INSERT INTO courses (title, level, duration, description, media, quiz_link, category_id)
         VALUES (?,?,?,?,?,?,?)`,
        [title, level, duration, description || "", media || "", quiz_link || "", id],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ id: this.lastID, title, level, duration, description, media, quiz_link });
        }
    );
});

// ---------- SINGLE COURSE (UPDATE / DELETE) ----------
router.put("/courses/:id", (req, res) => {
    const { id } = req.params;
    const { title, level, duration, description, media, quiz_link } = req.body;
    if (!title) return res.status(400).json({ message: "Titre requis" });
    db.run(
        `UPDATE courses SET title=?, level=?, duration=?, description=?, media=?, quiz_link=? WHERE id=?`,
        [title, level, duration, description || "", media || "", quiz_link || "", id],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Cours non trouvé" });
            res.json({ message: "Cours mis à jour" });
        }
    );
});

router.delete("/courses/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM courses WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Cours non trouvé" });
        res.json({ message: "Cours supprimé" });
    });
});

module.exports = router;