const express = require("express");
const router = express.Router();
const db = require("../database/database");
const fetch = require("node-fetch"); // npm install node-fetch

router.post("/", async (req, res) => {
    const { firebase_uid } = req.body;
    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    // 1. Get user's questionnaire & stats from SQLite
    db.get(
        `SELECT u.*, 
                (SELECT AVG(progress) FROM user_progress up WHERE up.firebase_uid = u.firebase_uid) AS avg_progress
         FROM users u WHERE u.firebase_uid = ?`,
        [firebase_uid],
        async (err, user) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

            // 2. Build feature vector (must match the training columns)
            const features = {
                age: user.age || "21-30",
                education: user.education || "Université",
                mastery: user.mastery || "Intermédiaire",
                competence: user.competence || "Intermédiaire",
                avg_progress: user.avg_progress || 0,
                // add any other features your model requires
            };

            try {
                const flaskResponse = await fetch("http://localhost:5001/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ features }),
                });
                const result = await flaskResponse.json();
                if (result.error) return res.status(500).json({ message: result.error });

                const recommendedIds = result.recommendations; // array of course IDs

                // 3. Fetch those courses from the database
                if (!recommendedIds.length) return res.json([]);
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
                console.error("Flask service error:", err);
                res.status(500).json({ message: "Erreur du service de recommandation" });
            }
        }
    );
});

module.exports = router;