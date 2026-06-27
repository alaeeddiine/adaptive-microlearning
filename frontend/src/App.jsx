import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Questionnaire from "./pages/Questionnaire";
import Courses from "./pages/courses/Courses";
import CoursePlayer from "./pages/courses/CoursePlayer";
import Recommendations from "./pages/recommendations/Recommendations";
import Quiz from "./pages/quiz/Quiz";
import Progress from "./pages/progress/Progress";
import Settings from "./pages/settings/Settings";
import History from "./pages/history/History";
import SessionContext from "./pages/SessionContext";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminUserProgress from "./pages/admin/AdminUserProgress";
import ProgressManager from "./pages/admin/ProgressManager";

import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Layout from "./components/Layout";
import useAuth from "./hooks/useAuth";

export default function App() {
  const { currentUser, userData } = useAuth();
  const isAdmin = userData?.role === "admin";
  const needsQuestionnaire =
    currentUser && userData && !userData.questionnaireComplete;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Questionnaire protégé mais sans la sidebar (donc pas de Layout) */}
      <Route
        path="/questionnaire"
        element={
          <ProtectedRoute>
            <Questionnaire />
          </ProtectedRoute>
        }
      />

      {/* Routes protégées avec la sidebar (Layout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Tableau de bord normal (non admin) */}
          <Route
            path="/dashboard"
            element={
              needsQuestionnaire ? (
                <Navigate to="/questionnaire" />
              ) : isAdmin ? (
                <Navigate to="/admin" />
              ) : (
                <Dashboard />
              )
            }
          />
          <Route path="/session" element={<SessionContext />} />

          <Route
            path="/courses"
            element={
              needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Courses />
            }
          />
          <Route path="/course/:id" element={<CoursePlayer />} />
          <Route
            path="/recommendations"
            element={
              needsQuestionnaire ? (
                <Navigate to="/questionnaire" />
              ) : (
                <Recommendations />
              )
            }
          />
          <Route
            path="/quiz"
            element={
              needsQuestionnaire ? <Navigate to="/questionnaire" /> : <Quiz />
            }
          />
          <Route
            path="/progress"
            element={
              needsQuestionnaire ? (
                <Navigate to="/questionnaire" />
              ) : (
                <Progress />
              )
            }
          />
          <Route
            path="/history"
            element={
              needsQuestionnaire ? (
                <Navigate to="/questionnaire" />
              ) : (
                <History />
              )
            }
          />
          <Route
            path="/settings"
            element={
              needsQuestionnaire ? (
                <Navigate to="/questionnaire" />
              ) : (
                <Settings />
              )
            }
          />

          {/* Admin routes – protégées par le rôle admin */}
          <Route element={<ProtectedAdminRoute />}>
            <Route
              path="/admin"
              element={
                needsQuestionnaire ? (
                  <Navigate to="/questionnaire" />
                ) : (
                  <AdminDashboard />
                )
              }
            />
            <Route
              path="/admin/users"
              element={
                needsQuestionnaire ? (
                  <Navigate to="/questionnaire" />
                ) : (
                  <AdminUsers />
                )
              }
            />
            <Route
              path="/admin/users/:uid/progress"
              element={
                needsQuestionnaire ? (
                  <Navigate to="/questionnaire" />
                ) : (
                  <AdminUserProgress />
                )
              }
            />
            <Route
              path="/admin/courses"
              element={
                needsQuestionnaire ? (
                  <Navigate to="/questionnaire" />
                ) : (
                  <AdminCourses />
                )
              }
            />
            <Route path="/admin/progress" element={<ProgressManager />} />
          </Route>
        </Route>
      </Route>

      {/* Root – redirection intelligente */}
      <Route
        path="/"
        element={
          currentUser ? (
            needsQuestionnaire ? (
              <Navigate to="/questionnaire" />
            ) : isAdmin ? (
              <Navigate to="/admin" />
            ) : (
              <Navigate to="/dashboard" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}