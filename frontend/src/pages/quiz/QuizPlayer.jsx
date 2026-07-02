import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";
import { FaArrowLeft, FaArrowRight, FaCheck, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function QuizPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logActivity = (eventType, data = {}) => {
    if (!currentUser) return;
    fetch("http://localhost:5000/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        event_type: eventType,
        event_data: data,
        ab_group: userData?.ab_group,
      }),
    }).catch(console.error);
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/quiz/${id}/take`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger le quiz.");
        setLoading(false);
      });
  }, [id]);

  const handleSelect = (option) => {
    if (submitted) return;
    setAnswers({ ...answers, [questions[currentIndex].id]: option });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    const payload = {
      firebase_uid: currentUser.uid,
      answers: Object.entries(answers).map(([question_id, selected_option]) => ({
        question_id: parseInt(question_id, 10),
        selected_option,
      })),
    };

    try {
      const res = await fetch(`http://localhost:5000/api/quiz/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      logActivity("quiz_submitted", {
        score: data.score,
        quiz_title: quiz?.title || "Quiz",
      });
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la soumission.");
    }
  };

  const getOptionLabel = (question, option) => {
    if (!option) return "Non répondu";
    const key = String(option).toUpperCase();
    const text = question?.[`option_${key.toLowerCase()}`] || option;
    return `${key}) ${text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate("/quiz")} className="mt-4 px-4 py-2 bg-gray-200 rounded-xl">
          Retour
        </button>
      </div>
    );
  }

  if (submitted && result) {
    const details = Array.isArray(result.details) ? result.details : [];
    const success = Number(result.score) >= 80;
    const wrongCount = Math.max(0, (result.totalQuestions || 0) - (result.correctCount || 0));

    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Résultat</h2>
            {success && (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-semibold text-green-800">Félicitations ! Quiz réussi.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-purple-50 p-4">
                <p className="text-sm text-purple-700 font-semibold">Score</p>
                <p className="text-3xl font-extrabold text-purple-700 mt-1">{result.score}%</p>
              </div>
              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-sm text-green-700 font-semibold">Réponses vraies</p>
                <p className="text-3xl font-extrabold text-green-700 mt-1">
                  {result.correctCount}/{result.totalQuestions}
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm text-red-700 font-semibold">Réponses fausses</p>
                <p className="text-3xl font-extrabold text-red-700 mt-1">{wrongCount}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">{result.message}</p>
            <button
              onClick={() => navigate("/quiz")}
              className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
            >
              Retour aux quiz
            </button>
          </div>

          <div className="space-y-4">
            {details.map((item, idx) => {
              const question = questions.find((q) => q.id === item.question_id);
              const isCorrect = Boolean(item.is_correct);
              const userAnswer = getOptionLabel(question, item.selected_option);
              const correctAnswer = getOptionLabel(question, item.correct_option);

              return (
                <div key={item.question_id || idx} className={`bg-white rounded-2xl shadow-sm border p-5 ${isCorrect ? "border-green-200" : "border-red-200"}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-500 mb-2">Question {idx + 1}</p>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        {item.question_text || question?.question_text}
                      </h3>
                    </div>
                    <span className={`inline-flex items-center gap-2 shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {isCorrect ? <FaCheckCircle /> : <FaTimesCircle />}
                      {isCorrect ? "Vraie" : "Fausse"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ta réponse</p>
                      <p className={`text-sm font-semibold ${item.selected_option ? (isCorrect ? "text-green-700" : "text-red-700") : "text-gray-500"}`}>
                        {userAnswer}
                      </p>
                    </div>
                    <div className="rounded-xl bg-green-50 p-4">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Réponse correcte</p>
                      <p className="text-sm font-semibold text-green-800">{correctAnswer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-lg mx-auto p-4 sm:p-6 mt-6">
        <button onClick={() => navigate("/quiz")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <FaArrowLeft /> <span className="text-sm font-medium">Retour</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{quiz.title}</h2>
        <p className="text-sm text-gray-500 mb-4">Question {currentIndex + 1} / {questions.length}</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentQuestion.question_text}</h3>
          <div className="space-y-3">
            {["A", "B", "C", "D"].map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left p-3 rounded-xl border-2 transition ${
                  answers[currentQuestion.id] === opt
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium text-gray-900">{opt}) {currentQuestion[`option_${opt.toLowerCase()}`]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
          >
            <FaArrowLeft className="text-xs" /> Précédent
          </button>
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
            >
              <FaCheck className="text-xs" /> Terminer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
            >
              Suivant <FaArrowRight className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
