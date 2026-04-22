import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const NAV = [
  { to: '/',       icon: '🏠', label: 'Dashboard' },
  { to: '/orders', icon: '📋', label: 'Orders'    },
  { to: '/menu',   icon: '🍽️', label: 'Menu'      },
];

export default function Layout({ children }) {
  const { user, vendor, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={s.shell}>
      <div style={s.sidebar}>
        <div style={s.logo}>CampusCart</div>
        <div style={s.shopName}>{vendor?.shop_name || user?.name}</div>
        <div style={{ ...s.pill, background: vendor?.is_open ? '#E8F5E9' : '#FFF0F0', color: vendor?.is_open ? '#4CAF50' : '#F44336' }}>
          {vendor?.is_open ? '🟢 Open' : '🔴 Closed'}
        </div>
        <nav style={s.nav}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              style={({ isActive }) => ({
                ...s.link,
                background: isActive ? '#F0EEFF' : 'transparent',
                color: isActive ? '#6C63FF' : '#555',
                fontWeight: isActive ? 700 : 500,
              })}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
      <div style={s.main}>{children}</div>
    </div>
  );
}

const s = {
  shell:     { display:'flex', minHeight:'100vh' },
  sidebar:   { width:220, background:'#fff', borderRight:'1px solid #F0F0F0', display:'flex', flexDirection:'column', padding:'24px 16px', position:'fixed', top:0, left:0, bottom:0 },
  logo:      { fontSize:20, fontWeight:900, color:'#6C63FF', marginBottom:4 },
  shopName:  { fontSize:13, color:'#888', marginBottom:10 },
  pill:      { fontSize:12, fontWeight:600, borderRadius:20, padding:'4px 12px', alignSelf:'flex-start', marginBottom:24 },
  nav:       { flex:1, display:'flex', flexDirection:'column', gap:4 },
  link:      { display:'block', padding:'10px 14px', borderRadius:10, textDecoration:'none', fontSize:14, transition:'all 0.15s' },
  logoutBtn: { background:'none', border:'1.5px solid #ddd', borderRadius:8, padding:9, cursor:'pointer', color:'#888', fontWeight:600, fontSize:13 },
  main:      { marginLeft:220, flex:1, minHeight:'100vh', background:'#F8F8FF' },
};
