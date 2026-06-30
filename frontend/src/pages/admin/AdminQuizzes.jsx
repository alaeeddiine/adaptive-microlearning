import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  FaPlus, FaTrash, FaEdit, FaQuestionCircle, FaSave, FaTimes, FaCheck,
} from "react-icons/fa";

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    category_id: "",
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Load categories
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Load quizzes (with optional category filter)
  const fetchQuizzes = (categoryId = "") => {
    setLoading(true);
    const url = categoryId
      ? `http://localhost:5000/api/quiz?category_id=${categoryId}`
      : "http://localhost:5000/api/quiz";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCategoryFilter = (e) => {
    const catId = e.target.value;
    setSelectedCategory(catId);
    fetchQuizzes(catId);
  };

  // Question management helpers
  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
    });
    setEditingQuestionIndex(null);
  };

  const handleAddOrUpdateQuestion = () => {
    const { question_text, option_a, option_b, option_c, option_d, correct_option } = currentQuestion;
    if (!question_text || !option_a || !option_b || !option_c || !option_d) return;

    const newQuestion = { question_text, option_a, option_b, option_c, option_d, correct_option };
    const updatedQuestions = [...quizForm.questions];

    if (editingQuestionIndex !== null) {
      updatedQuestions[editingQuestionIndex] = newQuestion;
    } else {
      updatedQuestions.push(newQuestion);
    }

    setQuizForm({ ...quizForm, questions: updatedQuestions });
    resetCurrentQuestion();
  };

  const removeQuestion = (index) => {
    const updatedQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const editQuestion = (index) => {
    const q = quizForm.questions[index];
    setCurrentQuestion({ ...q });
    setEditingQuestionIndex(index);
  };

  // Open create modal
  const openCreateQuiz = () => {
    setEditingQuizId(null);
    setQuizForm({ title: "", description: "", category_id: "", questions: [] });
    resetCurrentQuestion();
    setShowQuizModal(true);
  };

  // Open edit modal and fetch existing quiz data
  const openEditQuiz = async (quizId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/quiz/${quizId}`);
      const data = await res.json();
      setEditingQuizId(quizId);
      setQuizForm({
        title: data.quiz.title,
        description: data.quiz.description || "",
        category_id: data.quiz.category_id || "",
        questions: data.questions || [],
      });
      resetCurrentQuestion();
      setShowQuizModal(true);
    } catch (err) {
      alert("Impossible de charger le quiz.");
    }
  };

  // Submit (create or update)
  const handleSubmitQuiz = async () => {
    if (!quizForm.title.trim()) return;
    if (!quizForm.category_id) {
      alert("Veuillez sélectionner une catégorie.");
      return;
    }

    const payload = {
      title: quizForm.title,
      description: quizForm.description,
      category_id: quizForm.category_id,
      questions: quizForm.questions,
    };

    const url = editingQuizId
      ? `http://localhost:5000/api/quiz/${editingQuizId}`
      : "http://localhost:5000/api/quiz";
    const method = editingQuizId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde du quiz");
      setShowQuizModal(false);
      setEditingQuizId(null);
      setQuizForm({ title: "", description: "", category_id: "", questions: [] });
      resetCurrentQuestion();
      fetchQuizzes(selectedCategory);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete quiz
  const deleteQuiz = async (quizId) => {
    if (!window.confirm("Supprimer ce quiz ?")) return;
    await fetch(`http://localhost:5000/api/quiz/${quizId}`, { method: "DELETE" });
    fetchQuizzes(selectedCategory);
  };

  if (loading) {
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
      `}</style>

      <Header />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gestion des quiz</h2>
          <p className="text-sm text-gray-500 mt-1">Créez, modifiez et supprimez des quiz.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={handleCategoryFilter}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={openCreateQuiz}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 shadow-sm"
          >
            <FaPlus /> Nouveau quiz
          </button>
        </div>
      </div>

      {/* Quiz cards */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaQuestionCircle className="mx-auto text-4xl mb-3" />
          <p className="font-medium">Aucun quiz trouvé.</p>
          <p className="text-sm">Créez un nouveau quiz ou changez de catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {quiz.category_name || "Sans catégorie"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{quiz.description || "Aucune description"}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openEditQuiz(quiz.id)}
                  className="p-2 text-gray-400 hover:text-green-600 transition"
                  title="Modifier"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteQuiz(quiz.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition"
                  title="Supprimer"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== QUIZ MODAL (create / edit) ========== */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaQuestionCircle className="text-purple-600" />
              {editingQuizId ? "Modifier le quiz" : "Créer un quiz"}
            </h3>

            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Titre du quiz *"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
              />
              <textarea
                placeholder="Description (optionnelle)"
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                rows="2"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none"
              />
              <select
                value={quizForm.category_id}
                onChange={(e) => setQuizForm({ ...quizForm, category_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white"
              >
                <option value="">-- Choisir une catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Questions list */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Questions ({quizForm.questions.length})</h4>
              <div className="space-y-2 mb-4">
                {quizForm.questions.map((q, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-gray-50 p-3 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{idx + 1}. {q.question_text}</p>
                      <p className="text-xs text-gray-500">
                        A) {q.option_a} &nbsp; B) {q.option_b} &nbsp; C) {q.option_c} &nbsp; D) {q.option_d}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">Réponse : {q.correct_option}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => editQuestion(idx)} className="p-1 text-gray-400 hover:text-green-600"><FaEdit className="text-xs" /></button>
                      <button onClick={() => removeQuestion(idx)} className="p-1 text-gray-400 hover:text-red-600"><FaTrash className="text-xs" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit question form */}
              <div className="border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">
                  {editingQuestionIndex !== null ? "Modifier la question" : "Ajouter une question"}
                </h5>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Texte de la question"
                    value={currentQuestion.question_text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Option A" value={currentQuestion.option_a} onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_a: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" />
                    <input type="text" placeholder="Option B" value={currentQuestion.option_b} onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_b: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" />
                    <input type="text" placeholder="Option C" value={currentQuestion.option_c} onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_c: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" />
                    <input type="text" placeholder="Option D" value={currentQuestion.option_d} onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_d: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Réponse correcte :</label>
                    <select value={currentQuestion.correct_option} onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_option: e.target.value })} className="px-3 py-1 rounded-xl border border-gray-200 text-sm">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <button
                      onClick={handleAddOrUpdateQuestion}
                      className="ml-auto px-4 py-1 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
                    >
                      {editingQuestionIndex !== null ? "Mettre à jour" : "Ajouter"}
                    </button>
                    {editingQuestionIndex !== null && (
                      <button onClick={resetCurrentQuestion} className="px-4 py-1 bg-gray-200 text-gray-700 rounded-xl text-sm">Annuler</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowQuizModal(false); setEditingQuizId(null); resetCurrentQuestion(); }} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
              <button onClick={handleSubmitQuiz} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1">
                <FaCheck className="text-xs" /> {editingQuizId ? "Enregistrer les modifications" : "Enregistrer le quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}