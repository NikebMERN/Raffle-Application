import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import RafflesAdmin from './pages/admin/RafflesAdmin';
import DrawsAdmin from './pages/admin/DrawsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import RewardsAdmin from './pages/admin/RewardsAdmin';
import ReportsAdmin from './pages/admin/ReportsAdmin';
import AuditLogsAdmin from './pages/admin/AuditLogsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import AccountAdmin from './pages/admin/AccountAdmin';
import Spinner from './components/common/Spinner';

function ProtectedAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedAdmin><Layout /></ProtectedAdmin>}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="raffles" element={<RafflesAdmin />} />
          <Route path="draws" element={<DrawsAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="rewards" element={<RewardsAdmin />} />
          <Route path="reports" element={<ReportsAdmin />} />
          <Route path="audit-logs" element={<AuditLogsAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="account" element={<AccountAdmin />} />
        </Route>
        <Route index element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
