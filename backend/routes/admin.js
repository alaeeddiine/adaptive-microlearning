const express = require("express");
const router = express.Router();
const db = require("../database/database");
const { getFirebaseAdmin } = require("../lib/firebaseAdmin");
const { calculateOverallProgress } = require("../lib/progressMetrics");

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function deleteFirebaseIdentity(uid) {
    const admin = getFirebaseAdmin();
    if (!admin) {
        throw new Error("Firebase Admin non configuré");
    }

    const auth = admin.auth();
    const firestore = admin.firestore();

    try {
        await auth.deleteUser(uid);
    } catch (err) {
        if (err?.code !== "auth/user-not-found") {
            throw err;
        }
    }

    let firestoreDeleted = true;
    try {
        await firestore.collection("users").doc(uid).delete();
    } catch (err) {
        firestoreDeleted = false;
        console.error("Erreur suppression Firestore :", err.message);
    }

    return { firestoreDeleted };
}

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

function formatSeconds(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function durationFromTimestamp(createdAt) {
    if (!createdAt) return 0;
    const ts = new Date(`${createdAt}Z`).getTime();
    if (!Number.isFinite(ts)) return 0;
    return Math.max(0, Math.floor((Date.now() - ts) / 1000));
}

function inferBatteryPercentFromLevel(level) {
    const normalized = String(level || "").trim().toLowerCase();
    if (!normalized) return null;
    if (normalized.includes("%")) {
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : null;
    }
    if (normalized === "faible") return 15;
    if (normalized === "moyenne") return 50;
    if (normalized === "élevé" || normalized === "eleve") return 85;
    return null;
}

function extractYouTubeVideoId(url) {
    if (!url) return null;
    const value = String(url).trim();
    const patterns = [
        /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/i,
        /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/i,
        /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/i,
        /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/i,
        /[?&]v=([A-Za-z0-9_-]{11})/i,
    ];
    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function parseIsoDuration(isoDuration) {
    if (!isoDuration) return 0;
    const match = String(isoDuration).match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)$/i);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = Math.round(parseFloat(match[3] || "0"));
    return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

async function detectVideoDuration(mediaUrl) {
    const videoId = extractYouTubeVideoId(mediaUrl);
    if (!videoId) return null;
    if (typeof fetch !== "function") return null;

    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
    if (!response.ok) return null;

    const html = await response.text();
    const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/) || html.match(/"lengthSeconds":(\d+)/);
    if (lengthMatch) return formatDuration(parseInt(lengthMatch[1], 10));

    const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
    if (approxMatch) return formatDuration(Math.round(parseInt(approxMatch[1], 10) / 1000));

    const isoMatch = html.match(/itemprop="duration" content="([^"]+)"/i);
    if (isoMatch) return formatDuration(parseIsoDuration(isoMatch[1]));

    return null;
}

