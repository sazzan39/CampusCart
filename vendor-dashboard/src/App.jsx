import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout    from './components/Layout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders    from './pages/Orders';
import Menu      from './pages/Menu';

function Protected({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div style={{ textAlign:'center', padding:80, color:'#888', fontSize:18 }}>Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"        element={<Protected><Dashboard /></Protected>} />
      <Route path="/orders"  element={<Protected><Orders /></Protected>} />
      <Route path="/menu"    element={<Protected><Menu /></Protected>} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  );
}
