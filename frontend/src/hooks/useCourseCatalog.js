import { useState, useEffect, useCallback } from "react";
import useAuth from "./useAuth";

export default function useCourseCatalog() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(() => {
    if (!currentUser) {
      setCourses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:5000/api/courses/user/${currentUser.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load user courses:", err);
        setCourses([]);
        setLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, refresh: fetchCourses };
}