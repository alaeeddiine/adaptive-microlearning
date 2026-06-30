const express = require("express");
const router = express.Router();
const db = require("../database/database");
const fetch = require("node-fetch");

// POST /api/recommendations
router.post("/", async (req, res) => {
    const { firebase_uid } = req.body;
    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    // Récupérer le groupe A/B
    db.get("SELECT ab_group FROM users WHERE firebase_uid = ?", [firebase_uid], async (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const abGroup = user.ab_group || "A";

        // ---------- GROUPE B : tout le contenu ----------
        if (abGroup === "B") {
            // Récupérer tous les cours
            db.all(
                `SELECT c.*, cat.name AS category_name, 'course' AS type
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 ORDER BY cat.name, c.title`,
                (err, courses) => {
                    if (err) { courses = []; }

                    // Récupérer tous les quiz
                    db.all(
                        `SELECT q.*, cat.name AS category_name, 'quiz' AS type
                         FROM quizzes q
                         LEFT JOIN categories cat ON cat.id = q.category_id
                         ORDER BY cat.name, q.title`,
                        (err, quizzes) => {
                            if (err) { quizzes = []; }
                            res.json({ predictedType: null, courses: [...courses, ...quizzes] });
                        }
                    );
                }
            );
            return;
        }

        // ---------- GROUPE A : recommandation personnalisée ----------
        db.get("SELECT * FROM users WHERE firebase_uid = ?", [firebase_uid], async (err, userProfile) => {
            if (err) return res.status(500).json({ message: err.message });
            if (!userProfile) return res.status(404).json({ message: "Profil non trouvé" });

            db.get(
                `SELECT * FROM session_context
                WHERE firebase_uid = ?
                ORDER BY created_at DESC LIMIT 1`,
                [firebase_uid],
                async (err, lastSession) => {
                    if (err) lastSession = {};

                    const features = {
                        age: userProfile.age || "21-30",
                        education: userProfile.education || "Université",
                        mastery: userProfile.mastery || "Intermédiaire",
                        competence: userProfile.competence || "Intermédiaire",
                        ...(lastSession ? {
                            time_available: lastSession.time_available || "15-30 min",
                            connection_level: lastSession.connection_level || "Élevé",
                            device_type: lastSession.device_type || "Mobile",
                            battery_level: lastSession.battery_level || "Moyen",
                            time_of_day: lastSession.time_of_day || "Après-midi",
                        } : {}),
                    };

                    try {
                        const flaskResponse = await fetch("http://localhost:5001/predict", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ features }),
                        });
                        const result = await flaskResponse.json();
                        if (result.error) return res.json({ predictedType: null, courses: [] });

                        const recommendations = result.recommendations;
                        if (!recommendations || recommendations.length === 0) {
                            return res.json({ predictedType: null, courses: [] });
                        }

                        const contentType = Array.isArray(recommendations) ? recommendations[0] : recommendations;

                        // ---- SMART MAPPING based on predicted type ----
                        if (contentType.toLowerCase() === "quiz") {
                            // Return all quizzes
                            db.all(
                                `SELECT q.*, cat.name AS category_name, 'quiz' AS type
                                FROM quizzes q
                                LEFT JOIN categories cat ON cat.id = q.category_id
                                ORDER BY cat.name, q.title`,
                                (err, quizzes) => {
                                    if (err) quizzes = [];
                                    res.json({ predictedType: "Quiz", courses: quizzes });
                                }
                            );
                            return;
                        }

                        if (contentType.toLowerCase() === "vidéo" || contentType.toLowerCase() === "video") {
                            // Return courses that have a media URL (assumed to be video)
                            db.all(
                                `SELECT c.*, cat.name AS category_name, 'course' AS type
                                FROM courses c
                                LEFT JOIN categories cat ON c.category_id = cat.id
                                WHERE c.media IS NOT NULL AND c.media != ''
                                ORDER BY cat.name, c.title`,
                                (err, courses) => {
                                    if (err) courses = [];
                                    // Also include quizzes that might be relevant? No, video is only courses.
                                    res.json({ predictedType: "Vidéo", courses });
                                }
                            );
                            return;
                        }

                        // For other types (Infographie, Texte, Audio, etc.), use text matching
                        const likePattern = `%${contentType}%`;
                        db.all(
                            `SELECT c.*, cat.name AS category_name, 'course' AS type
                            FROM courses c
                            LEFT JOIN categories cat ON c.category_id = cat.id
                            WHERE c.title LIKE ? OR c.description LIKE ?
                            ORDER BY cat.name, c.title`,
                            [likePattern, likePattern],
                            (err, courses) => {
                                if (err) courses = [];
                                db.all(
                                    `SELECT q.*, cat.name AS category_name, 'quiz' AS type
                                    FROM quizzes q
                                    LEFT JOIN categories cat ON cat.id = q.category_id
                                    WHERE q.title LIKE ? OR q.description LIKE ?
                                    ORDER BY cat.name, q.title`,
                                    [likePattern, likePattern],
                                    (err, quizzes) => {
                                        if (err) quizzes = [];
                                        const all = [...courses, ...quizzes];
                                        res.json({ predictedType: contentType, courses: all });
                                    }
                                );
                            }
                        );
                    } catch (err) {
                        console.error("Flask error:", err);
                        res.status(500).json({ message: "Erreur du service de recommandation" });
                    }
                }
            );
        });
    });
});

module.exports = router;