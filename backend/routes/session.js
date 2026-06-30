const express = require("express");
const router = express.Router();
const db = require("../database/database");
const fetch = require("node-fetch");

// Moteur de règles pour le groupe B (contrôle)
function applyRuleEngine(user, context) {
    const { time_available, connection_level, device_type, battery_level, time_of_day } = context;

    let contentType = "video"; // par défaut
    let maxDuration = 30;

    // Règle 1 : Connexion faible → texte
    if (connection_level === "Faible" || connection_level === "2g" || connection_level === "slow-2g") {
        contentType = "texte";
    }
    // Règle 2 : Batterie faible → texte court
    if (battery_level === "Faible") {
        contentType = "texte";
        maxDuration = 5;
    }
    // Règle 3 : Mobile + matin ou soir → audio
    if (device_type === "Mobile" && (time_of_day === "Matin" || time_of_day === "Soir")) {
        contentType = "audio";
    }
    // Règle 4 : Temps très court → quiz rapide
    if (time_available === "Moins de 15 min") {
        contentType = "quiz";
        maxDuration = 10;
    }
    // Règle 5 : Temps long → vidéo longue
    if (time_available === "Plus d'1h") {
        contentType = "video";
        maxDuration = 60;
    }

    return { contentType, maxDuration };
}

// POST /api/session – save context, get recommendations (manual session)
router.post("/", async (req, res) => {
    const {
        firebase_uid,
        time_available,
        connection_level,
        device_type,
        battery_level,
        time_of_day,
    } = req.body;

    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    // 1. Save session context
    db.run(
        `INSERT INTO session_context (firebase_uid, time_available, connection_level, device_type, battery_level, time_of_day)
         VALUES (?,?,?,?,?,?)`,
        [firebase_uid, time_available, connection_level, device_type, battery_level, time_of_day],
        (err) => {
            if (err) console.error("Erreur sauvegarde contexte :", err);
        }
    );

    // 2. Fetch user profile
    db.get("SELECT * FROM users WHERE firebase_uid = ?", [firebase_uid], async (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const abGroup = user.ab_group || "A";

        const context = {
            time_available: time_available || "15-30 min",
            connection_level: connection_level || "Élevé",
            device_type: device_type || "Mobile",
            battery_level: battery_level || "Moyen",
            time_of_day: time_of_day || "Après-midi",
        };

        // ---- Groupe B : moteur de règles ----
        if (abGroup === "B") {
            const ruleResult = applyRuleEngine(user, context);
            db.get(
                `SELECT c.*, cat.name AS category_name
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 WHERE c.title LIKE ?
                 ORDER BY RANDOM() LIMIT 1`,
                [`%${ruleResult.contentType}%`],
                (err, course) => {
                    if (err) return res.status(500).json({ message: err.message });
                    db.all(
                        `SELECT c.*, cat.name AS category_name
                         FROM courses c
                         LEFT JOIN categories cat ON c.category_id = cat.id
                         WHERE c.id != ?
                         ORDER BY RANDOM() LIMIT 2`,
                        [course?.id || 0],
                        (err, extraCourses) => {
                            if (err) return res.status(500).json({ message: err.message });
                            const result = course ? [course, ...extraCourses] : extraCourses;
                            res.json(result);
                        }
                    );
                }
            );
            return;
        }

        // ---- Groupe A : ML ----
        const features = {
            age: user.age || "21-30",
            education: user.education || "Université",
            mastery: user.mastery || "Intermédiaire",
            competence: user.competence || "Intermédiaire",
            ...context,
        };

        try {
            const flaskResponse = await fetch("http://localhost:5001/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features }),
            });
            const result = await flaskResponse.json();
            if (result.error) return res.status(500).json({ message: result.error });

            const recommendedIds = result.recommendations;
            if (!recommendedIds || recommendedIds.length === 0) return res.json([]);

            const placeholders = recommendedIds.map(() => "?").join(",");
            db.all(
                `SELECT c.*, cat.name AS category_name
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 WHERE c.id IN (${placeholders})`,
                recommendedIds,
                (err, courses) => {
                    if (err) return res.status(500).json({ message: err.message });
                    res.json(courses || []);
                }
            );
        } catch (err) {
            console.error("Flask error:", err);
            res.status(500).json({ message: "Erreur du service de recommandation" });
        }
    });
});

// POST /api/session/auto – automatic context collection (device, network, time)
router.post("/auto", (req, res) => {
    const { firebase_uid, device_type, connection_level, time_of_day } = req.body;

    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    const time_available = "Non spécifié";
    const battery_level = "Non spécifié";

    db.run(
        `INSERT INTO session_context (firebase_uid, time_available, connection_level, device_type, battery_level, time_of_day)
         VALUES (?,?,?,?,?,?)`,
        [firebase_uid, time_available, connection_level, device_type, battery_level, time_of_day],
        function(err) {
            if (err) {
                console.error("Erreur sauvegarde auto session :", err);
                return res.status(500).json({ message: err.message });
            }
            res.json({ id: this.lastID, message: "Contexte automatique enregistré" });
        }
    );
});
// PUT /api/session/duration – update duration of the latest session
router.put("/duration", (req, res) => {
    const { firebase_uid, duration } = req.body;
    if (!firebase_uid || duration == null)
        return res.status(400).json({ message: "firebase_uid et duration requis" });

    db.run(
        `UPDATE session_context SET duration = ? WHERE firebase_uid = ? AND id = (
            SELECT id FROM session_context WHERE firebase_uid = ? ORDER BY created_at DESC LIMIT 1
        )`,
        [duration, firebase_uid, firebase_uid],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Aucune session trouvée" });
            res.json({ message: "Durée mise à jour" });
        }
    );
});

module.exports = router;