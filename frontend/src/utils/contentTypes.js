import {
  FaBookOpen,
  FaFileAlt,
  FaImage,
  FaPlay,
  FaQuestionCircle,
} from "react-icons/fa";

export function normalizeContentType(item) {
  if (item?.type === "quiz") return "quiz";

  const value = String(item?.course_type || item?.type || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (value === "texte" || value === "pdf") return "text";
  if (value === "video" || value === "text" || value === "infographie" || value === "quiz") {
    return value;
  }

  return "course";
}

export function getContentTypeMeta(item) {
  const type = normalizeContentType(item);

  const meta = {
    video: {
      label: "Vidéo",
      Icon: FaPlay,
      badge: "bg-blue-50 text-blue-700",
      iconBox: "bg-blue-100 text-blue-600",
    },
    text: {
      label: "Texte",
      Icon: FaFileAlt,
      badge: "bg-emerald-50 text-emerald-700",
      iconBox: "bg-emerald-100 text-emerald-600",
    },
    infographie: {
      label: "Infographie",
      Icon: FaImage,
      badge: "bg-orange-50 text-orange-700",
      iconBox: "bg-orange-100 text-orange-600",
    },
    quiz: {
      label: "Quiz",
      Icon: FaQuestionCircle,
      badge: "bg-purple-50 text-purple-700",
      iconBox: "bg-purple-100 text-purple-600",
    },
    course: {
      label: "Cours",
      Icon: FaBookOpen,
      badge: "bg-gray-50 text-gray-700",
      iconBox: "bg-gray-100 text-gray-600",
    },
  };

  return { type, ...meta[type] };
}
