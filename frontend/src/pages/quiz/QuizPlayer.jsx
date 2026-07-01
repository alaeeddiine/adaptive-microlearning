import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";

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

  // Activity logger (like CoursePlayer)
  const logActivity = (eventType, data = {}) => {
    if (!currentUser) return;
    fetch("http://localhost:5000/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,              // we use course_id field for quiz id
        event_type: eventType,
        event_data: data,
        ab_group: userData?.ab_group,
      }),
    }).catch(console.error);
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/quiz/${id}/take`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(err => { setError("Impossible de charger le quiz."); setLoading(false); });
  }, [id]);

  const handleSelect = (option) => {
    if (submitted) return;
    setAnswers({ ...answers, [questions[currentIndex].id]: option });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    const payload = {
      firebase_uid: currentUser.uid,
      answers: Object.entries(answers).map(([question_id, selected_option]) => ({
        question_id: parseInt(question_id),
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

      // Log activity with quiz title and score
      logActivity("quiz_submitted", {
        score: data.score,
        quiz_title: quiz?.title || "Quiz",
      });
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la soumission.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center"><p className="text-red-600">{error}</p><button onClick={() => navigate("/quiz")} className="mt-4 px-4 py-2 bg-gray-200 rounded-xl">Retour</button></div>;

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-lg mx-auto p-6 mt-12 bg-white rounded-2xl shadow-sm border text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Résultat</h2>
          <p className="text-3xl font-extrabold text-purple-600 mb-2">{result.score}%</p>
          <p className="text-gray-600">{result.message}</p>
          <button onClick={() => navigate("/quiz")} className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
            Retour aux quiz
          </button>
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
            {["A", "B", "C", "D"].map(opt => (
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
