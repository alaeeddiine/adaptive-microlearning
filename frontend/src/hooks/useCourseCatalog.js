import { useState, useEffect } from "react";

export default function useCourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/courses")
      .then(res => res.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load courses:", err);
        setCourses([]);
        setLoading(false);
      });
  }, []);

  return { courses, loading };
}