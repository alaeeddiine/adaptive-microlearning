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

  const presetQuizzes = [
    {
      title: "Quiz SQL",
      description: "Vérifiez vos bases sur les requêtes, jointures et agrégations SQL.",
      categoryName: "SQL",
      questions: [
        {
          question_text: "Que fait une requête SELECT en SQL ?",
          option_a: "Supprime des données",
          option_b: "Récupère des données",
          option_c: "Modifie une table",
          option_d: "Crée une base de données",
          correct_option: "B",
        },
        {
          question_text: "Quel mot-clé sert à filtrer les lignes ?",
          option_a: "GROUP BY",
          option_b: "ORDER BY",
          option_c: "WHERE",
          option_d: "JOIN",
          correct_option: "C",
        },
        {
          question_text: "Quelle jointure retourne toutes les lignes de la table de gauche et les correspondances de la table de droite ?",
          option_a: "INNER JOIN",
          option_b: "LEFT JOIN",
          option_c: "RIGHT JOIN",
          option_d: "FULL JOIN",
          correct_option: "B",
        },
        {
          question_text: "Quel mot-clé permet de compter les lignes ?",
          option_a: "COUNT()",
          option_b: "SUM()",
          option_c: "AVG()",
          option_d: "MAX()",
          correct_option: "A",
        },
        {
          question_text: "Quel mot-clé sert à regrouper des résultats ?",
          option_a: "GROUP BY",
          option_b: "ORDER BY",
          option_c: "HAVING",
          option_d: "DISTINCT",
          correct_option: "A",
        },
        {
          question_text: "Quelle requête met à jour des données existantes ?",
          option_a: "INSERT",
          option_b: "UPDATE",
          option_c: "ALTER",
          option_d: "SELECT",
          correct_option: "B",
        },
      ],
    },
    {
      title: "Quiz HTML/CSS",
      description: "Testez vos connaissances sur la structure HTML et le style CSS.",
      categoryName: "HTML/CSS",
      questions: [
        {
          question_text: "Quel élément HTML sert à créer un lien ?",
          option_a: "<link>",
          option_b: "<a>",
          option_c: "<href>",
          option_d: "<url>",
          correct_option: "B",
        },
        {
          question_text: "Quel attribut HTML définit l'adresse d'un lien ?",
          option_a: "src",
          option_b: "href",
          option_c: "alt",
          option_d: "class",
          correct_option: "B",
        },
        {
          question_text: "Quelle propriété CSS change la couleur du texte ?",
          option_a: "background-color",
          option_b: "font-size",
          option_c: "color",
          option_d: "text-align",
          correct_option: "C",
        },
        {
          question_text: "Quel sélecteur cible un élément avec un id \"menu\" ?",
          option_a: ".menu",
          option_b: "#menu",
          option_c: "*menu",
          option_d: "menu()",
          correct_option: "B",
        },
        {
          question_text: "Quel élément HTML est le plus adapté pour une liste non ordonnée ?",
          option_a: "<ol>",
          option_b: "<ul>",
          option_c: "<li>",
          option_d: "<section>",
          correct_option: "B",
        },
        {
          question_text: "Quelle propriété CSS contrôle l'espace intérieur d'un élément ?",
          option_a: "margin",
          option_b: "padding",
          option_c: "gap",
          option_d: "border-spacing",
          correct_option: "B",
        },
      ],
    },
    {
      title: "Quiz Machine Learning",
      description: "Révisez les notions essentielles du machine learning.",
      categoryName: "Machine Learning",
      questions: [
        {
          question_text: "Quel est le rôle principal du machine learning ?",
          option_a: "Écrire du code HTML",
          option_b: "Permettre à un modèle d'apprendre à partir de données",
          option_c: "Compresser des fichiers",
          option_d: "Dessiner des graphiques",
          correct_option: "B",
        },
        {
          question_text: "Quel type d'apprentissage utilise des données étiquetées ?",
          option_a: "Apprentissage non supervisé",
          option_b: "Apprentissage supervisé",
          option_c: "Apprentissage par renforcement",
          option_d: "Apprentissage fédéré",
          correct_option: "B",
        },
        {
          question_text: "Le surapprentissage correspond à quoi ?",
          option_a: "Le modèle généralise trop bien",
          option_b: "Le modèle mémorise trop les données d'entraînement",
          option_c: "Le modèle n'utilise pas de données",
          option_d: "Le modèle devient plus rapide",
          correct_option: "B",
        },
        {
          question_text: "Quel algorithme est souvent utilisé pour la classification ?",
          option_a: "K-means",
          option_b: "Régression logistique",
          option_c: "PCA",
          option_d: "TF-IDF",
          correct_option: "B",
        },
        {
          question_text: "Que mesure généralement l'accuracy ?",
          option_a: "La vitesse d'exécution",
          option_b: "La proportion de prédictions correctes",
          option_c: "La taille du modèle",
          option_d: "Le nombre de features",
          correct_option: "B",
        },
        {
          question_text: "Quel objectif vise la validation croisée ?",
          option_a: "Choisir un langage de programmation",
          option_b: "Évaluer la robustesse d'un modèle",
          option_c: "Supprimer les valeurs manquantes",
          option_d: "Créer des labels",
          correct_option: "B",
        },
      ],
    },
    {
      title: "Quiz Python",
      description: "Évaluez vos connaissances sur les bases du langage Python.",
      categoryName: "Python",
      questions: [
        {
          question_text: "Quel symbole sert à commenter une ligne en Python ?",
          option_a: "//",
          option_b: "#",
          option_c: "/* */",
          option_d: "--",
          correct_option: "B",
        },
        {
          question_text: "Quel mot-clé définit une fonction ?",
          option_a: "function",
          option_b: "def",
          option_c: "fun",
          option_d: "lambda",
          correct_option: "B",
        },
        {
          question_text: "Quel type de donnée est immuable ?",
          option_a: "list",
          option_b: "dict",
          option_c: "tuple",
          option_d: "set",
          correct_option: "C",
        },
        {
          question_text: "Quelle structure sert à itérer sur une séquence ?",
          option_a: "for",
          option_b: "match",
          option_c: "pass",
          option_d: "yield",
          correct_option: "A",
        },
        {
          question_text: "Que retourne len([1, 2, 3]) ?",
          option_a: "2",
          option_b: "3",
          option_c: "4",
          option_d: "Erreur",
          correct_option: "B",
        },
        {
          question_text: "Quel module standard sert à manipuler des chemins de fichiers ?",
          option_a: "math",
          option_b: "os",
          option_c: "pathlib",
          option_d: "json",
          correct_option: "C",
        },
      ],
    },
  ];

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

  const getCategoryByName = async (name) => {
    const normalized = name.trim().toLowerCase();
    const existing = categories.find((cat) => String(cat.name || "").trim().toLowerCase() === normalized);
    if (existing) return existing;

    const res = await fetch("http://localhost:5000/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`Impossible de créer la catégorie ${name}`);
    return res.json();
  };

  const seedPresetQuizzes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/quiz");
      const existingData = await res.json();
      const existingQuizzes = Array.isArray(existingData) ? existingData : [];
      const existingTitles = new Set(existingQuizzes.map((quiz) => String(quiz.title || "").trim().toLowerCase()));

      for (const preset of presetQuizzes) {
        if (existingTitles.has(preset.title.trim().toLowerCase())) continue;
        const category = await getCategoryByName(preset.categoryName);
        const createRes = await fetch("http://localhost:5000/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: preset.title,
            description: preset.description,
            category_id: category.id,
            questions: preset.questions,
          }),
        });
        if (!createRes.ok) {
          const text = await createRes.text();
          throw new Error(text || `Erreur lors de la création de ${preset.title}`);
        }
      }

      fetchQuizzes(selectedCategory);
      alert("Quiz prédéfinis ajoutés.");
    } catch (err) {
      alert(err.message || "Erreur lors de l'ajout des quiz.");
    }
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
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-classic">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Titre</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-left">Questions</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{quiz.title}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {quiz.description || "Aucune description"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {quiz.category_name || "Sans catégorie"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {quiz.question_count ?? quiz.questions_count ?? quiz.questions?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
