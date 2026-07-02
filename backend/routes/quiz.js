const express = require("express");
const router = express.Router();
const db = require("../database/database");

// ---------- GET all quizzes (with optional category filter) ----------
router.get("/", (req, res) => {
    const { category_id } = req.query;
    let sql = `
        SELECT q.id, q.title, q.description, q.category_id,
               cat.name AS category_name,
               COUNT(DISTINCT qs.id) AS question_count
        FROM quizzes q
        LEFT JOIN categories cat ON cat.id = q.category_id
        LEFT JOIN questions qs ON qs.quiz_id = q.id
    `;
    const params = [];
    if (category_id) {
        sql += " WHERE q.category_id = ?";
        params.push(category_id);
    }
    sql += " GROUP BY q.id ORDER BY q.created_at DESC";
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows || []);
    });
});

// ---------- POST a new quiz (optionally with questions) ----------
router.post("/", (req, res) => {
    const { title, description, category_id, questions } = req.body;
    if (!title) return res.status(400).json({ message: "Titre requis" });

    db.run(
        "INSERT INTO quizzes (title, description, category_id) VALUES (?,?,?)",
        [title, description || "", category_id || null],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            const quizId = this.lastID;

            if (Array.isArray(questions) && questions.length > 0) {
                const stmt = db.prepare(
                    `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                     VALUES (?,?,?,?,?,?,?)`
                );
                questions.forEach((q) => {
                    const { question_text, option_a, option_b, option_c, option_d, correct_option } = q;
                    stmt.run([quizId, question_text, option_a, option_b, option_c, option_d, correct_option]);
                });
                stmt.finalize();
            }

            res.json({ id: quizId, title, description });
        }
    );
});

// ---------- POST submit answers for a quiz ----------
router.post("/:quizId/submit", (req, res) => {
    const { quizId } = req.params;
    const { firebase_uid, answers } = req.body;

    if (!firebase_uid || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Données invalides" });
    }

    // Delete previous answers for this user/quiz → fresh attempt
    db.run("DELETE FROM user_answers WHERE firebase_uid = ? AND quiz_id = ?", [firebase_uid, quizId], (err) => {
        if (err) return res.status(500).json({ message: err.message });

        // Fetch correct answers
        db.all("SELECT id, correct_option FROM questions WHERE quiz_id = ?", [quizId], (err, questions) => {
            if (err) return res.status(500).json({ message: err.message });
            if (questions.length === 0) return res.status(404).json({ message: "Aucune question pour ce quiz" });

            const correctMap = {};
            questions.forEach(q => { correctMap[q.id] = q.correct_option; });

            const stmt = db.prepare(
                "INSERT INTO user_answers (firebase_uid, quiz_id, question_id, selected_option, is_correct) VALUES (?,?,?,?,?)"
            );
            let correctCount = 0;
            const answerMap = new Map(answers.map((ans) => [Number(ans.question_id), ans.selected_option]));
            const details = questions.map((q) => {
                const selectedOption = answerMap.get(q.id) || null;
                const isCorrect = selectedOption === q.correct_option;
                if (isCorrect) correctCount++;
                return {
                    question_id: q.id,
                    question_text: q.question_text,
                    selected_option: selectedOption,
                    correct_option: q.correct_option,
                    is_correct: isCorrect,
                };
            });

            answers.forEach(ans => {
                const isCorrect = ans.selected_option === correctMap[ans.question_id] ? 1 : 0;
                stmt.run([firebase_uid, quizId, ans.question_id, ans.selected_option, isCorrect]);
            });
            stmt.finalize();

            const totalQuestions = questions.length;
            const score = Math.round((correctCount / totalQuestions) * 100);
            const success = score >= 80;

            if (success) {
                const message = `Félicitations ! Vous avez réussi le quiz avec un score de ${score}%.`;
                db.run(
                    "INSERT INTO notifications (firebase_uid, message, type) VALUES (?, ?, ?)",
                    [firebase_uid, message, "quiz_success"]
                );
            }

            res.json({
                totalQuestions,
                correctCount,
                score,
                success,
                details,
                message: `Vous avez obtenu ${score}% (${correctCount}/${totalQuestions})`,
            });
        });
    });
});

// ---------- GET quiz for taking (no correct answers) ----------
router.get("/:id/take", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM quizzes WHERE id = ?", [id], (err, quiz) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!quiz) return res.status(404).json({ message: "Quiz non trouvé" });
        db.all(
            "SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE quiz_id = ? ORDER BY id",
            [id],
            (err, questions) => {
                if (err) return res.status(500).json({ message: err.message });
                res.json({ quiz, questions: questions || [] });
            }
        );
    });
});

// ---------- GET a single quiz (with its questions) ----------
router.get("/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM quizzes WHERE id = ?", [id], (err, quiz) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!quiz) return res.status(404).json({ message: "Quiz non trouvé" });
        db.all("SELECT * FROM questions WHERE quiz_id = ? ORDER BY id", [id], (err, questions) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ quiz, questions: questions || [] });
        });
    });
});

// ---------- PUT update a quiz (replace all questions) ----------
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, category_id, questions } = req.body;
    if (!title) return res.status(400).json({ message: "Titre requis" });

    db.run(
        "UPDATE quizzes SET title = ?, description = ?, category_id = ? WHERE id = ?",
        [title, description || "", category_id || null, id],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Quiz non trouvé" });

            db.run("DELETE FROM questions WHERE quiz_id = ?", [id], (err) => {
                if (err) return res.status(500).json({ message: err.message });

                if (Array.isArray(questions) && questions.length > 0) {
                    const stmt = db.prepare(
                        `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                         VALUES (?,?,?,?,?,?,?)`
                    );
                    questions.forEach((q) => {
                        const { question_text, option_a, option_b, option_c, option_d, correct_option } = q;
                        stmt.run([id, question_text, option_a, option_b, option_c, option_d, correct_option]);
                    });
                    stmt.finalize();
                }
                res.json({ message: "Quiz mis à jour" });
            });
        }
    );
});

// ---------- DELETE a quiz ----------
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM quizzes WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Quiz non trouvé" });
        res.json({ message: "Quiz supprimé" });
    });
});

module.exports = router;
