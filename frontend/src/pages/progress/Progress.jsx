import {
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaArrowUp,
} from "react-icons/fa";
import Header from "../../components/Header";

// Simple line chart component (same as Dashboard)
const LineChart = ({ data }) => {
  const width = 280, height = 120, maxVal = 100;
  const points = data.map((val, i) => `${(i/(data.length-1))*width},${height-(val/maxVal)*height}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      {[0,25,50,75,100].map(p => (
        <line key={p} x1="0" y1={height-(p/maxVal)*height} x2={width} y2={height-(p/maxVal)*height} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
      ))}
      <polyline points={points} fill="none" stroke="#5B4BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((val, i) => (
        <circle key={i} cx={(i/(data.length-1))*width} cy={height-(val/maxVal)*height} r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      ))}
    </svg>
  );
};

const monthlyProgress = [55, 60, 68, 72, 78, 82, 85];
const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const kpis = [
  { icon: FaCheckCircle, color: "bg-green-100 text-green-600", value: "85%", label: "Taux de réussite" },
  { icon: FaClock, color: "bg-yellow-100 text-yellow-600", value: "32h 15m", label: "Temps total" },
  { icon: FaTrophy, color: "bg-pink-100 text-pink-600", value: "7", label: "Badges obtenus" },
  { icon: FaArrowUp, color: "bg-indigo-100 text-indigo-600", value: "12", label: "Cours terminés" },
];

export default function Progress() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
      `}</style>

      <Header />

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaChartBar className="text-purple-600" /> Progression
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Suivez votre évolution et vos performances.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${kpi.color} mb-2 sm:mb-3`}>
              <kpi.icon className="text-base sm:text-lg" />
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Chart section */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Taux de réussite (7 derniers jours)</h3>
          <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600">
            <option>7 jours</option>
            <option>30 jours</option>
          </select>
        </div>
        <LineChart data={monthlyProgress} />
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {days.map((d,i)=><span key={i}>{d}</span>)}
        </div>
      </div>

      {/* Detailed stats */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Répartition par matière</h3>
        <div className="space-y-4">
          {[
            { subject: "JavaScript", progress: 85 },
            { subject: "React", progress: 62 },
            { subject: "Python", progress: 45 },
            { subject: "SQL", progress: 30 },
          ].map((item) => (
            <div key={item.subject}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-900">{item.subject}</span>
                <span className="text-gray-600">{item.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}