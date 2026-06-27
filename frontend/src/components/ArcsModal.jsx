import { useState } from "react";
import { FaStar } from "react-icons/fa";

const questions = [
  { key: "attention", label: "Le contenu a capté mon attention" },
  { key: "relevance", label: "Le contenu était pertinent pour moi" },
  { key: "confidence", label: "Je me sens confiant pour appliquer ce que j'ai appris" },
  { key: "satisfaction", label: "Je suis satisfait de cette expérience d'apprentissage" },
];

export default function ArcsModal({ isOpen, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({
    attention: 3,
    relevance: 3,
    confidence: 3,
    satisfaction: 3,
  });

  const handleChange = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Votre avis sur cette session</h3>
        <div className="space-y-5">
          {questions.map((q) => (
            <div key={q.key}>
              <p className="text-sm text-gray-700 mb-2">{q.label}</p>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleChange(q.key, val)}
                    className={`p-2 rounded-lg transition ${
                      ratings[q.key] === val
                        ? "text-purple-600 scale-110"
                        : "text-gray-300 hover:text-yellow-500"
                    }`}
                  >
                    <FaStar className="text-xl" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Plus tard
          </button>
          <button
            onClick={() => onSubmit(ratings)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}