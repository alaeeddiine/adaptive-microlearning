import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { FaChartBar, FaUsers, FaCheckCircle, FaClock, FaChartPie } from "react-icons/fa";

export default function ProgressManager() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:5000/api/analytics/ab-testing")
            .then(res => res.json())
            .then(data => {
                setMetrics(data);
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

    if (!metrics) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>Aucune donnée disponible.</p>
            </div>
        );
    }

    const completionRateA = metrics.groupA_started > 0
        ? Math.min(100, Math.round((metrics.groupA_completed / metrics.groupA_started) * 100))
        : 0;
    const completionRateB = metrics.groupB_started > 0
        ? Math.min(100, Math.round((metrics.groupB_completed / metrics.groupB_started) * 100))
        : 0;

    return (
        <>
            <style>{`
                .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
            `}</style>
            <Header />
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                    <FaChartBar className="text-purple-600" /> Analyse de la progression (A/B Testing)
                </h2>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
                        <FaUsers className="text-blue-600 text-xl mb-2" />
                        <p className="text-2xl font-extrabold text-gray-900">{metrics.groupA_users}</p>
                        <p className="text-sm text-gray-500">Utilisateurs Groupe A</p>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
                        <FaUsers className="text-green-600 text-xl mb-2" />
                        <p className="text-2xl font-extrabold text-gray-900">{metrics.groupB_users}</p>
                        <p className="text-sm text-gray-500">Utilisateurs Groupe B</p>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
                        <FaCheckCircle className="text-purple-600 text-xl mb-2" />
                        <p className="text-2xl font-extrabold text-gray-900">{completionRateA}%</p>
                        <p className="text-sm text-gray-500">Taux complétion Groupe A</p>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
                        <FaCheckCircle className="text-indigo-600 text-xl mb-2" />
                        <p className="text-2xl font-extrabold text-gray-900">{completionRateB}%</p>
                        <p className="text-sm text-gray-500">Taux complétion Groupe B</p>
                    </div>
                </div>

                {/* Progression moyenne */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaClock className="text-yellow-600" /> Progression moyenne
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">Groupe A</span>
                                    <span className="text-gray-600">{metrics.groupA_avgProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${metrics.groupA_avgProgress}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">Groupe B</span>
                                    <span className="text-gray-600">{metrics.groupB_avgProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-600 h-full rounded-full" style={{ width: `${metrics.groupB_avgProgress}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Distribution des types de contenu */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaChartPie className="text-purple-600" /> Types de contenu préférés
                        </h3>
                        <div className="space-y-3">
                            {metrics.contentDistribution && Object.keys(metrics.contentDistribution.A || {}).length > 0 ? (
                                <>
                                    <p className="text-sm font-semibold text-gray-500 mb-2">Groupe A</p>
                                    {Object.entries(metrics.contentDistribution.A || {}).map(([type, count]) => (
                                        <div key={type} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{type}</span>
                                            <span className="text-gray-600">{count}</span>
                                        </div>
                                    ))}
                                    <p className="text-sm font-semibold text-gray-500 mt-3 mb-2">Groupe B</p>
                                    {Object.entries(metrics.contentDistribution.B || {}).map(([type, count]) => (
                                        <div key={type} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{type}</span>
                                            <span className="text-gray-600">{count}</span>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p className="text-gray-400 text-sm">Pas encore de données.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}