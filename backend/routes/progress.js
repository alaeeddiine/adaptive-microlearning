const express = require("express");
const router = express.Router();
const db = require("../database/database");

function computeProgress(segments, totalDuration) {
    if (!totalDuration || totalDuration <= 0) return 0;
    if (!segments || segments.length === 0) return 0;

    const sorted = [...segments].sort((a, b) => a[0] - b[0]);
    const merged = [];
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i][0] <= current[1]) {
            current[1] = Math.max(current[1], sorted[i][1]);
        } else {
            merged.push(current);
            current = sorted[i];
        }
    }
    merged.push(current);

    const totalWatched = merged.reduce((sum, seg) => sum + (seg[1] - seg[0]), 0);
    return Math.min(100, Math.round((totalWatched / totalDuration) * 100));
}

function parseDuration(dur) {
    if (!dur) return 0;
    // If already a number, assume minutes and convert to seconds
    if (typeof dur === "number") return dur * 60;
    dur = dur.toString().trim();

    // Try "Xh Ym" format
    const hourMatch = dur.match(/(\d+)\s*h/i);
    const minMatch = dur.match(/(\d+)\s*m/i);
    if (hourMatch || minMatch) {
        let seconds = 0;
        if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
        if (minMatch) seconds += parseInt(minMatch[1]) * 60;
        return seconds;
    }

    // Try HH:MM:SS or MM:SS
    const parts = dur.split(":").map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    // If nothing works, try parsing as a float (minutes)
    const floatVal = parseFloat(dur);
    if (!isNaN(floatVal)) return Math.round(floatVal * 60);
    return 0;
}

router.post("/", (req, res) => {
    const { firebase_uid, course_id, watched_segments, total_duration } = req.body;
    if (!firebase_uid || !course_id) return res.status(400).json({ message: "Missing fields" });

    const segmentsJSON = JSON.stringify(watched_segments || []);

    // Si une durée réelle est fournie, on l'utilise ; sinon on récupère celle du cours
    const computeFromDuration = (durationSec) => {
        const progress = computeProgress(watched_segments || [], durationSec);
        const sql = `
            INSERT INTO user_progress (firebase_uid, course_id, progress, watched_segments, last_watched_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(firebase_uid, course_id)
            DO UPDATE SET progress = excluded.progress, watched_segments = excluded.watched_segments, last_watched_at = datetime('now')
        `;
        db.run(sql, [firebase_uid, course_id, progress, segmentsJSON], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Progress saved", progress });
        });
    };

    if (total_duration && total_duration > 0) {
        computeFromDuration(total_duration);
    } else {
        db.get("SELECT duration FROM courses WHERE id = ?", [course_id], (err, course) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!course) return res.status(404).json({ message: "Course not found" });
            computeFromDuration(parseDuration(course.duration));
        });
    }
});

router.get("/:uid/:courseId", (req, res) => {
    const { uid, courseId } = req.params;
    db.get("SELECT * FROM user_progress WHERE firebase_uid = ? AND course_id = ?", [uid, courseId], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.json({ progress: 0, watched_segments: [] });
        try {
            row.watched_segments = JSON.parse(row.watched_segments || "[]");
        } catch (e) { row.watched_segments = []; }
        res.json(row);
    });
});

router.get("/stats/:uid", (req, res) => {
    const { uid } = req.params;

    db.all("SELECT progress, watched_segments FROM user_progress WHERE firebase_uid = ?", [uid], (err, rows) => {
        if (err) {
            return res.json({
                avgProgress: 0,
                totalWatchTime: "0m",
                completedCourses: 0,
                badges: 0,
                courseCount: 0,
            });
        }

        let totalSeconds = 0;
        let totalProgress = 0;
        let completedCourses = 0;
        const courseCount = rows.length;

        rows.forEach(row => {
            totalProgress += row.progress || 0;
            if (row.progress >= 100) completedCourses++;
            try {
                const segments = JSON.parse(row.watched_segments || "[]");
                totalSeconds += mergeAndSum(segments);
            } catch (e) {
                console.error("Parsing segments failed:", e);
            }
        });

        const avgProgress = courseCount > 0 ? Math.round(totalProgress / courseCount) : 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        res.json({
            avgProgress,
            totalWatchTime: formattedTime,
            completedCourses,
            badges: 0,
            courseCount,
        });
    });
});

module.exports = router;