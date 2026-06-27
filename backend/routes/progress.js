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
    let seconds = 0;
    const hourMatch = dur.match(/(\d+)\s*h/i);
    const minMatch = dur.match(/(\d+)\s*m/i);
    if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
    if (minMatch) seconds += parseInt(minMatch[1]) * 60;
    if (seconds === 0) {
        const parts = dur.split(":").map(Number);
        if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
        else if (parts.length === 2) seconds = parts[0]*60 + parts[1];
        else {
            // Try parsing as just minutes (e.g., "2" or "2.5")
            const num = parseFloat(dur);
            if (!isNaN(num)) seconds = num * 60;
        }
    }
    return seconds;
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
        if (err) return res.status(500).json({ message: err.message });
        let totalProgress = 0;
        let completedCourses = 0;
        rows.forEach(row => {
            totalProgress += row.progress || 0;
            if (row.progress >= 100) completedCourses++;
        });
        const avgProgress = rows.length > 0 ? Math.round(totalProgress / rows.length) : 0;
        res.json({ avgProgress, completedCourses, courseCount: rows.length });
    });
});

module.exports = router;