import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import useAuthStore from '../../store/authStore';

const ROLES = [
  { label: 'Student (Order food)', value: 'student' },
  { label: 'Delivery Partner (Earn money)', value: 'delivery_partner' },
];

const HOSTELS = ['Boys Hostel A', 'Boys Hostel B', 'Girls Hostel A', 'Girls Hostel B', 'Day Scholar'];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    student_id: '', role: 'student', hostel: '', room_number: '',
  });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? errors[0].msg : (err.response?.data?.error || 'Registration failed');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.sub}>Join CampusCart</Text>

      {/* Role selector */}
      <Text style={styles.label}>I want to</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleBtn, form.role === r.value && styles.roleBtnActive]}
            onPress={() => set('role', r.value)}
          >
            <Text style={[styles.roleTxt, form.role === r.value && styles.roleTxtActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999"
        value={form.name} onChangeText={(v) => set('name', v)} />
      <TextInput style={styles.input} placeholder="College Email" placeholderTextColor="#999"
        value={form.email} onChangeText={(v) => set('email', v)}
        keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Student ID (optional)" placeholderTextColor="#999"
        value={form.student_id} onChangeText={(v) => set('student_id', v)} />
      <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#999"
        value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor="#999"
        value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />

      {/* Hostel picker (simple text for MVP) */}
      <Text style={styles.label}>Hostel / Block</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hostelScroll}>
        {HOSTELS.map((h) => (
          <TouchableOpacity
            key={h}
            style={[styles.hostelChip, form.hostel === h && styles.hostelChipActive]}
            onPress={() => set('hostel', h)}
          >
            <Text style={[styles.hostelTxt, form.hostel === h && styles.hostelTxtActive]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput style={styles.input} placeholder="Room Number (optional)" placeholderTextColor="#999"
        value={form.room_number} onChangeText={(v) => set('room_number', v)} />

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 24, paddingBottom: 50 },
  title: { fontSize: 28, fontWeight: '800', color: '#6C63FF', marginTop: 40, marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15,
    color: '#222', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  roleBtnActive: { borderColor: '#6C63FF', backgroundColor: '#F0EEFF' },
  roleTxt: { fontSize: 13, color: '#666', fontWeight: '600', textAlign: 'center' },
  roleTxtActive: { color: '#6C63FF' },
  hostelScroll: { marginBottom: 16 },
  hostelChip: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
  },
  hostelChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  hostelTxt: { fontSize: 13, color: '#666' },
  hostelTxtActive: { color: '#fff' },
  btn: {
    backgroundColor: '#6C63FF', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 10, marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#6C63FF', fontSize: 14 },
});
