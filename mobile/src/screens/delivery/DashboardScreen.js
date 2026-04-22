import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Switch, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { getAvailableOrders, acceptOrder } from '../../api/delivery';
import { SOCKET_URL } from '../../api/client';
import useAuthStore from '../../store/authStore';

export default function DashboardScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  const fetchOrders = useCallback(async () => {
    if (!isOnline) return;
    try {
      const res = await getAvailableOrders();
      setOrders(res.data.orders);
    } finally {
      setRefreshing(false);
    }
  }, [isOnline]);

  // Setup socket
  useEffect(() => {
    const connect = async () => {
      const token = await AsyncStorage.getItem('token');
      const socket = io(SOCKET_URL, { auth: { token } });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (isOnline) socket.emit('delivery:online');
      });

      // New order available
      socket.on('order:available', (order) => {
        setOrders((prev) => [order, ...prev]);
      });

      // Order taken by someone else
      socket.on('order:taken', ({ order_id }) => {
        setOrders((prev) => prev.filter((o) => o.order_id !== order_id && o.id !== order_id));
      });
    };
    connect();
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // Toggle online/offline
  const handleToggle = async (val) => {
    setIsOnline(val);
    if (val) {
      socketRef.current?.emit('delivery:online');
      setLoading(true);
      try {
        const res = await getAvailableOrders();
        setOrders(res.data.orders);
      } finally {
        setLoading(false);
      }
    } else {
      socketRef.current?.emit('delivery:offline');
      setOrders([]);
    }
  };

  const handleAccept = async (orderId) => {
    setAccepting(orderId);
    try {
      const res = await acceptOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      navigation.navigate('ActiveDelivery', {
        order: res.data.order,
        pickup: res.data.pickup,
        dropoff: res.data.dropoff,
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not accept order');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.sub}>Delivery Partner</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
          <Text style={styles.earningsLink}>Earnings →</Text>
        </TouchableOpacity>
      </View>

      {/* Online toggle */}
      <View style={styles.toggleCard}>
        <View>
          <Text style={styles.toggleTitle}>{isOnline ? '🟢 You are Online' : '🔴 You are Offline'}</Text>
          <Text style={styles.toggleSub}>
            {isOnline ? 'Receiving delivery requests' : 'Toggle to start receiving orders'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggle}
          trackColor={{ false: '#ddd', true: '#A5A0FF' }}
          thumbColor={isOnline ? '#6C63FF' : '#aaa'}
        />
      </View>

      {/* Orders list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id || item.order_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor="#6C63FF"
            />
          }
          ListHeaderComponent={
            isOnline ? (
              <Text style={styles.sectionTitle}>
                {orders.length} order{orders.length !== 1 ? 's' : ''} available
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderShop}>{item.shop_name}</Text>
                <Text style={styles.orderEarnings}>₹{parseFloat(item.delivery_fee).toFixed(0)}</Text>
              </View>
              <Text style={styles.orderPickup}>📍 Pickup: {item.pickup_location}</Text>
              <Text style={styles.orderDrop}>🏠 Drop: {item.delivery_address}</Text>
              {item.special_note ? (
                <Text style={styles.orderNote}>📝 {item.special_note}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.acceptBtn, accepting === item.id && styles.acceptBtnDisabled]}
                onPress={() => handleAccept(item.id || item.order_id)}
                disabled={accepting !== null}
              >
                {accepting === item.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.acceptBtnTxt}>Accept Delivery</Text>
                }
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            isOnline ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🚴</Text>
                <Text style={styles.emptyText}>No orders right now</Text>
                <Text style={styles.emptySub}>New orders will appear here automatically</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💤</Text>
                <Text style={styles.emptyText}>You're offline</Text>
                <Text style={styles.emptySub}>Toggle online to start earning</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#6C63FF',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  earningsLink: { color: '#fff', fontSize: 14, fontWeight: '600' },
  toggleCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 18,
    elevation: 3, shadowOpacity: 0.08, shadowRadius: 6,
  },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  toggleSub: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8, paddingHorizontal: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 2, shadowOpacity: 0.06, shadowRadius: 4,
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderShop: { fontSize: 16, fontWeight: '700', color: '#222' },
  orderEarnings: { fontSize: 18, fontWeight: '800', color: '#4CAF50' },
  orderPickup: { fontSize: 13, color: '#666', marginBottom: 4 },
  orderDrop: { fontSize: 13, color: '#666', marginBottom: 8 },
  orderNote: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 8 },
  acceptBtn: {
    backgroundColor: '#6C63FF', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  acceptBtnDisabled: { opacity: 0.5 },
  acceptBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySub: { fontSize: 14, color: '#888', marginTop: 6, textAlign: 'center' },
});
