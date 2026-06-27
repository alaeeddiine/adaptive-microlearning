import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";
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

  // Refs pour la vidéo
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const segmentsRef = useRef([]);
  const currentSegmentStart = useRef(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const focusLostRef = useRef(false);

  const getCurrentTime = () => {
    if (videoRef.current) return videoRef.current.currentTime;
    if (playerRef.current?.getCurrentTime) return playerRef.current.getCurrentTime();
    return null;
  };

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

  // Charger le cours et les cours similaires
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

  // Charger la progression existante
  useEffect(() => {
    if (!currentUser || !id) return;
    fetch(`http://localhost:5000/api/progress/${currentUser.uid}/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.progress !== undefined) setProgress(data.progress);
          if (data.watched_segments) {
            try {
              const segs = typeof data.watched_segments === "string"
                ? JSON.parse(data.watched_segments) : data.watched_segments;
              segmentsRef.current = segs;
            } catch { segmentsRef.current = []; }
          }
        }
      })
      .catch(console.error);
  }, [currentUser, id]);

  // Segment helpers
  const startSegment = (time) => {
    if (currentSegmentStart.current === null && !focusLostRef.current) {
      currentSegmentStart.current = time;
    }
  };
  const endSegment = (time) => {
    if (currentSegmentStart.current !== null) {
      const start = currentSegmentStart.current;
      const end = time;
      if (end - start > 1) segmentsRef.current = [...segmentsRef.current, [start, end]];
      currentSegmentStart.current = null;
    }
  };

  const saveSegments = useCallback(() => {
    if (!currentUser || !id) return;
    let allSegments = [...segmentsRef.current];
    if (currentSegmentStart.current !== null) {
      const currentTime = getCurrentTime();
      if (currentTime !== null && currentTime - currentSegmentStart.current > 1) {
        allSegments = [...allSegments, [currentSegmentStart.current, currentTime]];
      }
    }
    fetch("http://localhost:5000/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        watched_segments: allSegments,
      }),
    })
      .then(res => res.json())
      .then(data => { if (data?.progress !== undefined) setProgress(data.progress); })
      .catch(console.error);
  }, [currentUser, id, getCurrentTime]);

  // YouTube
  const isYouTube = (url) => url?.includes("youtube.com") || url?.includes("youtu.be");
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  useEffect(() => {
    if (!course || !isYouTube(course.media)) return;
    const videoId = getYouTubeVideoId(course.media);
    if (!videoId) { setError("ID vidéo YouTube introuvable."); return; }

    const createPlayer = () => {
      if (playerRef.current) playerRef.current.destroy();
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId,
        events: {
          onReady: () => {
            const intervalId = setInterval(() => {
              const player = playerRef.current;
              if (player?.getPlayerState && player?.getCurrentTime) {
                const state = player.getPlayerState();
                const currentTime = player.getCurrentTime();
                if (state === 1 && !focusLostRef.current) {
                  if (currentSegmentStart.current === null) startSegment(currentTime);
                } else {
                  endSegment(currentTime);
                }
              }
            }, 2000);
            const saveIntervalId = setInterval(() => saveSegments(), 10000);
            return () => { clearInterval(intervalId); clearInterval(saveIntervalId); };
          },
          onError: () => setError("Erreur de lecture YouTube."),
        },
      });
    };

    if (window.YT?.Player) createPlayer();
    else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => { if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; } };
  }, [course, saveSegments, focusLostRef]);

  // HTML5 handlers
  const handlePlay = () => {
    if (!startedRef.current) { startedRef.current = true; logActivity("started", { progress: 0 }); }
    if (videoRef.current) startSegment(videoRef.current.currentTime);
  };
  const handlePause = () => {
    if (videoRef.current) endSegment(videoRef.current.currentTime);
    saveSegments();
  };
  const handleSeeked = () => {
    if (videoRef.current) {
      endSegment(videoRef.current.currentTime);
      if (!videoRef.current.paused && !focusLostRef.current) startSegment(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    if (!course || isYouTube(course.media)) return;
    const interval = setInterval(() => saveSegments(), 10000);
    return () => clearInterval(interval);
  }, [course, saveSegments, isYouTube]);

  // Focus/blur
  useEffect(() => {
    const onBlur = () => { focusLostRef.current = true; if (videoRef.current) endSegment(videoRef.current.currentTime); logActivity("blur", { progress }); };
    const onFocus = () => { focusLostRef.current = false; if (videoRef.current && !videoRef.current.paused) startSegment(videoRef.current.currentTime); };
    window.addEventListener("blur", onBlur); window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); };
  }, [progress, logActivity]);

  // Abandon
  useEffect(() => {
    const handleBeforeUnload = () => {
      let allSegments = [...segmentsRef.current];
      if (currentSegmentStart.current !== null) {
        const currentTime = getCurrentTime();
        if (currentTime !== null && currentTime - currentSegmentStart.current > 1) {
          allSegments.push([currentSegmentStart.current, currentTime]);
        }
      }
      navigator.sendBeacon("http://localhost:5000/api/activity", JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        event_type: "abandoned",
        event_data: { progress, watched_segments: allSegments },
        ab_group: userData?.ab_group,
      }));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (progress < 100) logActivity("abandoned", { progress });
    };
  }, [progress, currentUser, id, userData?.ab_group, logActivity, getCurrentTime]);

  // Completion
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) { completedRef.current = true; logActivity("completed", { progress: 100 }); }
  }, [progress, logActivity]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>;
  if (error || !course) return <div className="min-h-screen flex flex-col items-center justify-center"><p className="text-red-600">{error || "Cours non disponible"}</p><button onClick={() => navigate("/courses")} className="mt-4 px-4 py-2 bg-gray-200 rounded-xl">Retour aux cours</button></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="w-full">
        {/* Barre de navigation */}
        <div className="w-full bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <FaArrowLeft /> <span className="text-sm font-medium">Retour</span>
          </button>
          {course.category_name && (
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
              {course.category_name}
            </span>
          )}
        </div>

        {/* Vidéo – largeur contrôlée */}
        <div className="max-w-5xl mx-auto mt-4 mb-6 px-4 sm:px-6 lg:px-0">
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            {isYouTube(course.media) ? (
              <div className="aspect-video">
                <div id="youtube-player" className="w-full h-full" />
              </div>
            ) : course.media ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-auto"
                onPlay={handlePlay}
                onPause={handlePause}
                onSeeked={handleSeeked}
                onError={() => setError("Impossible de charger la vidéo.")}
              >
                <source src={course.media} />
                Votre navigateur ne supporte pas la vidéo.
              </video>
            ) : (
              <div className="aspect-video flex items-center justify-center text-white text-lg">
                Aucun contenu média
              </div>
            )}
          </div>
        </div>

        {/* Détails du cours */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 pb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">{course.title}</h1>
          <p className="mt-2 text-gray-600 leading-relaxed max-w-3xl">{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FaBrain className="text-purple-500" /> {course.level || "N/A"}</span>
            <span className="flex items-center gap-1"><FaClock className="text-purple-500" /> {course.duration || "N/A"}</span>
          </div>

          {/* Progression */}
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
            onClick={() => { if (progress < 100) { setProgress(100); segmentsRef.current = [[0, getCurrentTime()]]; saveSegments(); } }}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <FaCheck /> Marquer comme terminé
          </button>
        </div>

        {/* Cours similaires */}
        {relatedCourses.length > 0 && (
          <div className="w-full bg-white border-t border-gray-200 py-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cours similaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedCourses.map(c => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/course/${c.id}`)}
                    className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition border border-gray-100"
                  >
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
    </div>
  );
}