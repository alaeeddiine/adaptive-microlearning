const express = require("express");
const router = express.Router();
const db = require("../database/database");

router.post("/", (req, res) => {
    const { firebase_uid, course_id, event_type, event_data, ab_group } = req.body;
    if (!firebase_uid || !event_type) {
        return res.status(400).json({ message: "firebase_uid et event_type requis" });
    }

    const sql = `INSERT INTO user_activity (firebase_uid, course_id, event_type, event_data, ab_group)
                 VALUES (?,?,?,?,?)`;
    db.run(sql, [firebase_uid, course_id || null, event_type, JSON.stringify(event_data || {}), ab_group || null], function(err) {
        if (err) {
            console.error("Erreur activité:", err);
            return res.status(500).json({ message: err.message });
        }
        res.json({ id: this.lastID });
    });
});
router.get("/user/:uid", (req, res) => {
    const { uid } = req.params;
    db.all("SELECT * FROM user_activity WHERE firebase_uid = ? ORDER BY created_at DESC LIMIT 10", [uid], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows || []);
    });
});
router.get("/weekly/:uid", (req, res) => {
    const { uid } = req.params;
    const sql = `
        SELECT date(created_at) as day, COUNT(*) as count
        FROM user_activity
        WHERE firebase_uid = ? AND created_at >= date('now', '-6 days')
        GROUP BY day
        ORDER BY day
    `;
    db.all(sql, [uid], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const row = rows.find(r => r.day === dateStr);
            days.push(row ? row.count : 0);
        }
        res.json(days);
    });
});

module.exports = router;