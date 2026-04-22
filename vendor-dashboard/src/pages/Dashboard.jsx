import React, { useState } from 'react';
import client from '../api/client';
import useAuthStore from '../store/authStore';

export default function Dashboard() {
  const { user, vendor, setVendor } = useAuthStore();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await client.patch('/vendors/my/toggle');
      setVendor({ is_open: res.data.vendor.is_open });
    } catch { alert('Failed to toggle shop'); }
    finally { setToggling(false); }
  };

  if (!vendor) return (
    <div style={s.page}>
      <div style={s.pending}>
        <div style={{ fontSize:52, marginBottom:16 }}>⏳</div>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Pending Approval</h2>
        <p style={{ color:'#888', lineHeight:1.6 }}>Your vendor account is awaiting admin approval.<br/>Contact the campus admin to get approved.</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <h2 style={s.title}>Dashboard</h2>

      <div style={s.statusCard}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{vendor.shop_name}</div>
          <div style={{ fontSize:13, color:'#888', marginBottom:8 }}>{vendor.location || 'Location not set'}</div>
          <div style={{ fontWeight:600, color: vendor.is_open ? '#4CAF50' : '#F44336' }}>
            {vendor.is_open ? '🟢 Shop is Open' : '🔴 Shop is Closed'}
          </div>
        </div>
        <button
          style={{ ...s.toggleBtn, background: vendor.is_open ? '#FFF0F0' : '#E8F5E9', color: vendor.is_open ? '#F44336' : '#4CAF50' }}
          onClick={handleToggle} disabled={toggling}>
          {toggling ? '...' : vendor.is_open ? 'Close Shop' : 'Open Shop'}
        </button>
      </div>

      <div style={s.statsRow}>
        {[
          { icon:'⭐', value: vendor.rating > 0 ? Number(vendor.rating).toFixed(1) : '–', label: `Rating (${vendor.total_ratings} reviews)` },
          { icon:'✅', value: vendor.is_approved ? 'Approved' : 'Pending', label:'Account Status', color: vendor.is_approved ? '#4CAF50' : '#FF9800' },
          { icon:'👤', value: user?.name, label:'Owner' },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}>
            <div style={{ fontSize:28, marginBottom:8 }}>{stat.icon}</div>
            <div style={{ fontSize:18, fontWeight:800, color: stat.color || '#222', marginBottom:4 }}>{stat.value}</div>
            <div style={{ fontSize:12, color:'#888' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={s.tip}>💡 Go to <strong>Orders</strong> tab to manage incoming orders in real-time. Use <strong>Menu</strong> to add or edit items.</div>
      {!vendor.is_approved && <div style={{ ...s.tip, borderLeftColor:'#FF9800', background:'#FFF8F0' }}>⚠️ Your shop is pending admin approval. Contact the campus admin.</div>}
    </div>
  );
}

const s = {
  page:       { padding:24 },
  pending:    { background:'#fff', borderRadius:20, padding:48, textAlign:'center', maxWidth:480, margin:'60px auto', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' },
  title:      { fontSize:22, fontWeight:800, color:'#222', marginBottom:20 },
  statusCard: { background:'#fff', borderRadius:16, padding:24, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  toggleBtn:  { padding:'12px 24px', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 },
  statsRow:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 },
  statCard:   { background:'#fff', borderRadius:16, padding:20, textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' },
  tip:        { background:'#FFF9E6', borderRadius:12, padding:16, fontSize:14, color:'#856404', marginBottom:12, borderLeft:'3px solid #FFD700' },
};
