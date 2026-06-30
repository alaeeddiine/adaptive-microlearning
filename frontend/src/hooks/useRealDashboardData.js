import { useState, useEffect } from "react";
import useAuth from "./useAuth";

export default function useRealDashboardData() {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;

    Promise.all([
      fetch(`http://localhost:5000/api/progress/stats/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/courses/user/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/activity/user/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/activity/weekly/${uid}`).then(r => r.json()),
      fetch("http://localhost:5000/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid: uid }),
      }).then(r => r.json()),
    ])
      .then(([stats, courses, activities, weeklyProg, recommendations]) => {
        const isNewFormat = recommendations && typeof recommendations === 'object' && !Array.isArray(recommendations);
        const courseList = isNewFormat ? (recommendations.courses || []) : (Array.isArray(recommendations) ? recommendations : []);
        const predictedType = isNewFormat ? recommendations.predictedType : null;

        setData({
          totalCourses: stats.courseCount || 0,
          completedCourses: stats.completedCourses || 0,
          avgProgress: stats.avgProgress || 0,
          timeSpent: stats.totalWatchTime || "0m",
          courses: Array.isArray(courses) ? courses : [],
          activities: Array.isArray(activities) ? activities : [],
          weeklyProgress: Array.isArray(weeklyProg) ? weeklyProg : [0, 0, 0, 0, 0, 0, 0],
          recommendedCourse: courseList.length > 0 ? courseList[0] : null,
          predictedType: predictedType,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard data error:", err);
        setLoading(false);
      });
  }, [currentUser]);

  return { data, loading };
}
// Après avoir reçu les stats, vérifier les badges à attribuer
const checkAndAwardBadges = (stats) => {
  const uid = currentUser.uid;
  const badgesToAward = [];

  if (stats.courseCount >= 1) badgesToAward.push({ name: "Premier cours" });
  if (stats.courseCount >= 3) badgesToAward.push({ name: "3 cours commencés" });
  if (stats.completedCourses >= 1) badgesToAward.push({ name: "Cours terminé" });
  if (stats.avgProgress >= 100) badgesToAward.push({ name: "Maître de la progression" });
  
  // Convertir le temps en heures (ex: "2h 30m" → 2.5)
  const timeStr = stats.totalWatchTime || "0m";
  const hoursMatch = timeStr.match(/(\d+)h/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  if (hours >= 5) badgesToAward.push({ name: "5 heures d'apprentissage" });

  // Appeler le backend pour chaque badge manquant
  badgesToAward.forEach(badge => {
    fetch(`http://localhost:5000/api/badges/${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badge),
    }).catch(console.error);
  });
};