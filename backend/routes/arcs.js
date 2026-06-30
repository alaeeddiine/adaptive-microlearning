// backend/routes/arcs.js
const express = require("express");
const router = express.Router();
const db = require("../database/database");

router.post("/", (req, res) => {
    const {
        firebase_uid, course_id,
        attention, relevance, confidence, satisfaction,
        ab_group,
    } = req.body;

    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    const sql = `INSERT INTO arcs_responses (firebase_uid, course_id, attention, relevance, confidence, satisfaction, ab_group)
                 VALUES (?,?,?,?,?,?,?)`;
    db.run(
        sql,
        [firebase_uid, course_id || null, attention, relevance, confidence, satisfaction, ab_group],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ id: this.lastID, message: "Réponse ARCS enregistrée" });
        }
    );
});

module.exports = router;