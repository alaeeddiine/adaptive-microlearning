import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  FaPlus, FaTrash, FaEdit, FaFolder, FaSave,
  FaExternalLinkAlt, FaVideo,
} from "react-icons/fa";

export default function AdminCourses() {
  // -- categories state --
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- add category modal --
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // -- add/edit course modal --
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "", level: "", duration: "", description: "", media: "", quiz_link: ""
  });

  // --- load categories on mount ---
  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/admin/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  // --- load courses of a selected category ---
  const loadCategoryData = (category) => {
    setSelectedCategory(category);
    setLoading(true);
    fetch(`http://localhost:5000/api/admin/categories/${category.id}/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => { console.error(err); setCourses([]); setLoading(false); });
  };

  // --- add category ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await fetch("http://localhost:5000/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() })
    });
    setNewCategoryName("");
    setShowAddCategory(false);
    fetchCategories();
  };

  // --- open add course modal ---
  const openAddCourse = () => {
    setEditingCourse(null);
    setCourseForm({ title: "", level: "", duration: "", description: "", media: "", quiz_link: "" });
    setShowCourseModal(true);
  };

  // --- open edit course modal ---
  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title || "",
      level: course.level || "",
      duration: course.duration || "",
      description: course.description || "",
      media: course.media || "",
      quiz_link: course.quiz_link || ""
    });
    setShowCourseModal(true);
  };

  // --- handle add/edit course form submit ---
  const handleCourseSubmit = async () => {
    if (!courseForm.title.trim()) return;
    const payload = {
      title: courseForm.title,
      level: courseForm.level,
      duration: courseForm.duration,
      description: courseForm.description,
      media: courseForm.media,
      quiz_link: courseForm.quiz_link
    };
    try {
      if (editingCourse) {
        const res = await fetch(`http://localhost:5000/api/admin/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      } else {
        const res = await fetch(`http://localhost:5000/api/admin/categories/${selectedCategory.id}/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erreur lors de l'ajout");
      }
      setShowCourseModal(false);
      loadCategoryData(selectedCategory);
    } catch (err) { alert(err.message); }
  };

  // --- delete course ---
  const deleteCourse = async (id) => {
    if (!window.confirm("Supprimer ce cours ?")) return;
    await fetch(`http://localhost:5000/api/admin/courses/${id}`, { method: "DELETE" });
    loadCategoryData(selectedCategory);
  };

  // ========== LOADING STATE ==========
  if (loading && !selectedCategory) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
        .table-classic th {
          font-weight: 600; font-size: 0.875rem; color: #6B7280; background: #F9FAFB;
        }
        .table-classic th:first-child { border-top-left-radius: 16px; }
        .table-classic th:last-child { border-top-right-radius: 16px; }
        .table-classic tr:last-child td:first-child { border-bottom-left-radius: 16px; }
        .table-classic tr:last-child td:last-child { border-bottom-right-radius: 16px; }
      `}</style>

      <Header />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gestion des cours</h2>
          <p className="text-sm text-gray-500 mt-1">Organisez vos cours par catégories.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 shadow-sm"
          >
            <FaPlus /> Nouvelle catégorie
          </button>
        </div>
      </div>

      {!selectedCategory ? (
        /* Category cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => loadCategoryData(cat)}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <FaFolder className="text-purple-600 text-lg" />
                </div>
                <span className="text-lg font-bold text-gray-900">{cat.name}</span>
              </div>
              <p className="text-sm text-gray-500">{cat.courseCount || 0} cours</p>
            </div>
          ))}
        </div>
      ) : (
        /* Category detail view */
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-purple-600 font-semibold hover:underline"
            >
              ← Revenir aux catégories
            </button>
            <button
              onClick={openAddCourse}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 shadow-sm"
            >
              <FaPlus /> Ajouter un cours
            </button>
          </div>

          {/* Courses table */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-classic">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Titre</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
                    <th className="px-4 py-3 text-left">Niveau</th>
                    <th className="px-4 py-3 text-left">Durée</th>
                    <th className="px-4 py-3 text-center">Média</th>
                    <th className="px-4 py-3 text-center">Quiz</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">{course.description || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{course.level || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{course.duration || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {course.media ? (
                          <a href={course.media} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1">
                            <FaVideo className="text-sm" /> Lien
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {course.quiz_link ? (
                          <a href={course.quiz_link} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1">
                            <FaExternalLinkAlt className="text-sm" /> Lien
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditCourse(course)} className="p-2 text-gray-400 hover:text-green-600 transition" title="Modifier"><FaEdit /></button>
                          <button onClick={() => deleteCourse(course.id)} className="p-2 text-gray-400 hover:text-red-600 transition" title="Supprimer"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">Aucun cours dans cette catégorie.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========== MODALS ========== */}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Nouvelle catégorie</h3>
            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nom de la catégorie" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddCategory(false)} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
              <button onClick={handleAddCategory} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingCourse ? "Modifier le cours" : "Ajouter un cours à " + selectedCategory?.name}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Titre du cours *" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
              <input type="text" placeholder="Niveau (ex: Débutant)" value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
              <input type="text" placeholder="Durée (ex: 2h30)" value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
              <textarea placeholder="Description" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none" />
              <input type="url" placeholder="Lien média (vidéo/audio)" value={courseForm.media} onChange={e => setCourseForm({ ...courseForm, media: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
              <input type="url" placeholder="Lien du quiz" value={courseForm.quiz_link} onChange={e => setCourseForm({ ...courseForm, quiz_link: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
              <button onClick={handleCourseSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1"><FaSave className="text-xs" /> {editingCourse ? "Enregistrer" : "Ajouter"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}