import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaCamera,
  FaSave,
  FaCalendarAlt,
  FaGlobe,
  FaKey,
  FaTrash,
  FaPlus,
  FaTimes,
  FaBriefcase,
  FaCheckCircle,
  FaBrain,
  FaGraduationCap,
  FaChartLine,
  FaStar,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";
import {
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

export default function Profile() {
  const { currentUser, userData, updateUserData } = useAuth();

  // ---- Informations générales ----
  const [name, setName] = useState(userData?.name || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [title, setTitle] = useState(userData?.title || "");
  const [bio, setBio] = useState(userData?.bio || "");

  // ---- Compétences ----
  const [skills, setSkills] = useState(userData?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  // ---- Préférences ----
  const [language, setLanguage] = useState(userData?.language || "Français");
  const [timezone, setTimezone] = useState(userData?.timezone || "Europe/Paris");
  const [emailNotif, setEmailNotif] = useState(userData?.emailNotif ?? true);
  const [pushNotif, setPushNotif] = useState(userData?.pushNotif ?? false);

  // ---- Sécurité ----
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // ---- Zone de danger ----
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // ---- État de sauvegarde ----
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ---- Récupération des données du questionnaire ----
  const questionnaireData = {
    age: userData?.questionnaire?.age || "Non renseigné",
    education: userData?.questionnaire?.education || "Non renseigné",
    mastery: userData?.questionnaire?.mastery || "Non renseigné",
    competence: userData?.questionnaire?.competence || "Non renseigné",
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => setSkills(skills.filter((s) => s !== skill));

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "users", currentUser.uid);
      await updateDoc(ref, {
        name,
        title,
        bio,
        skills,
        language,
        timezone,
        emailNotif,
        pushNotif,
      });
      updateUserData({
        name,
        title,
        bio,
        skills,
        language,
        timezone,
        emailNotif,
        pushNotif,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("Mot de passe mis à jour avec succès.");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordError(err.message || "Erreur lors du changement de mot de passe.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (deleteEmail !== currentUser.email) {
      setDeleteError("L'email ne correspond pas à votre compte.");
      return;
    }
    try {
      // 1. Delete Firestore document FIRST
      await deleteDoc(doc(db, "users", currentUser.uid));

      // 2. Delete from SQLite via backend (still authenticated here)
      await fetch(`http://localhost:5000/api/admin/users/${currentUser.uid}`, {
        method: "DELETE",
      });

      // 3. Finally, delete Firebase Auth user (this will sign out)
      await deleteUser(currentUser);

      // onAuthStateChanged will redirect to /login automatically
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setDeleteError(
          "Pour des raisons de sécurité, veuillez vous déconnecter puis vous reconnecter avant de supprimer votre compte."
        );
      } else {
        setDeleteError(err.message || "Erreur lors de la suppression du compte.");
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
      `}</style>

      <Header />

      <div className="max-w-4xl mx-auto">
        {/* ---- En-tête du profil ---- */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                {(name?.[0] || currentUser?.email?.[0] || "?").toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow border border-gray-200 hover:bg-gray-50 transition">
                <FaCamera className="text-gray-500 text-sm" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                <FaBriefcase className="text-xs" /> {title || "Titre professionnel"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                  <FaCalendarAlt className="text-xs" /> Membre depuis{" "}
                  {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  Apprenant
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Profil d'apprentissage ---- */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaBrain className="text-purple-600" /> Profil d'apprentissage
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                <FaCalendarAlt className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Âge</p>
                <p className="text-sm font-semibold text-gray-900">{questionnaireData.age}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <FaGraduationCap className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Niveau d'études</p>
                <p className="text-sm font-semibold text-gray-900">{questionnaireData.education}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <FaStar className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Maîtrise du sujet</p>
                <p className="text-sm font-semibold text-gray-900">{questionnaireData.mastery}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <FaChartLine className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Niveau de compétence</p>
                <p className="text-sm font-semibold text-gray-900">{questionnaireData.competence}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Informations personnelles ---- */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaUser className="text-purple-600" /> Informations personnelles
            </h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  L'email ne peut pas être modifié pour des raisons de sécurité.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre / Profession</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all bg-white text-gray-900 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ---- Compétences ---- */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaCheckCircle className="text-purple-600" /> Compétences
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-purple-400 hover:text-red-500 transition">
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Ajouter une compétence..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-sm"
              />
              <button
                onClick={addSkill}
                className="px-3 py-2.5 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition text-sm flex items-center gap-1"
              >
                <FaPlus className="text-xs" /> Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* ---- Préférences ---- */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaGlobe className="text-purple-600" /> Préférences
            </h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Langue</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 text-gray-900"
                >
                  <option>Français</option>
                  <option>English</option>
                  <option>Arabe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fuseau horaire</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 text-gray-900"
                >
                  <option>Europe/Paris</option>
                  <option>Europe/London</option>
                  <option>America/New_York</option>
                  <option>Asia/Dubai</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Notifications par email</span>
                <button
                  onClick={() => setEmailNotif(!emailNotif)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${emailNotif ? "bg-purple-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotif ? "translate-x-4" : ""}`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Notifications push</span>
                <button
                  onClick={() => setPushNotif(!pushNotif)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${pushNotif ? "bg-purple-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pushNotif ? "translate-x-4" : ""}`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* ---- Sécurité ---- */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaKey className="text-purple-600" /> Sécurité
            </h3>
          </div>
          <div className="p-6">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
              >
                Changer le mot de passe
              </button>
            ) : (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordChange}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Zone de danger ---- */}
        <div className="bg-white rounded-[24px] shadow-sm border border-red-200 overflow-hidden mb-6">
          <div className="border-b border-red-100 px-6 py-4 bg-red-50/30">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <FaTrash className="text-red-600" /> Zone de danger
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Une fois supprimé, votre compte et toutes vos données seront définitivement perdus.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition"
              >
                Supprimer mon compte
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">
                  Veuillez saisir votre adresse email pour confirmer la suppression.
                </p>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
                  >
                    Confirmer la suppression
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteEmail("");
                      setDeleteError("");
                    }}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Bouton de sauvegarde ---- */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-70"
          >
            <FaSave className="text-sm" />
            {saving ? "Enregistrement..." : saved ? "Profil mis à jour !" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </>
  );
}