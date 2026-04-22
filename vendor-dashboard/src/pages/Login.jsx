import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.message === 'Not a vendor account'
          ? 'This is not a vendor account'
          : (err.response?.data?.error || 'Login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>CampusCart</div>
        <div style={s.sub}>Vendor Dashboard</div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={s.input} type="email" placeholder="Vendor Email"
            value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <input style={s.input} type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={s.hint}>Don't have an account? Ask the campus admin to register you as a vendor.</p>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F8FF' },
  card:  { background:'#fff', borderRadius:20, padding:40, width:380, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  logo:  { fontSize:28, fontWeight:900, color:'#6C63FF', textAlign:'center', marginBottom:4 },
  sub:   { textAlign:'center', color:'#888', marginBottom:28, fontSize:14 },
  error: { background:'#FFF0F0', color:'#D32F2F', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:14 },
  input: { display:'block', width:'100%', padding:'13px 16px', marginBottom:14, borderRadius:10, border:'1.5px solid #E0E0E0', fontSize:15, outline:'none', fontFamily:'inherit' },
  btn:   { width:'100%', padding:14, background:'#6C63FF', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  hint:  { marginTop:20, fontSize:12, color:'#aaa', textAlign:'center', lineHeight:1.5 },
};
