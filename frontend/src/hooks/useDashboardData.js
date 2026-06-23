import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import useAuth from "./useAuth";

export default function useDashboardData() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const user = userSnap.data();

          // Build dynamic dashboard data
          // You'll need to adjust these field names based on your actual Firestore structure.
          const enrolledCourses = user.courses || [];          // Array of { id, title, progress, ... }
          const activities = user.activities || [];             // Array of recent activities
          const badges = user.badges || [];
          const timeSpent = user.totalTime || 0;                // in minutes
          const successRate = enrolledCourses.length
            ? Math.round(enrolledCourses.reduce((sum, c) => sum + (c.progress || 0), 0) / enrolledCourses.length)
            : 0;

          // Weekly progress (last 7 days) – stored as an object like { "Mon": 20, "Tue": 40, ... }
          const weeklyProgress = user.weeklyProgress || {};

          setData({
            totalCourses: enrolledCourses.length,
            successRate,
            timeSpent: formatTime(timeSpent),
            badges: badges.length,
            courses: enrolledCourses,
            activities,
            weeklyProgress,
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  return { data, loading };
}

// Helper: convert minutes to "Xh Ym" format
function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}