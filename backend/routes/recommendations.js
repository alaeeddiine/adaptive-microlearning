const express = require("express");
const router = express.Router();
const db = require("../database/database");
const fetch = require("node-fetch");

const dbGet = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });

const dbAll = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });

const normalizeType = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const formatTypeLabel = (value) => {
    const type = normalizeType(value);
    if (type === "video") return "Vidéo";
    if (type === "text" || type === "texte") return "Texte";
    if (type === "infographie") return "Infographie";
    if (type === "quiz") return "Quiz";
    if (!type) return "Cours";
    return type.charAt(0).toUpperCase() + type.slice(1);
};

const inferCourseType = (row) => {
    const explicitType = normalizeType(row?.course_type);
    if (explicitType === "texte") return "text";
    if (explicitType === "video" || explicitType === "text" || explicitType === "infographie" || explicitType === "audio") {
        return explicitType;
    }

    const media = normalizeType(row?.media);
    if (
        media.includes("youtube.com") ||
        media.includes("youtu.be") ||
        media.endsWith(".mp4") ||
        media.endsWith(".webm") ||
        media.endsWith(".mov") ||
        media.endsWith(".m4v")
    ) {
        return "video";
    }

    if (media.endsWith(".png") || media.endsWith(".jpg") || media.endsWith(".jpeg") || media.endsWith(".webp") || media.endsWith(".gif") || media.endsWith(".svg")) {
        return "infographie";
    }

    if (media.endsWith(".pdf")) {
        return explicitType === "infographie" ? "infographie" : "text";
    }

    return explicitType || "video";
};

const decorateCourses = (rows) =>
    rows.map((row) => ({
        ...row,
        type: "course",
        course_type: inferCourseType(row),
    }));

const decorateQuizzes = (rows) =>
    rows.map((row) => ({
        ...row,
        type: "quiz",
        course_type: "quiz",
    }));

const isNumericIdList = (values) =>
    values.length > 0 && values.every((value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && String(parsed) === String(value).trim();
    });

const fetchAllContent = async () => {
    const [courses, quizzes] = await Promise.all([
        dbAll(
            `SELECT c.*, cat.name AS category_name
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.id
             ORDER BY cat.name, c.title`
        ),
        dbAll(
            `SELECT q.*, cat.name AS category_name
             FROM quizzes q
             LEFT JOIN categories cat ON cat.id = q.category_id
             ORDER BY cat.name, q.title`
        ),
    ]);

    return [...decorateCourses(courses), ...decorateQuizzes(quizzes)];
};

const fetchContentByIds = async (ids) => {
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(",");
    const [courses, quizzes] = await Promise.all([
        dbAll(
            `SELECT c.*, cat.name AS category_name
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.id
             WHERE c.id IN (${placeholders})`,
            ids
        ),
        dbAll(
            `SELECT q.*, cat.name AS category_name
             FROM quizzes q
             LEFT JOIN categories cat ON cat.id = q.category_id
             WHERE q.id IN (${placeholders})`,
            ids
        ),
    ]);

    const contentMap = new Map();
    decorateCourses(courses).forEach((item) => contentMap.set(`course:${item.id}`, item));
    decorateQuizzes(quizzes).forEach((item) => contentMap.set(`quiz:${item.id}`, item));

    return ids
        .map((id) => contentMap.get(`course:${id}`) || contentMap.get(`quiz:${id}`))
        .filter(Boolean);
};

const fetchRecommendedContent = async (recommendations) => {
    const list = Array.isArray(recommendations)
        ? recommendations.filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
        : [recommendations].filter((value) => value !== null && value !== undefined && String(value).trim() !== "");

    if (list.length === 0) return { predictedType: null, courses: [] };

    if (isNumericIdList(list)) {
        return { predictedType: null, courses: await fetchContentByIds(list.map((value) => Number(value))) };
    }

    const predictedType = normalizeType(list[0]);
    const allContent = await fetchAllContent();

    if (predictedType === "quiz") {
        return {
            predictedType: "Quiz",
            courses: allContent.filter((item) => item.type === "quiz"),
        };
    }

    if (predictedType === "video") {
        return {
            predictedType: "Vidéo",
            courses: allContent.filter((item) => item.type === "course" && inferCourseType(item) === "video"),
        };
    }

    if (predictedType === "text" || predictedType === "texte") {
        return {
            predictedType: "Texte",
            courses: allContent.filter((item) => item.type === "course" && inferCourseType(item) === "text"),
        };
    }

    if (predictedType === "infographie") {
        return {
            predictedType: "Infographie",
            courses: allContent.filter((item) => item.type === "course" && inferCourseType(item) === "infographie"),
        };
    }

    if (predictedType === "audio") {
        return {
            predictedType: "Audio",
            courses: allContent.filter((item) => item.type === "course" && inferCourseType(item) === "audio"),
        };
    }

    return {
        predictedType: formatTypeLabel(predictedType),
        courses: allContent.filter((item) => {
            if (item.type === "quiz") return false;
            const courseType = inferCourseType(item);
            return !predictedType || courseType === predictedType;
        }),
    };
};

// POST /api/recommendations
router.post("/", async (req, res) => {
    const { firebase_uid } = req.body;
    if (!firebase_uid) return res.status(400).json({ message: "firebase_uid requis" });

    try {
        const user = await dbGet("SELECT ab_group FROM users WHERE firebase_uid = ?", [firebase_uid]);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const abGroup = user.ab_group || "A";

        if (abGroup === "B") {
            const courses = await dbAll(
                `SELECT c.*, cat.name AS category_name
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 ORDER BY cat.name, c.title`
            );
            const quizzes = await dbAll(
                `SELECT q.*, cat.name AS category_name
                 FROM quizzes q
                 LEFT JOIN categories cat ON cat.id = q.category_id
                 ORDER BY cat.name, q.title`
            );
            return res.json({ predictedType: null, courses: [...decorateCourses(courses), ...decorateQuizzes(quizzes)] });
        }

        const userProfile = await dbGet("SELECT * FROM users WHERE firebase_uid = ?", [firebase_uid]);
        if (!userProfile) return res.status(404).json({ message: "Profil non trouvé" });

        const lastSession = await dbGet(
            `SELECT * FROM session_context
             WHERE firebase_uid = ?
             ORDER BY created_at DESC LIMIT 1`,
            [firebase_uid]
        );

        const features = {
            age: userProfile.age || "21-30",
            education: userProfile.education || "Université",
            mastery: userProfile.mastery || "Intermédiaire",
            competence: userProfile.competence || "Intermédiaire",
            ...(lastSession
                ? {
                      time_available: lastSession.time_available || "15-30 min",
                      connection_level: lastSession.connection_level || "Élevé",
                      device_type: lastSession.device_type || "Mobile",
                      battery_level: lastSession.battery_level || "Moyen",
                      time_of_day: lastSession.time_of_day || "Après-midi",
                  }
                : {}),
        };

        const flaskResponse = await fetch(
        process.env.ML_URL || "http://ml:5001/predict",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ features }),
        }
    );

    const result = await flaskResponse.json();

    if (!flaskResponse.ok) {
        console.error(result);
        return res.status(500).json({
            message: "Erreur du service ML",
        });
    }

    const recommendations = await fetchRecommendedContent(result.recommendations);

    return res.json(recommendations);
    } catch (err) {
        console.error("Flask error:", err);
        return res.status(500).json({ message: "Erreur du service de recommandation" });
    }
});

module.exports = router;
