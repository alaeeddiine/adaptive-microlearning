const express = require("express");
const router = express.Router();
const db = require("../database/database");

router.get("/status", (req, res) => {
    const { firebase_uid, course_id } = req.query;
    if (!firebase_uid || !course_id) {
        return res.status(400).json({ message: "firebase_uid et course_id requis" });
    }

    db.get(
        `SELECT id, created_at
         FROM arcs_responses
         WHERE firebase_uid = ? AND course_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [firebase_uid, course_id],
        (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({
                hasResponse: !!row,
                submitted_at: row?.created_at || null,
            });
        }
    );
});

router.post("/", (req, res) => {
    const {
        firebase_uid,
        course_id,
        attention,
        relevance,
        confidence,
        satisfaction,
        ab_group,
    } = req.body;

    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });
    if (!course_id) return res.status(400).json({ message: "course_id requis" });

    db.get(
        `SELECT id FROM arcs_responses WHERE firebase_uid = ? AND course_id = ? ORDER BY id DESC LIMIT 1`,
        [firebase_uid, course_id],
        (checkErr, existing) => {
            if (checkErr) return res.status(500).json({ message: checkErr.message });
            if (existing) {
                return res.json({ id: existing.id, message: "Réponse ARCS déjà enregistrée" });
            }

            const sql = `INSERT INTO arcs_responses (firebase_uid, course_id, attention, relevance, confidence, satisfaction, ab_group)
                         VALUES (?,?,?,?,?,?,?)`;
            db.run(
                sql,
                [firebase_uid, course_id, attention, relevance, confidence, satisfaction, ab_group],
                function (err) {
                    if (err) return res.status(500).json({ message: err.message });
                    res.json({ id: this.lastID, message: "Réponse ARCS enregistrée" });
                }
            );
        }
    );
});

module.exports = router;
