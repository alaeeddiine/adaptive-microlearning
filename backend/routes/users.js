// backend/routes/users.js

const express = require("express");
const router = express.Router();
const db = require("../database/database");

// Route d'inscription existante (POST /)
router.post("/", (req, res) => {
    const { firebase_uid, name, email, ab_group } = req.body;
    const sql = `INSERT INTO users(firebase_uid, name, email, ab_group, created_at)
                 VALUES(?,?,?,?,datetime('now'))`;
    db.run(sql, [firebase_uid, name, email, ab_group || "A"], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: err.message });
        }
        res.json({ message: "User created", id: this.lastID });
    });
});

// 🆕 Route pour mettre à jour le questionnaire
router.put("/questionnaire", (req, res) => {
    const { firebase_uid, age, education, mastery, competence } = req.body;

    if (!firebase_uid) {
        return res.status(400).json({ message: "firebase_uid requis" });
    }

    const sql = `
        UPDATE users
        SET age = ?, education = ?, mastery = ?, competence = ?
        WHERE firebase_uid = ?
    `;

    db.run(sql, [age, education, mastery, competence, firebase_uid], function(err) {
        if (err) {
            console.error("Erreur mise à jour questionnaire :", err);
            return res.status(500).json({ message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.json({ message: "Questionnaire mis à jour" });
    });
});

router.delete("/:uid", (req, res) => {
    const { uid } = req.params;

    db.serialize(() => {
        db.run("DELETE FROM courses WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM user_progress WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM notifications WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM session_context WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM user_activity WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM arcs_responses WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM user_answers WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM user_badges WHERE firebase_uid = ?", [uid]);
        db.run("DELETE FROM users WHERE firebase_uid = ?", [uid], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
            res.json({ message: "Données utilisateur supprimées" });
        });
    });
});

module.exports = router;
