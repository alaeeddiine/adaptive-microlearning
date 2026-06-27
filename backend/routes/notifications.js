const express = require("express");
const router = express.Router();
const db = require("../database/database");

// Obtenir les notifications d’un utilisateur
router.get("/:uid", (req, res) => {
    const { uid } = req.params;
    db.all(
        "SELECT id, message, type, read, created_at FROM notifications WHERE firebase_uid = ? ORDER BY created_at DESC LIMIT 50",
        [uid],
        (err, rows) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(rows || []);
        }
    );
});

// Ajouter une notification
router.post("/", (req, res) => {
    const { firebase_uid, message, type } = req.body;
    if (!firebase_uid || !message)
        return res.status(400).json({ message: "Champs requis" });

    db.run(
        "INSERT INTO notifications (firebase_uid, message, type) VALUES (?, ?, ?)",
        [firebase_uid, message, type || "info"],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ id: this.lastID, message, type: type || "info" });
        }
    );
});

// Marquer comme lue(s)
router.put("/read", (req, res) => {
    const { firebase_uid, ids } = req.body; // ids peut être un tableau ou "all"
    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    if (ids === "all") {
        db.run("UPDATE notifications SET read = 1 WHERE firebase_uid = ?", [firebase_uid], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Tout marqué comme lu" });
        });
    } else if (Array.isArray(ids) && ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        db.run(
            `UPDATE notifications SET read = 1 WHERE firebase_uid = ? AND id IN (${placeholders})`,
            [firebase_uid, ...ids],
            (err) => {
                if (err) return res.status(500).json({ message: err.message });
                res.json({ message: "Notifications marquées comme lues" });
            }
        );
    } else {
        res.status(400).json({ message: "Paramètre ids invalide" });
    }
});

module.exports = router;