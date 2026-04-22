import React, { useEffect, useState } from 'react';
import client from '../api/client';

const CATS  = ['food','drinks','snacks','desserts','other'];
const EMPTY = { name:'', description:'', price:'', category:'food', image_url:'' };

export default function Menu() {
  const [menu, setMenu]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    try { const r = await client.get('/vendors/my/menu'); setMenu(r.data.menu); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return alert('Name and price required');
    setSaving(true);
    try {
      if (editing) await client.patch(`/vendors/my/menu/${editing}`, form);
      else         await client.post('/vendors/my/menu', form);
      setForm(EMPTY); setEditing(null); setOpen(false);
      await fetchMenu();
    } catch (err) { alert(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setForm({ name:item.name, description:item.description||'', price:item.price, category:item.category, image_url:item.image_url||'' });
    setEditing(item.id); setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await client.delete(`/vendors/my/menu/${id}`);
    setMenu((p) => p.filter((i) => i.id !== id));
  };

  const toggleAvail = async (item) => {
    await client.patch(`/vendors/my/menu/${item.id}`, { is_available: !item.is_available });
    setMenu((p) => p.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#888' }}>Loading...</div>;

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:800 }}>Menu</h2>
        <button style={s.addBtn} onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }}>+ Add Item</button>
      </div>

      {open && (
        <div style={s.formCard}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>{editing ? 'Edit Item' : 'New Item'}</h3>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={s.label}>Name *</label><input style={s.inp} value={form.name} onChange={upd('name')} placeholder="e.g. Masala Dosa" required /></div>
              <div><label style={s.label}>Price (₹) *</label><input style={s.inp} type="number" value={form.price} onChange={upd('price')} placeholder="60" required min="0" /></div>
              <div><label style={s.label}>Category</label>
                <select style={s.inp} value={form.category} onChange={upd('category')}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Image URL (optional)</label><input style={s.inp} value={form.image_url} onChange={upd('image_url')} placeholder="https://..." /></div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={s.label}>Description (optional)</label>
              <textarea style={{ ...s.inp, height:70, resize:'vertical' }} value={form.description} onChange={upd('description')} placeholder="Brief description..." />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button type="button" style={s.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Item'}</button>
            </div>
          </form>
        </div>
      )}

      {menu.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#888' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🍽️</div><p>No items yet. Add your first one!</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', padding:'10px 20px', background:'#F8F8FF', fontSize:12, fontWeight:700, color:'#888', borderBottom:'1px solid #F0F0F0' }}>
            <span style={{ flex:2 }}>Item</span><span style={{ flex:1 }}>Category</span>
            <span style={{ flex:1 }}>Price</span><span style={{ flex:1 }}>Status</span><span style={{ flex:1 }}>Actions</span>
          </div>
          {menu.map((item) => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #F5F5F5' }}>
              <div style={{ flex:2 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{item.name}</div>
                {item.description && <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{item.description}</div>}
              </div>
              <span style={{ flex:1, color:'#888', fontSize:13 }}>{item.category}</span>
              <span style={{ flex:1, fontWeight:700, color:'#6C63FF' }}>₹{parseFloat(item.price).toFixed(0)}</span>
              <span style={{ flex:1 }}>
                <button onClick={() => toggleAvail(item)}
                  style={{ fontSize:12, fontWeight:700, border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer',
                    background: item.is_available ? '#E8F5E9' : '#FFF0F0', color: item.is_available ? '#4CAF50' : '#F44336' }}>
                  {item.is_available ? '✓ Available' : '✗ Hidden'}
                </button>
              </span>
              <div style={{ flex:1, display:'flex', gap:6 }}>
                <button onClick={() => handleEdit(item)} style={s.editBtn}>Edit</button>
                <button onClick={() => handleDelete(item.id)} style={s.delBtn}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  addBtn:    { background:'#6C63FF', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, cursor:'pointer', fontSize:14 },
  formCard:  { background:'#fff', borderRadius:16, padding:24, marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  label:     { display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:5 },
  inp:       { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #E0E0E0', fontSize:14, outline:'none', fontFamily:'inherit' },
  cancelBtn: { padding:'10px 20px', borderRadius:8, border:'1.5px solid #ddd', background:'#fff', cursor:'pointer', fontWeight:600 },
  saveBtn:   { padding:'10px 24px', borderRadius:8, background:'#6C63FF', color:'#fff', border:'none', cursor:'pointer', fontWeight:700 },
  editBtn:   { padding:'6px 12px', background:'#F0EEFF', color:'#6C63FF', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12 },
  delBtn:    { padding:'6px 10px', background:'#FFF0F0', color:'#F44336', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12 },
};
