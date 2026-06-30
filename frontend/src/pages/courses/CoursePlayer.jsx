import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";
import ArcsModal from "../../components/ArcsModal";
import {
  FaArrowLeft, FaClock, FaBrain, FaCheck,
} from "react-icons/fa";

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [showArcs, setShowArcs] = useState(false);

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const focusLostRef = useRef(false);

  const getCurrentTime = useCallback(() => {
    if (videoRef.current) return videoRef.current.currentTime;
    if (playerRef.current?.getCurrentTime) return playerRef.current.getCurrentTime();
    return null;
  }, []);

  const logActivity = useCallback(
    (eventType, data = {}) => {
      if (!currentUser) return;
      fetch("http://localhost:5000/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          course_id: id,
          event_type: eventType,
          event_data: data,
          ab_group: userData?.ab_group,
        }),
      }).catch(console.error);
    },
    [currentUser, id, userData?.ab_group]
  );

  // Load course
  useEffect(() => {
    fetch(`http://localhost:5000/api/courses/${id}`)
      .then(res => res.json())
      .then(data => {
        setCourse(data);
        setLoading(false);
        if (data.category_id) {
          fetch(`http://localhost:5000/api/admin/categories/${data.category_id}/courses`)
            .then(res => res.json())
            .then(courses => {
              const filtered = Array.isArray(courses)
                ? courses.filter(c => c.id !== data.id).slice(0, 4)
                : [];
              setRelatedCourses(filtered);
            })
            .catch(console.error);
        }
      })
      .catch(() => { setError("Cours introuvable."); setLoading(false); });
  }, [id]);

  // Load existing progress
  useEffect(() => {
    if (!currentUser || !id) return;
    fetch(`http://localhost:5000/api/progress/${currentUser.uid}/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.progress !== undefined) setProgress(data.progress);
      })
      .catch(console.error);
  }, [currentUser, id]);

  // Save progress
  const saveProgress = useCallback(() => {
    if (!currentUser || !id) return;
    const currentTime = getCurrentTime();
    if (currentTime === null) return;

    fetch("http://localhost:5000/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        watched_segments: [[0, currentTime]],
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data?.progress !== undefined) setProgress(data.progress);
      })
      .catch(console.error);
  }, [currentUser, id, getCurrentTime]);

  // Periodic save every 10s
  useEffect(() => {
    if (!course) return;
    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [course, saveProgress]);

  // YouTube helpers
  const isYouTube = (url) => url?.includes("youtube.com") || url?.includes("youtu.be");
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  // YouTube player setup
  useEffect(() => {
    if (!course || !isYouTube(course.media)) return;
    const videoId = getYouTubeVideoId(course.media);
    if (!videoId) { setError("ID vidéo YouTube introuvable."); return; }

    const createPlayer = () => {
      if (playerRef.current) playerRef.current.destroy();
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId,
        playerVars: {
          origin: window.location.origin,
        },
        events: {
            onReady: () => {
              if (!startedRef.current) {
                startedRef.current = true;
                logActivity("started", { progress: 0 });
              }
            },
            onError: () => setError("Erreur de lecture YouTube."),
          },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    };
  }, [course]);

  // HTML5 event handlers
  const handlePlay = () => {
    if (!startedRef.current) { startedRef.current = true; logActivity("started", { progress: 0 }); }
  };
  const handlePause = () => saveProgress();
  const handleEnded = () => saveProgress();

  // Focus/blur
  useEffect(() => {
    const onBlur = () => { focusLostRef.current = true; };
    const onFocus = () => { focusLostRef.current = false; };
    window.addEventListener("blur", onBlur); window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); };
  }, []);

  // Abandon on unload
  useEffect(() => {
    let abandonTimeout = null;

    const onBlur = () => {
      abandonTimeout = setTimeout(() => {
        logActivity("abandoned", { reason: "window_blur_5min", progress: progress });
        navigator.sendBeacon("http://localhost:5000/api/activity", JSON.stringify({
          firebase_uid: currentUser.uid,
          course_id: id,
          event_type: "abandoned",
          event_data: { progress: progress, reason: "inactive_5min" },
          ab_group: userData?.ab_group
        }));
      }, 300000); // 5 minutes
    };

    const onFocus = () => {
      if (abandonTimeout) {
        clearTimeout(abandonTimeout);
        abandonTimeout = null;
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const handleBeforeUnload = () => {
      const currentTime = getCurrentTime();
      if (currentTime) {
        navigator.sendBeacon("http://localhost:5000/api/progress", JSON.stringify({
          firebase_uid: currentUser.uid,
          course_id: id,
          watched_segments: [[0, currentTime]],
        }));
        if (progress < 100) {
          navigator.sendBeacon("http://localhost:5000/api/activity", JSON.stringify({
            firebase_uid: currentUser.uid,
            course_id: id,
            event_type: "abandoned",
            event_data: { progress: progress, reason: "browser_close" },
            ab_group: userData?.ab_group
          }));
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (abandonTimeout) clearTimeout(abandonTimeout);
    };
  }, [currentUser, id, getCurrentTime, progress, logActivity, userData?.ab_group]);

  // Completion – trigger ARCS modal for both groups
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      completedRef.current = true;
      logActivity("completed", { progress: 100 });
      setTimeout(() => setShowArcs(true), 1500);
    }
  }, [progress, logActivity]);

  // ARCS submit handler
  const handleArcsSubmit = (ratings) => {
    fetch("http://localhost:5000/api/arcs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        ...ratings,
        ab_group: userData?.ab_group,
      }),
    })
      .then(() => setShowArcs(false))
      .catch(console.error);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>;
  if (error || !course) return <div className="min-h-screen flex flex-col items-center justify-center"><p className="text-red-600">{error || "Cours non disponible"}</p><button onClick={() => navigate("/courses")} className="mt-4 px-4 py-2 bg-gray-200 rounded-xl">Retour aux cours</button></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="w-full">
        <div className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <FaArrowLeft /> <span className="text-sm font-medium">Retour</span>
          </button>
          {course.category_name && (
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">{course.category_name}</span>
          )}
        </div>

        <div className="max-w-5xl mx-auto mt-4 mb-6 px-4 sm:px-6 lg:px-0">
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            {isYouTube(course.media) ? (
              <div className="aspect-video"><div id="youtube-player" className="w-full h-full" /></div>
            ) : course.media ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-auto"
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={() => setError("Impossible de charger la vidéo.")}
              >
                <source src={course.media} />
                Votre navigateur ne supporte pas la vidéo.
              </video>
            ) : (
              <div className="aspect-video flex items-center justify-center text-white text-lg">Aucun contenu média</div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 pb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">{course.title}</h1>
          <p className="mt-2 text-gray-600 leading-relaxed max-w-3xl">{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FaBrain className="text-purple-500" /> {course.level || "N/A"}</span>
            <span className="flex items-center gap-1"><FaClock className="text-purple-500" /> {course.duration || "N/A"}</span>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-gray-700">Progression</span>
              <span className="text-purple-600 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={async () => {
              if (progress < 100) {
                try {
                  const res = await fetch(`http://localhost:5000/api/progress/${id}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ firebase_uid: currentUser.uid })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setProgress(100);
                    logActivity("completed", { progress: 100, method: "manual" });
                  } else {
                    alert(data.message || "Vous n'avez pas terminé les prérequis (visionnage ≥ 90% ou quiz réussi).");
                  }
                } catch (e) {
                  alert("Erreur lors de la validation");
                }
              }
            }}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <FaCheck /> Marquer comme terminé
          </button>
        </div>

        {relatedCourses.length > 0 && (
          <div className="w-full bg-white border-t border-gray-200 py-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cours similaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedCourses.map(c => (
                  <div key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition border border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{c.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <FaClock className="text-purple-400" /> {c.duration}
                      <FaBrain className="text-purple-400" /> {c.level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ARCS Modal */}
      <ArcsModal
        isOpen={showArcs}
        onClose={() => setShowArcs(false)}
        onSubmit={handleArcsSubmit}
      />
    </div>
  );
}