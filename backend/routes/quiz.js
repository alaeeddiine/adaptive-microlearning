const express = require("express");
const router = express.Router();
const db = require("../database/database");

const VALID_OPTIONS = new Set(["A", "B", "C", "D"]);

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function normalizeQuestions(questions) {
    if (!Array.isArray(questions)) return [];

    return questions
        .map((q) => ({
            question_text: String(q.question_text || "").trim(),
            option_a: String(q.option_a || "").trim(),
            option_b: String(q.option_b || "").trim(),
            option_c: String(q.option_c || "").trim(),
            option_d: String(q.option_d || "").trim(),
            correct_option: String(q.correct_option || "A").trim().toUpperCase(),
        }))
        .filter((q) =>
            q.question_text &&
            q.option_a &&
            q.option_b &&
            q.option_c &&
            q.option_d &&
            VALID_OPTIONS.has(q.correct_option)
        );
}

async function insertQuestions(quizId, questions) {
    for (const q of questions) {
        await runAsync(
            `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
             VALUES (?,?,?,?,?,?,?)`,
            [quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
        );
    }
}

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

router.post("/", async (req, res) => {
    const { title, description, category_id, questions } = req.body;
    const cleanTitle = String(title || "").trim();
    const cleanQuestions = normalizeQuestions(questions);

    if (!cleanTitle) return res.status(400).json({ message: "Titre requis" });
    if (cleanQuestions.length === 0) {
        return res.status(400).json({ message: "Ajoutez au moins une question complete" });
    }

    try {
        await runAsync("BEGIN TRANSACTION");
        const result = await runAsync(
            "INSERT INTO quizzes (title, description, category_id) VALUES (?,?,?)",
            [cleanTitle, description || "", category_id || null]
        );
        await insertQuestions(result.lastID, cleanQuestions);
        await runAsync("COMMIT");

        res.json({
            id: result.lastID,
            title: cleanTitle,
            description: description || "",
            question_count: cleanQuestions.length,
        });
    } catch (err) {
        await runAsync("ROLLBACK").catch(() => {});
        res.status(500).json({ message: err.message });
    }
});

router.post("/:quizId/submit", (req, res) => {
    const { quizId } = req.params;
    const { firebase_uid, answers } = req.body;

    if (!firebase_uid || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Donnees invalides" });
    }

    db.run("DELETE FROM user_answers WHERE firebase_uid = ? AND quiz_id = ?", [firebase_uid, quizId], (err) => {
        if (err) return res.status(500).json({ message: err.message });

        db.all(
            `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
             FROM questions
             WHERE quiz_id = ?
             ORDER BY id`,
            [quizId],
            (err, questions) => {
                if (err) return res.status(500).json({ message: err.message });
                if (questions.length === 0) return res.status(404).json({ message: "Aucune question pour ce quiz" });

                const answerMap = new Map(
                    answers.map((ans) => [Number(ans.question_id), String(ans.selected_option || "").toUpperCase()])
                );
                let correctCount = 0;

                const details = questions.map((q) => {
                    const selectedOption = answerMap.get(q.id) || null;
                    const isCorrect = selectedOption === q.correct_option;
                    if (isCorrect) correctCount++;
                    return {
                        question_id: q.id,
                        question_text: q.question_text,
                        option_a: q.option_a,
                        option_b: q.option_b,
                        option_c: q.option_c,
                        option_d: q.option_d,
                        selected_option: selectedOption,
                        correct_option: q.correct_option,
                        is_correct: isCorrect,
                    };
                });

                const stmt = db.prepare(
                    "INSERT INTO user_answers (firebase_uid, quiz_id, question_id, selected_option, is_correct) VALUES (?,?,?,?,?)"
                );

                for (const item of details) {
                    stmt.run([
                        firebase_uid,
                        quizId,
                        item.question_id,
                        item.selected_option,
                        item.is_correct ? 1 : 0,
                    ]);
                }

                stmt.finalize((err) => {
                    if (err) return res.status(500).json({ message: err.message });

                    const totalQuestions = questions.length;
                    const score = Math.round((correctCount / totalQuestions) * 100);
                    const success = score >= 80;

                    if (success) {
                        db.run(
                            "INSERT INTO notifications (firebase_uid, message, type) VALUES (?, ?, ?)",
                            [firebase_uid, `Felicitations ! Vous avez reussi le quiz avec un score de ${score}%.`, "quiz_success"]
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
            }
        );
    });
});

router.get("/:id/take", (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM quizzes WHERE id = ?", [id], (err, quiz) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!quiz) return res.status(404).json({ message: "Quiz non trouve" });

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

router.get("/:id", (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM quizzes WHERE id = ?", [id], (err, quiz) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!quiz) return res.status(404).json({ message: "Quiz non trouve" });

        db.all("SELECT * FROM questions WHERE quiz_id = ? ORDER BY id", [id], (err, questions) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ quiz, questions: questions || [] });
        });
    });
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, category_id, questions } = req.body;
    const cleanTitle = String(title || "").trim();
    const cleanQuestions = normalizeQuestions(questions);

    if (!cleanTitle) return res.status(400).json({ message: "Titre requis" });
    if (cleanQuestions.length === 0) {
        return res.status(400).json({ message: "Ajoutez au moins une question complete" });
    }

    try {
        await runAsync("BEGIN TRANSACTION");
        const result = await runAsync(
            "UPDATE quizzes SET title = ?, description = ?, category_id = ? WHERE id = ?",
            [cleanTitle, description || "", category_id || null, id]
        );

        if (result.changes === 0) {
            await runAsync("ROLLBACK");
            return res.status(404).json({ message: "Quiz non trouve" });
        }

        await runAsync("DELETE FROM questions WHERE quiz_id = ?", [id]);
        await insertQuestions(id, cleanQuestions);
        await runAsync("COMMIT");

        res.json({ message: "Quiz mis a jour", question_count: cleanQuestions.length });
    } catch (err) {
        await runAsync("ROLLBACK").catch(() => {});
        res.status(500).json({ message: err.message });
    }
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;

    db.serialize(() => {
        db.run("DELETE FROM user_answers WHERE quiz_id = ?", [id]);
        db.run("DELETE FROM questions WHERE quiz_id = ?", [id]);
        db.run("DELETE FROM quizzes WHERE id = ?", [id], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Quiz non trouve" });
            res.json({ message: "Quiz supprime" });
        });
    });
});

module.exports = router;
