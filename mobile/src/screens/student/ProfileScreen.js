import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import useAuthStore from '../../store/authStore';

export default function ProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Avatar + name */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.hostel && <Text style={styles.hostel}>{user.hostel} · Room {user.room_number || '–'}</Text>}
      </View>

      {/* Reward points */}
      <View style={styles.rewardCard}>
        <Text style={styles.rewardIcon}>⭐</Text>
        <View>
          <Text style={styles.rewardPoints}>{user?.reward_points || 0} Points</Text>
          <Text style={styles.rewardSub}>100 pts = ₹10 off your next order</Text>
        </View>
      </View>

      {/* Info rows */}
      <View style={styles.section}>
        <InfoRow icon="📱" label="Phone" value={user?.phone || 'Not set'} />
        <InfoRow icon="🎓" label="Student ID" value={user?.student_id || 'Not set'} />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuLabel}>My Orders</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  hero: {
    backgroundColor: '#6C63FF', paddingTop: 60, paddingBottom: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarTxt: { fontSize: 30, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  hostel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  rewardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', margin: 16, borderRadius: 16,
    padding: 16, borderLeftWidth: 4, borderLeftColor: '#FFD700',
    elevation: 2, shadowOpacity: 0.06, shadowRadius: 4,
  },
  rewardIcon: { fontSize: 32 },
  rewardPoints: { fontSize: 20, fontWeight: '800', color: '#222' },
  rewardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: '#aaa' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#222', marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
  },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#222', fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#ccc' },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 40,
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FF5252',
  },
  logoutTxt: { color: '#FF5252', fontSize: 15, fontWeight: '700' },
});
