import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Layouts
import MainLayout from '../layouts/MainLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';

// Pages
import Home from '../pages/Home/Home.jsx';
import Login from '../pages/Auth/Login.jsx';
import Register from '../pages/Auth/Register.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import SecuritySettings from '../pages/Profile/SecuritySettings.jsx';
import DashboardHome from '../pages/Dashboard/DashboardHome.jsx';
import VerifyEmailPage from '../pages/Auth/VerifyEmailPage.jsx';
import VerifyOTP from '../pages/Auth/VerifyOTP.jsx';
import ForgotPassword from '../pages/Auth/ForgotPassword.jsx';
import ResetPassword from '../pages/Auth/ResetPassword.jsx';
import NotFound from '../pages/NotFound/NotFound.jsx';
import ProfilePage from "../pages/Profile/Profilepages.jsx";

// Publications Pages
import PublicationsDashboard from '../pages/Publications/Dashboard.jsx';
import UploadPublication from '../pages/Publications/Upload.jsx';
import PublicationDetails from '../pages/Publications/Detail.jsx';
import GlobalSearch from '../pages/Search/GlobalSearch.jsx';
import RecommendationDashboard from '../pages/Dashboard/RecommendationDashboard.jsx';
import CollaborationDashboard from '../pages/Dashboard/CollaborationDashboard.jsx';
import ConnectionsDashboard from '../pages/Dashboard/ConnectionsDashboard.jsx';
import FollowersPage from '../pages/Dashboard/FollowersPage.jsx';
import FollowingPage from '../pages/Dashboard/FollowingPage.jsx';

// Projects Pages
import ProjectsDashboard from '../pages/Projects/ProjectsDashboard.jsx';
import CreateProject from '../pages/Projects/CreateProject.jsx';
import ProjectDetails from '../pages/Projects/ProjectDetails.jsx';

// Gate
import ProtectedRoute from './ProtectedRoute.jsx';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>

      {/* General Site Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route 
          path="profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="profile/security" 
          element={
            <ProtectedRoute>
              <SecuritySettings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="publications" 
          element={
            <ProtectedRoute>
              <PublicationsDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="publications/upload" 
          element={
            <ProtectedRoute>
              <UploadPublication />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="publications/:id" 
          element={
            <ProtectedRoute>
              <PublicationDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="search" 
          element={
            <ProtectedRoute>
              <GlobalSearch />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="projects" 
          element={
            <ProtectedRoute>
              <ProjectsDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="projects/new" 
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="projects/:id" 
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="recommendations" 
          element={
            <ProtectedRoute>
              <RecommendationDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="collaboration" 
          element={
            <ProtectedRoute>
              <CollaborationDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="collaborations" 
          element={
            <ProtectedRoute>
              <CollaborationDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="connections" 
          element={
            <ProtectedRoute>
              <ConnectionsDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="followers" 
          element={
            <ProtectedRoute>
              <FollowersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="following" 
          element={
            <ProtectedRoute>
              <FollowingPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Authentication Gateway Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Profile Route */}
      <Route path="/profile" element={<ProfilePage />} />
      {/* Verification Route */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
};

export default AppRoutes;