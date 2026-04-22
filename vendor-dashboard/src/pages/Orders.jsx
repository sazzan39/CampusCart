import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import client, { SOCKET_URL } from '../api/client';
import useAuthStore from '../store/authStore';

const STATUS_COLOR = { pending:'#FF9800', accepted:'#2196F3', preparing:'#9C27B0', ready:'#00BCD4', picked_up:'#3F51B5', delivered:'#4CAF50', cancelled:'#F44336' };

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);
  const socketRef = useRef(null);
  const vendor    = useAuthStore((s) => s.vendor);

  useEffect(() => {
    fetchOrders();
    const token  = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => { if (vendor?.id) socket.emit('join:vendor', vendor.id); });
    socket.on('order:new', (o) => {
      setOrders((prev) => [{ ...o, id: o.order_id, status:'pending' }, ...prev]);
    });
    socket.on('order:status_update', ({ order_id, status }) => {
      setOrders((prev) => prev
        .map((o) => o.id === order_id ? { ...o, status } : o)
        .filter((o) => !['delivered','cancelled'].includes(o.status))
      );
    });
    return () => socket.disconnect();
  }, [vendor?.id]);

  const fetchOrders = async () => {
    try {
      const res = await client.get('/orders/vendor/incoming');
      setOrders(res.data.orders);
    } finally { setLoading(false); }
  };

  const action = async (orderId, endpoint) => {
    setBusy(orderId);
    try {
      await client.patch(`/orders/${orderId}/${endpoint}`);
      await fetchOrders();
    } catch (err) { alert(err.response?.data?.error || 'Action failed'); }
    finally { setBusy(null); }
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#888' }}>Loading orders...</div>;

  return (
    <div style={{ padding:24 }}>
      <h2 style={{ fontSize:22, fontWeight:800, marginBottom:20 }}>Live Orders</h2>
      {orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#888' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
          <p style={{ fontSize:16 }}>No active orders — new ones appear instantly</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`3px solid ${STATUS_COLOR[order.status]||'#ddd'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontWeight:800, fontSize:14 }}>#{(order.id||'').slice(-6).toUpperCase()}</span>
                <span style={{ fontSize:11, fontWeight:700, borderRadius:12, padding:'3px 10px', background:(STATUS_COLOR[order.status]||'#ddd')+'22', color:STATUS_COLOR[order.status]||'#555', textTransform:'capitalize' }}>
                  {(order.status||'').replace('_',' ')}
                </span>
                <span style={{ fontSize:18, fontWeight:900, color:'#6C63FF' }}>₹{parseFloat(order.total_amount||0).toFixed(0)}</span>
              </div>
              <div style={{ fontSize:13, color:'#666', marginBottom:4 }}>👤 {order.student_name} {order.student_phone ? `· ${order.student_phone}` : ''}</div>
              <div style={{ fontSize:13, color:'#555', marginBottom:8 }}>📍 {order.delivery_address}</div>
              {order.special_note && <div style={{ fontSize:12, color:'#888', fontStyle:'italic', background:'#FFF9E6', borderRadius:6, padding:'6px 10px', marginBottom:10 }}>📝 {order.special_note}</div>}
              <div style={{ borderTop:'1px solid #F0F0F0', paddingTop:10, marginBottom:14 }}>
                {(order.items||[]).map((item, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#444', marginBottom:3 }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(parseFloat(item.unit_price||0) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {order.status === 'pending' && <>
                  <button style={{ flex:1, padding:10, background:'#4CAF50', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}
                    onClick={() => action(order.id,'accept')} disabled={busy===order.id}>✓ Accept</button>
                  <button style={{ flex:1, padding:10, background:'#fff', color:'#F44336', border:'1.5px solid #F44336', borderRadius:8, fontWeight:700, cursor:'pointer' }}
                    onClick={() => action(order.id,'reject')} disabled={busy===order.id}>✗ Reject</button>
                </>}
                {order.status === 'accepted' && (
                  <button style={{ flex:1, padding:10, background:'#6C63FF', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}
                    onClick={() => action(order.id,'preparing')} disabled={busy===order.id}>👨‍🍳 Start Preparing</button>
                )}
                {order.status === 'preparing' && (
                  <button style={{ flex:1, padding:10, background:'#00BCD4', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}
                    onClick={() => action(order.id,'ready')} disabled={busy===order.id}>🎁 Mark Ready</button>
                )}
                {order.status === 'ready' && (
                  <div style={{ flex:1, textAlign:'center', color:'#888', fontSize:13, padding:10 }}>Waiting for delivery partner...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
