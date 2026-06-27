const express = require("express");
const router = express.Router();
const db = require("../database/database");
const fetch = require("node-fetch");

// POST /api/session – save context, get ML recommendations
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

        // 3. Build feature vector for ML
        const features = {
            age: user.age || "21-30",
            education: user.education || "Université",
            mastery: user.mastery || "Intermédiaire",
            competence: user.competence || "Intermédiaire",
            time_available: time_available || "15-30 min",
            connection_level: connection_level || "Élevé",
            device_type: device_type || "Mobile",
            battery_level: battery_level || "Moyen",
            time_of_day: time_of_day || "Après-midi",
        };

        try {
            // 4. Call Python ML service
            const flaskResponse = await fetch("http://localhost:5001/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features }),
            });
            const result = await flaskResponse.json();
            if (result.error) return res.status(500).json({ message: result.error });

            const recommendedIds = result.recommendations; // array of course IDs
            if (!recommendedIds || recommendedIds.length === 0) return res.json([]);

            // 5. Fetch those courses from DB
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

module.exports = router;