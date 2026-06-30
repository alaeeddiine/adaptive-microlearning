import { useState, useEffect } from "react";
import useAuth from "./useAuth";

export default function useCourseCatalog() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setCourses([]);
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/catalog/${currentUser.uid}`)
      .then(res => res.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load catalog:", err);
        setCourses([]);
        setLoading(false);
      });
  }, [currentUser]);

  return { courses, loading };
}