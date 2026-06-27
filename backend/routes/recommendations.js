const express = require("express");
const router = express.Router();
const db = require("../database/database");
const fetch = require("node-fetch");

// POST /api/recommendations
router.post("/", async (req, res) => {
    const { firebase_uid } = req.body;
    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    // Récupérer le groupe A/B de l'utilisateur
    db.get("SELECT ab_group FROM users WHERE firebase_uid = ?", [firebase_uid], async (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const abGroup = user.ab_group || "A";

        // ---------- GROUPE B : tout le contenu, sans personnalisation ----------
        if (abGroup === "B") {
            db.all(
                `SELECT c.*, cat.name AS category_name
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 ORDER BY cat.name, c.title`,
                (err, courses) => {
                    if (err) return res.status(500).json({ message: err.message });
                    return res.json(courses || []);
                }
            );
            return;
        }

        // ---------- GROUPE A : recommandation personnalisée ----------
        db.get("SELECT * FROM users WHERE firebase_uid = ?", [firebase_uid], async (err, userProfile) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!userProfile) return res.status(404).json({ message: "Profil non trouvé" });

            // Features de base (questionnaire)
            const features = {
                age: userProfile.age || "21-30",
                education: userProfile.education || "Université",
                mastery: userProfile.mastery || "Intermédiaire",
                competence: userProfile.competence || "Intermédiaire",
            };

            try {
                const flaskResponse = await fetch("http://localhost:5001/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ features }),
                });
                const result = await flaskResponse.json();
                if (result.error) {
                    // Erreur du modèle → on renvoie un tableau vide (aucune reco)
                    return res.json([]);
                }

                // Le modèle renvoie un tableau avec un seul type (ex: ["Vidéo"])
                const recommendations = result.recommendations;
                if (!recommendations || recommendations.length === 0) {
                    return res.json([]);
                }

                const contentType = Array.isArray(recommendations) ? recommendations[0] : recommendations;

                // Chercher tous les cours dont le titre ou la description contient ce type
                const likePattern = `%${contentType}%`;
                db.all(
                    `SELECT c.*, cat.name AS category_name
                     FROM courses c
                     LEFT JOIN categories cat ON c.category_id = cat.id
                     WHERE c.title LIKE ? OR c.description LIKE ?
                     ORDER BY cat.name, c.title`,
                    [likePattern, likePattern],
                    (err, courses) => {
                        if (err) return res.status(500).json({ message: err.message });
                        // Renvoyer uniquement les cours correspondants (même vide)
                        res.json(courses || []);
                    }
                );
            } catch (err) {
                console.error("Flask error:", err);
                res.status(500).json({ message: "Erreur du service de recommandation" });
            }
        });
    });
});

module.exports = router;