const express = require("express");
const router = express.Router();
const db = require("../database/database");

// ---------- Stats ----------
router.get("/stats", (req, res) => {
    // Simplifié – à adapter
    db.get("SELECT COUNT(*) AS users FROM users", (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ users: row.users, courses: 0, completed: 0, avgProgress: 0 });
    });
});

router.get("/users", (req, res) => {
    db.all("SELECT firebase_uid, name, email, created_at FROM users WHERE role != 'admin'", (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        // Add progress average as before if needed
        const users = rows.map(u => ({ ...u, completed: 0 })); // simplified
        res.json(users);
    });
});

// ---------- Utilisateurs ----------
router.get("/users", (req, res) => {
    db.all("SELECT firebase_uid, name, email, created_at FROM users", (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        const users = rows.map(u => ({
            ...u,
            completed: 0, // tu pourras ajouter la vraie progression plus tard
        }));
        res.json(users);
    });
});

router.get("/users/:uid", (req, res) => {
    const { uid } = req.params;
    db.get("SELECT * FROM users WHERE firebase_uid = ?", [uid], (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        db.all("SELECT * FROM courses WHERE firebase_uid = ?", [uid], (err, courses) => {
            if (err) return res.json({ user, courses: [] });
            res.json({ user, courses: courses || [] });
        });
    });
});
router.delete("/users/:uid", (req, res) => {
  const { uid } = req.params;

  // First, delete all courses linked to this user
  db.run("DELETE FROM courses WHERE firebase_uid = ?", [uid], (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    // Then delete the user
    db.run("DELETE FROM users WHERE firebase_uid = ?", [uid], function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
      res.json({ message: "Utilisateur supprimé" });
    });
  });
});

// ---------- Catégories ----------
router.get("/categories", (req, res) => {
    db.all("SELECT * FROM categories", (err, rows) => {
        if (err) {
            // Créer la table si elle n'existe pas
            db.run("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)");
            return res.json([]);
        }
        // Ajouter le nombre de cours par catégorie (optionnel)
        const categories = rows.map(cat => {
            return new Promise((resolve) => {
                db.get("SELECT COUNT(*) AS count FROM courses WHERE category_id = ?", [cat.id], (err, row) => {
                    cat.courseCount = row?.count || 0;
                    resolve(cat);
                });
            });
        });
        Promise.all(categories).then(data => res.json(data));
    });
});

router.post("/categories", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nom requis" });
    db.run("INSERT INTO categories (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ id: this.lastID, name });
    });
});

// ---------- Cours d’une catégorie ----------
router.get("/categories/:id/courses", (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM courses WHERE category_id = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows || []);
    });
});

router.post("/categories/:id/courses", (req, res) => {
  const { id } = req.params;
  const { title, level, duration, description, media, quiz_link } = req.body;
  if (!title) return res.status(400).json({ message: "Titre requis" });

  db.run(
    `INSERT INTO courses (title, level, duration, description, media, quiz_link, category_id)
     VALUES (?,?,?,?,?,?,?)`,
    [title, level, duration, description || "", media || "", quiz_link || "", id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({
        id: this.lastID,
        title,
        level,
        duration,
        description: description || "",
        media: media || "",
        quiz_link: quiz_link || "",
      });
    }
  );
});
router.put("/courses/:id", (req, res) => {
  const { id } = req.params;
  const { title, level, duration, description, media, quiz_link } = req.body;
  if (!title) return res.status(400).json({ message: "Titre requis" });

  db.run(
    `UPDATE courses SET title=?, level=?, duration=?, description=?, media=?, quiz_link=? WHERE id=?`,
    [title, level, duration, description || "", media || "", quiz_link || "", id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Cours non trouvé" });
      res.json({ message: "Cours mis à jour" });
    }
  );
});
// Get a single course by id
router.get("/courses/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM courses WHERE id = ?", [id], (err, course) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });
    res.json(course);
  });
});

// ---------- Suppression d’un cours ----------
router.delete("/courses/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM courses WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Cours non trouvé" });
        res.json({ message: "Cours supprimé" });
    });
});

module.exports = router;