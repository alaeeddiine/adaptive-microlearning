import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFire, FaPlay, FaQuestionCircle } from "react-icons/fa";
import Header from "../../components/Header";

function QuizCard({ quiz, onStart }) {
  return (
    <div className="min-w-[240px] sm:min-w-[280px] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg text-purple-600">
          <FaQuestionCircle />
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
          Quiz
        </span>
      </div>
      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{quiz.title}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
        {quiz.description || "Quiz sans description"}
      </p>
      <button
        onClick={() => onStart(quiz)}
        className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition shadow-sm flex items-center justify-center gap-1"
      >
        <FaPlay className="text-xs" /> Commencer le quiz
      </button>
    </div>
  );
}

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/quiz")
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleStart = (quiz) => {
    navigate(`/quiz/${quiz.id}`);
  };

  const featured = quizzes[0] || null;
  const recommended = quizzes.slice(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Header />

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaQuestionCircle className="text-purple-600" /> Quiz
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Testez vos connaissances avec des quiz adaptes a votre niveau.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaQuestionCircle className="mx-auto text-4xl mb-3" />
          <p className="font-medium">Aucun quiz disponible.</p>
          <p className="text-sm">Revenez plus tard.</p>
        </div>
      ) : (
        <>
          {featured && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg hover-elevate">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                    <FaQuestionCircle />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium mb-2">
                      Quiz
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold">{featured.title}</h3>
                    <p className="mt-2 text-white/80 text-sm max-w-lg">
                      {featured.description || "Quiz sans description"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-white/70 text-xs">
                      <span className="flex items-center gap-1">
                        <FaQuestionCircle /> Quiz interactif
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStart(featured)}
                  className="mt-5 inline-flex items-center gap-2 bg-white text-purple-700 font-semibold py-2.5 px-5 rounded-xl text-sm shadow hover:bg-gray-100 transition"
                >
                  <FaPlay /> Commencer le quiz
                </button>
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaFire className="text-orange-500" /> Quiz recommandes
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
                {recommended.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} onStart={handleStart} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
