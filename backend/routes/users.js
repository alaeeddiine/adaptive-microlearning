// backend/routes/users.js

const express = require("express");
const router = express.Router();
const db = require("../database/database");

// Route d'inscription existante (POST /)
router.post("/", (req, res) => {
    const { firebase_uid, name, email } = req.body;
    const sql = `INSERT INTO users(firebase_uid, name, email, created_at)
                 VALUES(?,?,?,datetime('now'))`;
    db.run(sql, [firebase_uid, name, email], function(err) {
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

module.exports = router;