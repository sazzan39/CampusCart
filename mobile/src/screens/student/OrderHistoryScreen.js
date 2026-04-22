import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getMyOrders } from '../../api/orders';

const STATUS_COLOR = {
  pending: '#FF9800', accepted: '#2196F3', preparing: '#9C27B0',
  ready: '#00BCD4', picked_up: '#3F51B5', delivered: '#4CAF50', cancelled: '#F44336',
};

const STATUS_ICON = {
  pending: '📋', accepted: '✅', preparing: '👨‍🍳',
  ready: '🎁', picked_up: '🚴', delivered: '🎉', cancelled: '❌',
};

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data.orders);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.shopName}>{item.shop_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                <Text style={[styles.statusTxt, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_ICON[item.status]} {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.address}>📍 {item.delivery_address}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.amount}>₹{parseFloat(item.total_amount).toFixed(0)}</Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            tintColor="#6C63FF"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySub}>Order from a vendor to get started</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#222' },
  list: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 2, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#222' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  address: { fontSize: 13, color: '#888', marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '700', color: '#6C63FF' },
  date: { fontSize: 12, color: '#aaa' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySub: { fontSize: 14, color: '#888', marginTop: 6 },
});
