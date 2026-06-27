import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';

// Pages
import Home from '../pages/Home/Home.jsx';
import Login from '../pages/Auth/Login.jsx';
import Register from '../pages/Auth/Register.jsx';
import NotFound from '../pages/NotFound/NotFound.jsx';
import ProfilePage from "../pages/Profile/Profilepages.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* General Site Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>

      {/* Authentication Gateway Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Profile Route */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;