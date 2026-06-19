import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Questionnaire from "./pages/Questionnaire";
import Courses from "./pages/courses/Courses";
import Recommendations from "./pages/recommendations/Recommendations";
import Quiz from "./pages/quiz/Quiz";
import Progress from "./pages/progress/Progress";
import Settings from "./pages/settings/Settings";
import History from "./pages/history/History";

import ProtectedRoute from "./components/ProtectedRoute";
import useAuth from "./hooks/useAuth";

export default function App() {
  const { currentUser, userData } = useAuth();

  const needsQuestionnaire =
    currentUser && userData && !userData.questionnaireComplete;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected with questionnaire check */}
      <Route
        path="/questionnaire"
        element={
          <ProtectedRoute>
            <Questionnaire />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Dashboard />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Courses />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Recommendations />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Quiz />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Progress />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <History />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            {needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Settings />}
          </ProtectedRoute>
        }
      />

      {/* Root : redirect to dashboard or login */}
      <Route
        path="/"
        element={
          currentUser ? (
            needsQuestionnaire ? (
              <Navigate to="/questionnaire" />
            ) : (
              <Navigate to="/dashboard" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}