async function resolveCourseDuration(mediaUrl, fallbackDuration) {
    const media = String(mediaUrl || "").trim();
    if (!media) return fallbackDuration || "";
    const detected = await detectVideoDuration(media).catch(() => null);
    return detected || fallbackDuration || "";
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

            // 3. Completed courses (progress = 100)
            db.get("SELECT COUNT(*) AS total FROM user_progress WHERE progress >= 100", (err, row) => {
                if (err) { data.completed = 0; } else { data.completed = row.total; }

                // 4. Average progress
                db.get("SELECT ROUND(AVG(progress)) AS avg FROM user_progress", (err, row) => {
                    if (err) { data.avgProgress = 0; } else { data.avgProgress = row.avg || 0; }

                    // 5. Group distribution
                    db.all("SELECT ab_group, COUNT(*) AS count FROM users WHERE ab_group IS NOT NULL GROUP BY ab_group", (err, rows) => {
                        if (err) { data.groupA = 0; data.groupB = 0; } else {
                            data.groupA = rows.find(r => r.ab_group === 'A')?.count || 0;
                            data.groupB = rows.find(r => r.ab_group === 'B')?.count || 0;
                        }

                        // 6. Last 5 signups (no admins)
                        db.all("SELECT name, email, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5", (err, users) => {
                            if (err) { data.recentUsers = []; } else { data.recentUsers = users || []; }

                            // 7. Top courses (by distinct users who started)
                            db.all(`
                                SELECT c.id, c.title, COUNT(DISTINCT ua.firebase_uid) AS user_count
                                FROM user_activity ua
                                JOIN courses c ON c.id = ua.course_id
                                WHERE ua.event_type = 'started'
                                GROUP BY c.id
                                ORDER BY user_count DESC LIMIT 5
                            `, (err, topCourses) => {
                                if (err) { data.topCourses = []; } else { data.topCourses = topCourses || []; }

                                // 8. Total time spent (sum of watched segments)
                                db.all("SELECT watched_segments FROM user_progress", (err, rows) => {
                                    let totalSeconds = 0;
                                    if (!err) {
                                        rows.forEach(r => {
                                            try {
                                                const segments = JSON.parse(r.watched_segments || "[]");
                                                totalSeconds += mergeAndSum(segments);
                                            } catch (e) {}
                                        });
                                    }
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
                                        if (err) { data.recentCourses = []; } else { data.recentCourses = recentCourses || []; }

                                        // 10. Most active users (top 5 by total watch time)
                                        db.all(`
                                            SELECT u.firebase_uid, u.name, u.email,
                                                   GROUP_CONCAT(up.watched_segments) AS all_segments
                                            FROM user_progress up
                                            JOIN users u ON u.firebase_uid = up.firebase_uid
                                            GROUP BY up.firebase_uid
                                        `, (err, userRows) => {
                                            let mostActiveUsers = [];
                                            if (!err) {
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
                                                mostActiveUsers = userTimes.slice(0, 5).map(u => ({
                                                    ...u,
                                                    totalTimeFormatted: formatTime(u.totalSeconds),
                                                }));
                                            }
                                            data.mostActiveUsers = mostActiveUsers;
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
    db.all(
        `SELECT u.firebase_uid, u.name, u.email, u.created_at,
                COALESCE(AVG(up.progress), 0) AS avg_course,
                (SELECT COALESCE(ROUND(AVG(sq.score)), 0)
                 FROM (
                     SELECT ua.quiz_id,
                            ROUND(SUM(ua.is_correct)*100.0/COUNT(ua.id)) AS score
                     FROM user_answers ua
                     JOIN questions q ON q.id = ua.question_id
                     WHERE ua.firebase_uid = u.firebase_uid
                     GROUP BY ua.quiz_id
                 ) sq
                ) AS avg_quiz
         FROM users u
         LEFT JOIN user_progress up ON up.firebase_uid = u.firebase_uid
         WHERE u.role != 'admin'
         GROUP BY u.firebase_uid
         ORDER BY u.created_at DESC`,
        (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });

            const users = rows.map(u => {
                const course = Math.round(u.avg_course) || 0;
                const quiz = Math.round(u.avg_quiz) || 0;
                const overall = calculateOverallProgress(course, quiz);

                return {
                    firebase_uid: u.firebase_uid,
                    name: u.name,
                    email: u.email,
                    created_at: u.created_at,
                    avgProgress: overall,
                    overall_progress: overall,   // ← new field
                    completed: overall,          // keep compatibility
                };
            });

            res.json(users);
        }
    );
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
                    `SELECT ua.event_type, ua.event_data, ua.created_at,
                            c.title AS course_title,
                            q.title AS quiz_title
                    FROM user_activity ua
                    LEFT JOIN courses c ON c.id = ua.course_id
                    LEFT JOIN quizzes q ON q.id = ua.course_id AND ua.event_type LIKE 'quiz%'
                    WHERE ua.firebase_uid = ?
                    ORDER BY ua.created_at DESC LIMIT 10`,
                    [uid],
                    (err, activities) => {
                        if (err) activities = [];

                        // 5. Session contexts + current detected context + daily average
                        db.all(
                            `SELECT *
                             FROM session_context
                             WHERE firebase_uid = ?
                             ORDER BY created_at DESC, id DESC`,
                            [uid],
                            (err, sessionRows) => {
                                if (err) console.error("Erreur session:", err);
                                const sessions = Array.isArray(sessionRows) ? sessionRows : [];
                                const currentContext = sessions.length > 0 ? sessions[0] : null;
                                const activeSessions = sessions.filter((s) => (Number(s.duration) || 0) > 0);
                                const totalSessionSeconds = activeSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
                                const activeDays = new Set(
                                    activeSessions.map((s) => {
                                        try {
                                            return new Date(s.created_at + "Z").toISOString().split("T")[0];
                                        } catch {
                                            return null;
                                        }
                                    }).filter(Boolean)
                                );
                                const averageDailySeconds = activeDays.size > 0
                                    ? Math.round(totalSessionSeconds / activeDays.size)
                                    : 0;
                                const batteryStats = sessions.reduce((acc, session) => {
                                    const key = session.battery_level || "Non disponible";
                                    acc[key] = (acc[key] || 0) + 1;
                                    return acc;
                                }, {});
                                const batteryPercentValues = sessions
                                    .map((s) => {
                                        if (s.battery_percent != null && Number.isFinite(Number(s.battery_percent))) {
                                            return Math.max(0, Math.min(100, Math.round(Number(s.battery_percent))));
                                        }
                                        return inferBatteryPercentFromLevel(s.battery_level);
                                    })
                                    .filter((v) => v != null);
                                const averageBatteryPercent = batteryPercentValues.length > 0
                                    ? Math.round(batteryPercentValues.reduce((sum, v) => sum + v, 0) / batteryPercentValues.length)
                                    : null;
                                const currentBatteryPercent = currentContext
                                    ? (currentContext.battery_percent != null && Number.isFinite(Number(currentContext.battery_percent))
                                        ? Math.max(0, Math.min(100, Math.round(Number(currentContext.battery_percent))))
                                        : inferBatteryPercentFromLevel(currentContext.battery_level))
                                    : null;
                                const currentBatteryLevel = currentContext?.battery_level || "Non disponible";
                                const currentSessionDuration = (() => {
                                    if (!currentContext) return "0m";
                                    const stored = Number(currentContext.duration) || 0;
                                    if (stored > 0) return formatSeconds(stored);
                                    try {
                                        return formatSeconds(durationFromTimestamp(currentContext.created_at));
                                    } catch {
                                        return "0m";
                                    }
                                })();
                                const totalSiteTimeFormatted = formatSeconds(totalSessionSeconds);

                                // 6. ARCS responses (last 5)
                                db.all(
                                    `SELECT ar.*, c.title AS course_title
                                    FROM arcs_responses ar
                                    LEFT JOIN courses c ON c.id = ar.course_id
                                    WHERE ar.firebase_uid = ?
                                    ORDER BY ar.created_at DESC LIMIT 5`,
                                    [uid],
                                    (err, arcs) => {
                                        if (err) arcs = [];

                                        // NEW: Quiz attempts with scores
                                        db.all(
                                            `SELECT q.id AS quiz_id, q.title, q.description,
                                                    cat.name AS category_name,
                                                    COUNT(ua.id) AS total_questions,
                                                    SUM(ua.is_correct) AS correct_answers,
                                                    CASE WHEN COUNT(ua.id) > 0
                                                        THEN ROUND((SUM(ua.is_correct) * 100.0) / COUNT(ua.id))
                                                        ELSE 0 END AS score
                                            FROM user_answers ua
                                            JOIN questions qu ON qu.id = ua.question_id
                                            JOIN quizzes q ON q.id = qu.quiz_id
                                            LEFT JOIN categories cat ON cat.id = q.category_id
                                            WHERE ua.firebase_uid = ?
                                            GROUP BY q.id
                                            ORDER BY MAX(ua.answered_at) DESC`,
                                            [uid],
                                            (err, quizzes) => {
                                                if (err) quizzes = [];

                                                // 7. User badges (unchanged)
                                                db.all(
                                                    `SELECT b.id, b.name, b.description, b.icon, b.category, ub.earned_at
                                                            FROM user_badges ub
                                                            JOIN badges b ON b.id = ub.badge_id
                                                            WHERE ub.firebase_uid = ?
                                                            ORDER BY ub.earned_at DESC`,
                                                            [uid],
                                                            (err, badges) => {
                                                                if (err) badges = [];

                                                                db.get(
                                                                    `SELECT COALESCE(AVG(up.progress), 0) AS avg_course,
                                                                            (SELECT COALESCE(ROUND(AVG(sq.score)), 0)
                                                                             FROM (
                                                                                 SELECT ua.quiz_id,
                                                                                        ROUND(SUM(ua.is_correct)*100.0/COUNT(ua.id)) AS score
                                                                                 FROM user_answers ua
                                                                                 JOIN questions q ON q.id = ua.question_id
                                                                                 WHERE ua.firebase_uid = ?
                                                                                 GROUP BY ua.quiz_id
                                                                             ) sq
                                                                            ) AS avg_quiz
                                                                     FROM users u
                                                                     LEFT JOIN user_progress up ON up.firebase_uid = u.firebase_uid
                                                                     WHERE u.firebase_uid = ?
                                                                     GROUP BY u.firebase_uid`,
                                                                    [uid, uid],
                                                                    (progressErr, progressRow) => {
                                                                        const courseAvg = progressErr ? 0 : Math.round(progressRow?.avg_course || 0);
                                                                        const quizAvg = progressErr ? 0 : Math.round(progressRow?.avg_quiz || 0);
                                                                        const overallProgress = calculateOverallProgress(courseAvg, quizAvg);

                                                                        res.json({
                                                                            user: {
                                                                                ...user,
                                                                                total_time_watched: totalTimeFormatted,
                                                                                total_site_time: formatSeconds(totalSessionSeconds),
                                                                                total_seconds: totalSeconds,
                                                                                avgProgress: overallProgress,
                                                                                overall_progress: overallProgress,
                                                                            },
                                                                            courses: courses || [],
                                                                            activities: activities || [],
                                                                            sessions: sessions || [],
                                                                            sessionSummary: {
                                                                                currentContext,
                                                                                currentBatteryLevel,
                                                                                currentBatteryPercent,
                                                                                averageBatteryPercent,
                                                                                batteryStats,
                                                                                activeSessionsCount: activeSessions.length,
                                                                                activeDaysCount: activeDays.size,
                                                                                averageDailySeconds,
                                                                                averageDailyFormatted: formatSeconds(averageDailySeconds),
                                                                                totalSessionSeconds,
                                                                                totalSessionFormatted: formatSeconds(totalSessionSeconds),
                                                                                totalSiteTimeFormatted,
                                                                                currentSessionDuration,
                                                                            },
                                                                            arcs: arcs || [],
                                                                            badges: badges || [],
                                                                            quizzes: quizzes || [],
                                                                        });
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
});

router.delete("/users/:uid", async (req, res) => {
    const { uid } = req.params;

    try {
        await deleteFirebaseIdentity(uid);
    } catch (err) {
        if (err?.code !== "auth/user-not-found") {
            return res.status(500).json({ message: err.message || "Erreur Firebase" });
        }
    }

    try {
        await runAsync("DELETE FROM courses WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM user_progress WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM notifications WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM session_context WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM user_activity WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM arcs_responses WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM user_answers WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM user_badges WHERE firebase_uid = ?", [uid]);
        await runAsync("DELETE FROM users WHERE firebase_uid = ?", [uid]);
        res.json({ message: "Utilisateur supprimé définitivement" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
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
    const { title, level, duration, description, media, quiz_link, course_type } = req.body;
    if (!title) return res.status(400).json({ message: "Titre requis" });
    resolveCourseDuration(media, duration)
        .then((resolvedDuration) => {
            db.run(
                `INSERT INTO courses (title, level, duration, description, media, quiz_link, course_type, category_id)
                 VALUES (?,?,?,?,?,?,?,?)`,
                [title, level, resolvedDuration, description || "", media || "", quiz_link || "", course_type || "video", id],
                function(err) {
                    if (err) return res.status(500).json({ message: err.message });
                    res.json({ id: this.lastID, title, level, duration: resolvedDuration, description, media, quiz_link, course_type: course_type || "video" });
                }
            );
        })
        .catch((err) => res.status(500).json({ message: err.message }));
});

router.get("/courses/detect-duration", async (req, res) => {
    const media = req.query.url || "";
    if (!String(media).trim()) return res.json({ duration: "" });
    try {
        const duration = await resolveCourseDuration(media, "");
        res.json({ duration });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ---------- SINGLE COURSE (UPDATE / DELETE) ----------
router.put("/courses/:id", (req, res) => {
    const { id } = req.params;
    const { title, level, duration, description, media, quiz_link, course_type } = req.body;
    if (!title) return res.status(400).json({ message: "Titre requis" });
    resolveCourseDuration(media, duration)
        .then((resolvedDuration) => {
            db.run(
                `UPDATE courses SET title=?, level=?, duration=?, description=?, media=?, quiz_link=?, course_type=? WHERE id=?`,
                [title, level, resolvedDuration, description || "", media || "", quiz_link || "", course_type || "video", id],
                function(err) {
                    if (err) return res.status(500).json({ message: err.message });
                    if (this.changes === 0) return res.status(404).json({ message: "Cours non trouvé" });
                    res.json({ message: "Cours mis à jour", duration: resolvedDuration });
                }
            );
        })
        .catch((err) => res.status(500).json({ message: err.message }));
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
