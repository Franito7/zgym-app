import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth';

// Layouts
import { CoachLayout } from '../shared/components/CoachLayout';

// Coach Pages
import { CoachDashboardPage } from '../modules/dashboard/pages/CoachDashboardPage';
import { ClientsDirectoryPage } from '../modules/clients/pages/ClientsDirectoryPage';
import { PaymentsPage } from '../modules/payments/pages/PaymentsPage';
import { OnlinePage } from '../modules/online/pages/OnlinePage';
import { MorePage } from '../modules/more/pages/MorePage';

// Student Portal
import { StudentPortalPage } from '../modules/student-portal/pages/StudentPortalPage';

// Auth
import { LoginPage } from '../modules/auth/pages/LoginPage';

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400">Iniciando ZGym...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            user?.role === 'ALUMNO' ? <Navigate to="/app" replace /> : <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Portal del Alumno (Experiencia exclusiva Alumno) */}
      <Route
        path="/app/*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : user?.role === 'ALUMNO' ? (
            <StudentPortalPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Rutas de Gestión del Entrenador (Mobile-First) */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : user?.role === 'ALUMNO' ? (
            <Navigate to="/app" replace />
          ) : (
            <CoachLayout />
          )
        }
      >
        <Route index element={<CoachDashboardPage />} />
        <Route path="alumnos" element={<ClientsDirectoryPage />} />
        <Route path="clientes" element={<Navigate to="/alumnos" replace />} />
        <Route path="pagos" element={<PaymentsPage />} />
        <Route path="presencial" element={<Navigate to="/pagos" replace />} />
        <Route path="online" element={<OnlinePage />} />
        <Route path="mas" element={<MorePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
