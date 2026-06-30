import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaQuestionCircle, FaPlay, FaClock, FaCheckCircle } from "react-icons/fa";
import Header from "../../components/Header";

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/quiz")
      .then(res => res.json())
      .then(data => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
      `}</style>
      <Header />
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaQuestionCircle className="text-purple-600" /> Quiz
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Testez vos connaissances avec des quiz adaptés à votre niveau.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map(quiz => (
          <div
            key={quiz.id}
            className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl mb-3">
              <FaQuestionCircle />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{quiz.description || "Quiz sans description"}</p>
            <button
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-1"
            >
              <FaPlay className="text-xs" /> Commencer
            </button>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <FaQuestionCircle className="mx-auto text-4xl mb-3" />
            <p className="font-medium">Aucun quiz disponible.</p>
            <p className="text-sm">Revenez plus tard.</p>
          </div>
        )}
      </div>
    </>
  );
}