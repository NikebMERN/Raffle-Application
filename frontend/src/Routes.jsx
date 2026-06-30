import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Raffles from './pages/Raffles';
import RaffleDetail from './pages/RaffleDetail';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Admin from './pages/Admin';
import Spinner from './components/common/Spinner';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/raffles" element={<Raffles />} />
        <Route path="/raffles/:id" element={<RaffleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><div className="p-8">User Dashboard</div></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><div className="p-8">My Tickets</div></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><div className="p-8">Wallet</div></ProtectedRoute>} />
        <Route path="*" element={<div className="p-8 text-center">404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
}
