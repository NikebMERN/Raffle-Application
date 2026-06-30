import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Raffles from './pages/Raffles';
import RaffleDetail from './pages/RaffleDetail';
import Login from './components/auth/Login';
import Spinner from './components/common/Spinner';
import Dashboard from './pages/Dashboard';
import MyTickets from './pages/MyTickets';
import Wallet from './pages/Wallet';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
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
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="*" element={<div className="p-8 text-center">404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
}
