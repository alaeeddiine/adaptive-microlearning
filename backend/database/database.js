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

db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne role:", err.message);
    }
});

// Création de la table users (inchangé)
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Erreur création table users :", err.message);
    else console.log("Table 'users' prête.");
});
db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
    )
`);
db.run(`ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne type:", err.message);
    }
});
db.run(`
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT,
        title TEXT NOT NULL,
        category TEXT,
        level TEXT,
        duration TEXT,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT,
        title TEXT,
        category TEXT,
        level TEXT,
        duration TEXT,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
    )
`);
// Add firebase_uid column if missing (safe to run multiple times)
db.run(`ALTER TABLE courses ADD COLUMN firebase_uid TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Error adding firebase_uid to courses:", err.message);
    }
});

// Table categories
db.run(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
`);

// Table courses avec category_id
db.run(`
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT,
        title TEXT NOT NULL,
        category_id INTEGER,
        level TEXT,
        duration TEXT,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    )
`);
// Add new columns for richer course data (safe to run multiple times)
const newCourseColumns = [
  { name: "description", type: "TEXT" },
  { name: "media", type: "TEXT" },            // URL to video/audio
  { name: "quiz_link", type: "TEXT" },        // optional quiz link
];

newCourseColumns.forEach(col => {
  db.run(`ALTER TABLE courses ADD COLUMN ${col.name} ${col.type}`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(`Erreur ajout colonne ${col.name} dans courses:`, err.message);
    }
  });
});

// Migration pour ajouter category_id si la table courses existait déjà sans
db.run(`ALTER TABLE courses ADD COLUMN category_id INTEGER`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout category_id :", err.message);
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        progress REAL DEFAULT 0,
        last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        UNIQUE(firebase_uid, course_id)
    )
`);
db.run(`ALTER TABLE user_progress ADD COLUMN watched_segments TEXT DEFAULT '[]'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne watched_segments:", err.message);
    }
});
db.run(`ALTER TABLE users ADD COLUMN ab_group TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
        console.error("Erreur ajout colonne ab_group:", err.message);
    }
});
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
`);
db.run(`
    CREATE TABLE IF NOT EXISTS user_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        course_id INTEGER,
        event_type TEXT NOT NULL,
        event_data TEXT,
        ab_group TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);
// Ajout des colonnes questionnaire (si elles n'existent pas déjà)
const newColumns = [
    { name: "age", type: "TEXT" },
    { name: "education", type: "TEXT" },
    { name: "mastery", type: "TEXT" },
    { name: "competence", type: "TEXT" },
];

newColumns.forEach((col) => {
    db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error(`Erreur ajout colonne ${col.name} :`, err.message);
        }
    });
});
// Add missing columns if they don't exist yet
const courseColumns = [
  { name: "level", type: "TEXT" },
  { name: "duration", type: "TEXT" },
  { name: "category", type: "TEXT" },   // in case you still have it
  { name: "category_id", type: "INTEGER" },
];
courseColumns.forEach(col => {
  db.run(`ALTER TABLE courses ADD COLUMN ${col.name} ${col.type}`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error(`Erreur ajout colonne ${col.name} dans courses:`, err.message);
    }
  });
});

module.exports = db;