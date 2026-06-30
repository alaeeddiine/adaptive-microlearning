// backend/database/database.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_FILE = path.join(__dirname, "adaptive_microlearning.db"); // adapte le nom si besoin

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error("Erreur connexion SQLite :", err.message);
    } else {
        console.log("SQLite connecté →", DB_FILE);
    }
});

// ----------------------------------------------------------------------
// 1. USERS (principale)
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        ab_group TEXT,
        age TEXT,
        education TEXT,
        mastery TEXT,
        competence TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Erreur création table users :", err.message);
    else console.log("Table 'users' prête.");
});

// Ajout de colonnes manquantes (sécurisé, exécutable plusieurs fois)
const userColumns = [
    { name: "role", type: "TEXT DEFAULT 'user'" },
    { name: "ab_group", type: "TEXT" },
    { name: "age", type: "TEXT" },
    { name: "education", type: "TEXT" },
    { name: "mastery", type: "TEXT" },
    { name: "competence", type: "TEXT" },
];
userColumns.forEach((col) => {
    db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error(`Erreur ajout colonne ${col.name} dans users:`, err.message);
        }
    });
});

// ----------------------------------------------------------------------
// 2. CATEGORIES
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
`, (err) => {
    if (err) console.error("Erreur création table categories :", err.message);
    else console.log("Table 'categories' prête.");
});

// ----------------------------------------------------------------------
// 3. COURSES (liée aux catégories)
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT,
        title TEXT NOT NULL,
        category_id INTEGER,
        level TEXT,
        duration TEXT,
        description TEXT,
        media TEXT,
        quiz_link TEXT,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )
`, (err) => {
    if (err) console.error("Erreur création table courses :", err.message);
    else console.log("Table 'courses' prête.");
});

// Colonnes additionnelles (si la table existait avant)
const courseColumns = [
    { name: "firebase_uid", type: "TEXT" },
    { name: "category_id", type: "INTEGER" },
    { name: "description", type: "TEXT" },
    { name: "media", type: "TEXT" },
    { name: "quiz_link", type: "TEXT" },
    { name: "level", type: "TEXT" },
    { name: "duration", type: "TEXT" },
];
courseColumns.forEach((col) => {
    db.run(`ALTER TABLE courses ADD COLUMN ${col.name} ${col.type}`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error(`Erreur ajout colonne ${col.name} dans courses:`, err.message);
        }
    });
});

// ----------------------------------------------------------------------
// 4. USER_PROGRESS (suivi des cours par utilisateur)
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        progress REAL DEFAULT 0,
        watched_segments TEXT DEFAULT '[]',
        last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        UNIQUE(firebase_uid, course_id)
    )
`, (err) => {
    if (err) console.error("Erreur création table user_progress :", err.message);
    else console.log("Table 'user_progress' prête.");
});

db.run(`ALTER TABLE user_progress ADD COLUMN watched_segments TEXT DEFAULT '[]'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne watched_segments:", err.message);
    }
});

// ----------------------------------------------------------------------
// 5. NOTIFICATIONS
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
    )
`, (err) => {
    if (err) console.error("Erreur création table notifications :", err.message);
    else console.log("Table 'notifications' prête.");
});

db.run(`ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne type dans notifications:", err.message);
    }
});

// ----------------------------------------------------------------------
// 6. SESSION_CONTEXT (contextes de session)
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS session_context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        time_available TEXT,
        connection_level TEXT,
        device_type TEXT,
        battery_level TEXT,
        time_of_day TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
    )
`, (err) => {
    if (err) console.error("Erreur création table session_context :", err.message);
    else console.log("Table 'session_context' prête.");
});
db.run(`ALTER TABLE session_context ADD COLUMN duration REAL DEFAULT 0`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne duration:", err.message);
    }
});

// ----------------------------------------------------------------------
// 7. USER_ACTIVITY (logging fin des interactions)
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS user_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        course_id INTEGER,
        event_type TEXT NOT NULL,
        event_data TEXT,
        ab_group TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Erreur création table user_activity :", err.message);
    else console.log("Table 'user_activity' prête.");
});

// ----------------------------------------------------------------------
// 8. ARCS_RESPONSES (motivation)
// ----------------------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS arcs_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        course_id INTEGER,
        attention INTEGER,
        relevance INTEGER,
        confidence INTEGER,
        satisfaction INTEGER,
        ab_group TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )
`, (err) => {
    if (err) console.error("Erreur création table arcs_responses :", err.message);
    else console.log("Table 'arcs_responses' prête.");
});
// Quizzes
db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )
`);

// Questions (one quiz has many questions)
db.run(`
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL CHECK(correct_option IN ('A','B','C','D')),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
`);

// User quiz attempts
db.run(`
    CREATE TABLE IF NOT EXISTS user_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        quiz_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_option TEXT,
        is_correct INTEGER DEFAULT 0,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
    )
`);
db.run(`
    CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        category TEXT
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        badge_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (badge_id) REFERENCES badges(id)
    )
`);

module.exports = db;