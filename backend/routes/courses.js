// backend/routes/courses.js
const express = require("express");
const router = express.Router();
const db = require("../database/database");

// GET /api/courses – returns all courses with category name
router.get("/", (req, res) => {
  const sql = `
    SELECT c.*, cat.name AS category_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY cat.name, c.title
  `;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// GET /api/courses/user/:uid – returns only courses started by the user
router.get("/user/:uid", (req, res) => {
  const { uid } = req.params;
  const sql = `
    SELECT c.*, cat.name AS category_name, up.progress
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    INNER JOIN user_progress up ON up.course_id = c.id AND up.firebase_uid = ?
    ORDER BY cat.name, c.title
  `;
  db.all(sql, [uid], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// GET /api/courses/:id
router.get("/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM courses WHERE id = ?", [id], (err, course) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!course) return res.status(404).json({ message: "Course not found" });
        res.json(course);
    });
});
// GET /api/courses/user/:uid – cours avec progression
router.get("/user/:uid", (req, res) => {
    const { uid } = req.params;
    const sql = `
        SELECT c.id, c.title, c.category_id, c.level, c.duration,
               c.description, c.media, c.quiz_link, c.course_type,
               up.progress, up.last_watched_at
        FROM user_progress up
        JOIN courses c ON c.id = up.course_id
        WHERE up.firebase_uid = ?
        ORDER BY up.last_watched_at DESC
    `;
    db.all(sql, [uid], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows || []);
    });
});

module.exports = router;
