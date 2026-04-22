import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity,
} from 'react-native';
import { getEarnings, getMyDeliveries } from '../../api/delivery';

export default function EarningsScreen({ navigation }) {
  const [earnings, setEarnings] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEarnings(), getMyDeliveries()])
      .then(([earnRes, delRes]) => {
        setEarnings(earnRes.data);
        setDeliveries(delRes.data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Today's summary */}
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>Today</Text>
        <Text style={styles.todayAmount}>₹{earnings?.today?.earnings?.toFixed(0) || 0}</Text>
        <Text style={styles.todaySub}>{earnings?.today?.deliveries || 0} deliveries</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{earnings?.all_time?.deliveries || 0}</Text>
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⭐ {earnings?.reward_points || 0}</Text>
          <Text style={styles.statLabel}>Reward Points</Text>
        </View>
      </View>

      {/* Recent deliveries */}
      <Text style={styles.sectionTitle}>Recent Deliveries</Text>
      {deliveries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No deliveries yet</Text>
        </View>
      ) : (
        deliveries.map((d) => (
          <View key={d.id} style={styles.deliveryRow}>
            <View>
              <Text style={styles.deliveryShop}>{d.shop_name}</Text>
              <Text style={styles.deliveryDate}>
                {new Date(d.updated_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={styles.deliveryFee}>+₹{parseFloat(d.delivery_fee).toFixed(0)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  back: { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: '#222' },
  todayCard: {
    backgroundColor: '#6C63FF', margin: 16, borderRadius: 20,
    padding: 28, alignItems: 'center',
  },
  todayLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  todayAmount: { fontSize: 48, fontWeight: '900', color: '#fff', marginTop: 4 },
  todaySub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center',
    elevation: 2, shadowOpacity: 0.06, shadowRadius: 4,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#222' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', paddingHorizontal: 20, marginBottom: 10 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: '#aaa' },
  deliveryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14,
  },
  deliveryShop: { fontSize: 14, fontWeight: '600', color: '#222' },
  deliveryDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  deliveryFee: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
});
