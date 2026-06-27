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
      // 1. Progress stats
      fetch(`http://localhost:5000/api/progress/stats/${uid}`).then(r => r.json()),
      // 2. User courses (started)
      fetch(`http://localhost:5000/api/courses/user/${uid}`).then(r => r.json()),
      // 3. Recent activity
      fetch(`http://localhost:5000/api/activity/user/${uid}`).then(r => r.json()),
      // 4. Weekly activity counts
      fetch(`http://localhost:5000/api/activity/weekly/${uid}`).then(r => r.json()),
      // 5. Recommended course (first recommendation)
      fetch(`http://localhost:5000/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid: uid }),
      }).then(r => r.json()),
    ])
      .then(([stats, courses, activities, weeklyProg, recommendations]) => {
        setData({
          totalCourses: stats.courseCount || 0,
          successRate: stats.avgProgress || 0,
          timeSpent: stats.totalWatchTime || "0m",
          badges: stats.badges || 0,                // if you add badges later
          courses: Array.isArray(courses) ? courses : [],
          activities: Array.isArray(activities) ? activities : [],
          weeklyProgress: Array.isArray(weeklyProg) ? weeklyProg : [0, 0, 0, 0, 0, 0, 0],
          recommendedCourse: Array.isArray(recommendations) && recommendations.length > 0 ? recommendations[0] : null,
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