const express = require("express");
const router = express.Router();
const db = require("../database/database");

router.get("/:uid", (req, res) => {
    const { uid } = req.params;

    // 1. Courses with progress
    db.all(
        `SELECT c.id, c.title, c.description, c.level, c.duration, c.media, c.quiz_link,
                c.category_id, cat.name AS category_name,
                COALESCE(up.progress, 0) AS progress
         FROM courses c
         LEFT JOIN categories cat ON cat.id = c.category_id
         LEFT JOIN user_progress up ON up.course_id = c.id AND up.firebase_uid = ?
         ORDER BY cat.name, c.title`,
        [uid],
        (err, courses) => {
            if (err) {
                console.error("Courses query error:", err);
                courses = [];
            }
            courses = (courses || []).map(c => ({ ...c, type: "course" }));

            // 2. Quizzes with progress
            db.all(
                `SELECT q.id, q.title, q.description, q.category_id,
                        cat.name AS category_name,
                        COALESCE(progress, 0) AS progress
                 FROM quizzes q
                 LEFT JOIN categories cat ON cat.id = q.category_id
                 LEFT JOIN (
                     SELECT ua.quiz_id,
                            ROUND((SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(qs.id)) AS progress
                     FROM user_answers ua
                     JOIN questions qs ON qs.id = ua.question_id
                     WHERE ua.firebase_uid = ?
                     GROUP BY ua.quiz_id
                 ) prog ON prog.quiz_id = q.id
                 ORDER BY cat.name, q.title`,
                [uid],
                (err, quizzes) => {
                    if (err) {
                        console.error("Quizzes query error:", err);
                        quizzes = [];
                    }
                    quizzes = (quizzes || []).map(q => ({ ...q, type: "quiz" }));

                    res.json([...courses, ...quizzes]);
                }
            );
        }
    );
});

// POST /api/catalog/abandon – abandonner un cours/quiz
router.post("/abandon", (req, res) => {
    const { firebase_uid, course_id, type } = req.body;
    if (!firebase_uid || !course_id || !type) {
        return res.status(400).json({ message: "Champs requis" });
    }

    if (type === "course") {
        db.run(
            "DELETE FROM user_progress WHERE firebase_uid = ? AND course_id = ?",
            [firebase_uid, course_id],
            function (err) {
                if (err) return res.status(500).json({ message: err.message });
                res.json({ message: "Cours abandonné" });
            }
        );
    } else if (type === "quiz") {
        db.run(
            "DELETE FROM user_answers WHERE firebase_uid = ? AND quiz_id = ?",
            [firebase_uid, course_id],
            function (err) {
                if (err) return res.status(500).json({ message: err.message });
                res.json({ message: "Quiz abandonné" });
            }
        );
    } else {
        res.status(400).json({ message: "Type invalide" });
    }
});

module.exports = router;