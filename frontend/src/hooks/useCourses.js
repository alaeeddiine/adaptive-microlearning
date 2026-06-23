import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/firebase";
import useAuth from "./useAuth";

export default function useCourses() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchCourses = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setCourses(userData.courses || []);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des cours :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [currentUser]);

  // Remove a course from Firestore
  const removeCourse = async (courseId) => {
    if (!currentUser) return;

    // Find the course object to remove (Firestore needs the exact element)
    const courseToRemove = courses.find(c => c.id === courseId);
    if (!courseToRemove) return;

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      courses: arrayRemove(courseToRemove),
    });

    // Update local state
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  return { courses, loading, removeCourse };
}