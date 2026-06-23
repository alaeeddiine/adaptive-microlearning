import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveQuestionnaire } from "../services/questionnaireService";
import { FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import useAuth from "../hooks/useAuth";

const questions = [
  {
    key: "age",
    title: "Quel est votre âge ?",
    subtitle: "Cela nous aide à adapter les contenus à votre tranche d'âge.",
    options: ["<16", "16-20", "21-30", "31-45", "45+"],
  },
  {
    key: "education",
    title: "Quel est votre niveau d'études ?",
    subtitle: "Pour mieux cibler les contenus pédagogiques.",
    options: ["Collège", "Lycée", "Université", "Formation professionnelle", "Autodidacte"],
  },
  {
    key: "mastery",
    title: "Quel est votre niveau de maîtrise du sujet ?",
    subtitle: "Évaluez votre connaissance actuelle du domaine.",
    options: ["Aucune connaissance", "Connaissances de base", "Niveau intermédiaire", "Avancé", "Expert"],
  },
  {
    key: "competence",
    title: "Quel est votre niveau de compétence actuel ?",
    subtitle: "Cela détermine le point de départ de votre parcours.",
    options: ["Débutant", "Intermédiaire", "Avancé", "Expert"],
  },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const { updateUserData, currentUser} = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});   // ← ajout d'une ref
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const updateAnswer = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;   // ← synchroniser la ref
  };

  // Dans Questionnaire.jsx, fonction next()
  const next = async () => {
      if (step < questions.length - 1) {
          setStep(step + 1);
      } else {
          try {
              setIsSubmitting(true);
              const finalAnswers = answersRef.current;
              await saveQuestionnaire(finalAnswers);   // Sauvegarde Firestore

              // 🔥 Synchronisation SQLite
              await fetch("http://localhost:5000/api/users/questionnaire", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                      firebase_uid: currentUser.uid,   // il faut récupérer currentUser depuis le contexte
                      ...finalAnswers,
                  }),
              });

              updateUserData({
                  questionnaireComplete: true,
                  questionnaire: finalAnswers,
              });
              navigate("/dashboard");
          } catch (err) {
              console.error(err);
              setIsSubmitting(false);
          }
      }
  };

  const previous = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          background: #F7F8FC;
          -webkit-font-smoothing: antialiased;
        }
        .option-card {
          transition: all 0.2s ease;
        }
        .option-card:hover {
          border-color: #5B4BFF;
        }
        .option-card.selected {
          border-color: #5B4BFF;
          background-color: #F5F3FF;
          box-shadow: 0 0 0 3px rgba(91,75,255,0.15);
        }
      `}</style>

      <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Personnalisez votre expérience
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quelques questions pour mieux vous connaître.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
          <div
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-400 mb-4">
          {step + 1} / {questions.length}
        </div>

        {/* Question card – compact padding */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            {question.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4">
            {question.subtitle}
          </p>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options.map((opt) => (
              <button
                key={opt}
                onClick={() => updateAnswer(question.key, opt)}
                className={`option-card w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left ${
                  answers[question.key] === opt
                    ? "selected border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    answers[question.key] === opt
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300"
                  }`}
                >
                  {answers[question.key] === opt && (
                    <span className="w-2 h-2 bg-white rounded-full" />
                  )}
                </span>
                <span className="text-sm font-medium text-gray-900">{opt}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={previous}
              disabled={step === 0}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FaArrowLeft className="text-xs" /> Préc.
            </button>

            <button
              onClick={next}
              disabled={!answers[question.key] || isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {step === questions.length - 1 ? (
                <>
                  {isSubmitting ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    <FaCheck className="text-xs" />
                  )}
                  {isSubmitting ? "..." : "Terminer"}
                </>
              ) : (
                <>
                  Suivant <FaArrowRight className="text-xs" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center mt-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Passer le questionnaire
          </button>
        </div>
      </div>
    </>
  );
}