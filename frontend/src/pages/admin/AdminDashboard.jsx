import { useState, useEffect } from "react";
import { FaUsers, FaBookOpen, FaGraduationCap, FaChartLine } from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, courses: 0, completed: 0, avgProgress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Appeler le backend pour obtenir les stats
    fetch("http://localhost:5000/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin ..." /></div>;

  return (
    <>
      <Header />
      <h2 className="text-2xl font-bold mb-6">Tableau de bord administrateur</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FaUsers, label: "Utilisateurs", value: stats.users, color: "bg-blue-100 text-blue-600" },
          { icon: FaBookOpen, label: "Cours", value: stats.courses, color: "bg-green-100 text-green-600" },
          { icon: FaGraduationCap, label: "Terminés", value: stats.completed, color: "bg-yellow-100 text-yellow-600" },
          { icon: FaChartLine, label: "Progression moyenne", value: `${stats.avgProgress}%`, color: "bg-purple-100 text-purple-600" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
              <stat.icon className="text-lg" />
            </div>
            <p className="text-2xl font-extrabold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphiques ou listes récentes */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold">Derniers inscrits</h3>
          {/* Liste des derniers utilisateurs */}
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold">Activité récente</h3>
          {/* Activités récentes */}
        </div>
      </div>
    </>
  );
}