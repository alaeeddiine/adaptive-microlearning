import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const realDuration = useRef(0);      // durée réelle en secondes
  const lastSavedPercent = useRef(-1); // pour éviter sauvegardes inutiles
  const saveIntervalRef = useRef(null);
  const startedRef = useRef(false);

  // Calculer et sauvegarder la progression
  const saveProgress = useCallback((currentTime) => {
    if (!currentUser || !id) return;
    const duration = realDuration.current;
    if (duration <= 0) return;

    const newPercent = Math.min(100, Math.round((currentTime / duration) * 100));
    if (newPercent === lastSavedPercent.current) return;
    lastSavedPercent.current = newPercent;
    setProgress(newPercent);

    fetch("http://localhost:5000/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        watched_segments: [[0, currentTime]],
        total_duration: duration,   // durée réelle en secondes
        progress: newPercent,
      }),
    }).catch(console.error);
  }, [currentUser, id]);

  const logActivity = useCallback((eventType, data = {}) => {
    if (!currentUser) return;
    fetch("http://localhost:5000/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        course_id: id,
        event_type: eventType,
        event_data: data,
        ab_group: userData?.ab_group || null,
      }),
    }).catch(console.error);
  }, [currentUser, id, userData?.ab_group]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/courses/${id}`)
      .then(res => res.json())
      .then(data => { setCourse(data); setLoading(false); })
      .catch(err => { setError("Cours introuvable."); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!currentUser || !id) return;
    fetch(`http://localhost:5000/api/progress/${currentUser.uid}/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.progress !== undefined) {
          setProgress(data.progress);
          lastSavedPercent.current = data.progress;
        }
      })
      .catch(console.error);
  }, [currentUser, id]);

  useEffect(() => {
    if (!currentUser || !id) return;
    fetch(`http://localhost:5000/api/progress/${currentUser.uid}/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.progress === undefined) {
          fetch("http://localhost:5000/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firebase_uid: currentUser.uid,
              course_id: id,
              progress: 0,
              watched_segments: [],
            }),
          });
        }
      });
    fetch("http://localhost:5000/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: currentUser.uid,
        message: `📚 Vous avez commencé le cours "${course?.title || "inconnu"}". Bon apprentissage !`,
        type: "course_start",
      }),
    }).catch(console.error);
  }, [currentUser, id, course?.title]);

  const isYouTube = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be"));
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  useEffect(() => {
    if (!course || !isYouTube(course.media)) return;
    if (window.YT && window.YT.Player) {
      createYouTubePlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.getElementsByTagName("script")[0].parentNode.insertBefore(tag, document.getElementsByTagName("script")[0]);
      }
      window.onYouTubeIframeAPIReady = () => createYouTubePlayer();
    }
    return () => {
      if (playerRef.current) playerRef.current.destroy();
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [course]);

  const createYouTubePlayer = () => {
    if (!course) return;
    const videoId = getYouTubeVideoId(course.media);
    if (!videoId) { setError("ID vidéo YouTube introuvable."); return; }
    if (playerRef.current) playerRef.current.destroy();
    playerRef.current = new window.YT.Player("youtube-player", {
      videoId,
      events: {
        onReady: (event) => {
          realDuration.current = event.target.getDuration(); // durée réelle YouTube
          if (!startedRef.current) {
            startedRef.current = true;
            logActivity("started", { progress: 0 });
          }
          saveIntervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
              saveProgress(playerRef.current.getCurrentTime());
            }
          }, 5000);
        },
        onError: () => setError("Erreur de lecture YouTube."),
      },
    });
  };

  // HTML5 video : obtenir la durée réelle et sauvegarde périodique
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      realDuration.current = videoRef.current.duration;
      lastSavedPercent.current = -1;
    }
  };

  const startPeriodicSave = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      logActivity("started", { progress: 0 });
    }
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    saveIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(videoRef.current.currentTime);
      }
    }, 5000);
  };

  const stopPeriodicSave = () => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    if (videoRef.current) saveProgress(videoRef.current.currentTime);
  };

  useEffect(() => {
    return () => {
      stopPeriodicSave();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-red-600">{error || "Cours non disponible"}</p>
      <button onClick={() => navigate("/courses")} className="mt-4 px-4 py-2 bg-gray-200 rounded-xl">Retour aux cours</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate("/courses")} className="text-purple-600 font-semibold hover:underline mb-4 block">
          ← Retour aux cours
        </button>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{course.title}</h2>
        <p className="text-sm text-gray-500 mb-6">{course.description}</p>

        <div className="bg-black rounded-2xl overflow-hidden shadow-lg mb-6">
          {isYouTube(course.media) ? (
            <div className="aspect-video">
              <div id="youtube-player" className="w-full h-full" />
            </div>
          ) : course.media ? (
            <video
              ref={videoRef}
              controls
              className="w-full h-auto max-h-[70vh]"
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={startPeriodicSave}
              onPause={stopPeriodicSave}
              onSeeked={() => { if (videoRef.current) saveProgress(videoRef.current.currentTime); }}
              onError={() => setError("Impossible de charger la vidéo.")}
            >
              <source src={course.media} />
              Votre navigateur ne supporte pas la vidéo.
            </video>
          ) : (
            <p className="text-white text-center py-12">Aucun contenu média disponible.</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}