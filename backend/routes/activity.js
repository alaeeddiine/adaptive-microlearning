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

module.exports = router;