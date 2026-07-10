import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
  FaBrain,
  FaChartLine,
  FaMobileAlt,
  FaQuoteLeft,
  FaGoogle,
  FaGithub,
  FaSun,
} from "react-icons/fa";
import useAuth from "../../hooks/useAuth";

export default function Login() {
  const { login, isAdminEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await login(email, password);
      navigate(isAdminEmail(email) ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case "auth/invalid-credential":
          setError("Email ou mot de passe incorrect.");
          break;
        case "auth/user-not-found":
          setError("Utilisateur introuvable.");
          break;
        case "auth/wrong-password":
          setError("Mot de passe incorrect.");
          break;
        default:
          setError("Impossible de se connecter.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          background: #fff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .clay {
          box-shadow: inset 2px 2px 5px rgba(255,255,255,0.7),
                      inset -3px -3px 5px rgba(0,0,0,0.05),
                      8px 8px 15px rgba(0,0,0,0.1);
        }
        .clay-book {
          box-shadow: inset 3px 3px 6px rgba(255,255,255,0.8),
                      inset -3px -3px 6px rgba(0,0,0,0.05),
                      6px 6px 12px rgba(0,0,0,0.08);
        }
        .floating-testimonial {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(0.2deg); }
          75% { transform: translateY(2px) rotate(-0.2deg); }
        }
        .orb-1 {
          animation: orb1 12s infinite linear;
        }
        @keyframes orb1 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -60px) scale(1.05); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
          75% { transform: translate(-30px, -20px) scale(1.02); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .dot-pattern {
          background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .checkbox-custom:checked {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>

      {/* Scrollable – exactement comme register, sans blocage de hauteur */}
      <div className="min-h-screen flex flex-col lg:flex-row bg-white">
        {/* ======== HERO (left column) ======== */}
        <div className="order-2 lg:order-1 w-full lg:w-1/2 relative bg-gradient-to-br from-white via-[#fafbff] to-[#f3f0ff] p-6 lg:p-8 flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl orb-1 opacity-60" />
          <div
            className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl orb-1 opacity-40"
            style={{ animationDirection: "reverse", animationDuration: "15s" }}
          />

          {/* Logo (desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 relative z-10 mb-6">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50">
              <FaGraduationCap className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-gray-900">Learn</span>
              <span className="text-[#5B4BFF]">Smart</span>
            </span>
          </div>

          {/* Headline */}
          <div className="relative z-10 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Apprenez plus intelligemment,
              <br />
              progressez{" "}
              <span className="text-[#5B4BFF]">plus vite</span>
            </h1>
            <p className="text-base lg:text-lg text-gray-500 mt-3 max-w-md mx-auto lg:mx-0 font-medium">
              La plateforme d'apprentissage adaptatif qui s'adapte à vous, pas l'inverse.
            </p>
          </div>

          {/* Feature cards */}
          <div className="relative z-10 grid grid-cols-1 gap-3 mt-6 max-w-md mx-auto lg:mx-0">
            {[
              {
                icon: FaBrain,
                color: "purple",
                title: "Contenu adaptatif",
                desc: "Recommandations personnalisées basées sur votre profil et vos progrès.",
              },
              {
                icon: FaChartLine,
                color: "green",
                title: "Suivi intelligent",
                desc: "Analyse de vos performances pour mieux vous accompagner.",
              },
              {
                icon: FaMobileAlt,
                color: "orange",
                title: "Apprentissage flexible",
                desc: "Apprenez n'importe où, n'importe quand, sur tous vos appareils.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div
                  className={`w-10 h-10 bg-${item.color}-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
                >
                  <item.icon className={`text-${item.color}-600 text-lg`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm lg:text-base">
                    {item.title}
                  </h4>
                  <p className="text-xs lg:text-sm text-gray-500 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Illustration + testimonial – top-right, fully visible */}
          <div className="relative z-10 mt-4 lg:mt-6 flex items-end justify-center lg:justify-start">
            <div className="relative w-64 lg:w-80 h-56 lg:h-72">
              {/* Books stack */}
              <div className="absolute bottom-0 left-0 flex flex-col-reverse items-center">
                <div className="w-16 lg:w-20 h-2.5 lg:h-3 bg-blue-100 rounded-md clay-book relative z-10" />
                <div className="w-20 lg:w-24 h-3.5 lg:h-4 bg-indigo-100 rounded-md clay-book -mb-1 relative z-20" />
                <div className="w-24 lg:w-28 h-4 lg:h-5 bg-purple-100 rounded-md clay-book -mb-1 relative z-30" />
              </div>
              {/* Graduation cap */}
              <div className="absolute bottom-4 lg:bottom-5 left-8 lg:left-10 z-40">
                <div className="w-8 lg:w-10 h-8 lg:h-10 bg-purple-400 rounded-full clay transform rotate-12" />
                <div className="w-6 lg:w-8 h-1.5 lg:h-2 bg-yellow-300 rounded-full absolute -top-1 left-1" />
                <div className="w-1.5 lg:w-2 h-5 lg:h-6 bg-purple-700 rounded-full absolute -right-1 top-2 lg:top-3 transform rotate-45" />
              </div>
              {/* Plant pot */}
              <div className="absolute bottom-0 right-8 lg:right-10 flex flex-col items-center z-50">
                <div className="w-4 lg:w-5 h-7 lg:h-8 bg-green-400 rounded-t-full relative">
                  <div className="w-2.5 lg:w-3 h-3.5 lg:h-4 bg-green-300 rounded-full absolute -top-2 left-1 transform -rotate-12" />
                  <div className="w-2.5 lg:w-3 h-3.5 lg:h-4 bg-green-300 rounded-full absolute -top-2 right-1 transform rotate-12" />
                </div>
                <div className="w-9 lg:w-10 h-7 lg:h-8 bg-orange-300 rounded-b-xl clay" />
              </div>
              {/* Light bulb */}
              <div className="absolute top-1 lg:top-2 right-1 lg:right-2 z-50">
                <div className="w-10 lg:w-12 h-10 lg:h-12 bg-yellow-200 rounded-full clay flex items-center justify-center">
                  <div className="w-3 lg:w-4 h-3 lg:h-4 bg-white rounded-full opacity-60 absolute top-1 right-1" />
                </div>
                <div className="w-3 lg:w-4 h-1.5 lg:h-2 bg-gray-300 rounded-b-full mx-auto" />
                <div className="w-1.5 lg:w-2 h-1 bg-gray-400 rounded-full mx-auto" />
              </div>
            </div>

            {/* Testimonial glass card – haut droit, pas de scroll */}
            <div className="absolute top-4 right-2 lg:top-6 lg:right-4 w-60 lg:w-72 bg-white/70 backdrop-blur-2xl rounded-2xl p-4 lg:p-5 border border-white/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] floating-testimonial">
              <FaQuoteLeft className="text-purple-400 text-sm lg:text-lg mb-1 lg:mb-2" />
              <p className="text-xs lg:text-sm text-gray-900 leading-relaxed font-medium">
                Grâce à LearnSmart, j'ai amélioré mes compétences de 40% en
                seulement quelques semaines !
              </p>
              <div className="flex items-center gap-2 lg:gap-3 mt-3 lg:mt-4">
                <div className="w-7 lg:w-9 h-7 lg:h-9 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 shadow-inner">
                  SK
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-semibold text-gray-900">
                    Sarah K.
                  </p>
                  <p className="text-xs text-gray-500">
                    Développeuse Full Stack
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======== LOGIN FORM (right column) ======== */}
        <div className="order-1 lg:order-2 w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white relative">
          {/* Mobile logo */}
          <div className="lg:hidden absolute top-4 left-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <FaGraduationCap className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-gray-900">Learn</span>
              <span className="text-[#5B4BFF]">Smart</span>
            </span>
          </div>

          {/* Theme toggle */}
          <button className="absolute top-4 right-4 lg:top-6 lg:right-6 w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:shadow-md transition-all duration-300 shadow-sm">
            <FaSun className="text-lg" />
          </button>

          {/* Wider card – même largeur que register */}
          <div className="w-full max-w-[560px] mt-12 lg:mt-0">
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-gray-100/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
              {/* Heading */}
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Bon retour !{" "}
                  <span role="img" aria-label="wave">👋</span>
                </h2>
                <p className="text-gray-500 mt-1 text-sm font-medium">
                  Connectez-vous pour continuer votre apprentissage.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Adresse e-mail
                  </label>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-2xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-md bg-white peer-checked:bg-purple-600 peer-checked:border-purple-600 flex items-center justify-center transition-colors checkbox-custom" />
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                      Se souvenir de moi
                    </span>
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-[#5B4BFF] font-semibold hover:underline transition"
                  >
                    Mot de passe oublié ?
                  </a>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#5B4BFF] to-[#7C3AED] hover:from-[#4C3BEF] hover:to-[#6D28D9] text-white font-bold py-3 rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              {/* Divider */}
              {/* <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">
                    ou continuer avec
                  </span>
                </div>
              </div> */}

              {/* OAuth */}
              {/* <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  <FaGoogle className="text-red-500 text-lg" />
                  Continuer avec Google
                </button>
                <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  <FaGithub className="text-black text-lg" />
                  Continuer avec GitHub
                </button>
              </div> */}

              {/* Sign up link */}
              <p className="text-center text-sm text-gray-500 mt-5 font-medium">
                Pas encore de compte ?{" "}
                <Link
                  to="/register"
                  className="text-[#5B4BFF] font-bold hover:underline transition"
                >
                  Créer un compte
                </Link>
              </p>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
                <span>&copy; 2024 LearnSmart. Tous droits réservés.</span>
                <div className="flex gap-4">
                  <a href="/terms" className="hover:text-gray-600 transition">Conditions</a>
                  <a href="/privacy" className="hover:text-gray-600 transition">Confidentialité</a>
                  <a href="/support" className="hover:text-gray-600 transition">Support</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
