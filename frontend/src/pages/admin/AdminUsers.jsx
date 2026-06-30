import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaSearch, FaSync, FaTrash } from "react-icons/fa";
import Header from "../../components/Header";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setUsers([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 60000);
    const onFocus = () => fetchUsers();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchUsers]);

  const handleDelete = async (uid, name) => {
    if (!window.confirm(`Supprimer définitivement l'utilisateur "${name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setUsers((prev) => prev.filter((u) => u.firebase_uid !== uid));
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .table-classic th {
          font-weight: 600; font-size: 0.875rem; color: #6B7280; background: #F9FAFB;
        }
        .table-classic th:first-child { border-top-left-radius: 16px; }
        .table-classic th:last-child { border-top-right-radius: 16px; }
        .table-classic tr:last-child td:first-child { border-bottom-left-radius: 16px; }
        .table-classic tr:last-child td:last-child { border-bottom-right-radius: 16px; }
      `}</style>

      <Header />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            Utilisateurs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Consultez et gérez tous les utilisateurs de la plateforme.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
        >
          <FaSync className={loading ? "animate-spin" : ""} /> Actualiser
        </button>
      </div>

      <div className="relative w-full sm:w-64 mb-4">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-classic">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Date d'inscription</th>
                  <th className="px-4 py-3 text-left">Progression</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.firebase_uid} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2">
                              <div
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                  style={{ width: `${Math.min(100, user.overall_progress ?? 0)}%` }}
                              />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                              {Math.min(100, user.overall_progress ?? 0)}%
                          </span>
                      </div>
                  </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.firebase_uid}/progress`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition shadow-sm"
                        >
                          <FaEye className="text-xs" /> Détails
                        </button>
                        <button
                          onClick={() => handleDelete(user.firebase_uid, user.name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition"
                        >
                          <FaTrash className="text-xs" /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <FaSearch className="mx-auto text-3xl mb-3" />
                      <p className="font-medium">Aucun utilisateur trouvé</p>
                      <p className="text-sm">Essayez un autre terme de recherche.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}