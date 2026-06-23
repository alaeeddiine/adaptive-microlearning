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

module.exports = router;