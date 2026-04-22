import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { getOrder, cancelOrder } from '../../api/orders';
import { SOCKET_URL } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_INFO = {
  pending:    { label: 'Order Placed',       icon: '📋', desc: 'Waiting for vendor to accept' },
  accepted:   { label: 'Accepted',           icon: '✅', desc: 'Vendor accepted your order' },
  preparing:  { label: 'Preparing',          icon: '👨‍🍳', desc: 'Your food is being prepared' },
  ready:      { label: 'Ready for Pickup',   icon: '🎁', desc: 'A delivery partner is on the way' },
  picked_up:  { label: 'On the Way',         icon: '🚴', desc: 'Your order has been picked up' },
  delivered:  { label: 'Delivered!',         icon: '🎉', desc: 'Enjoy your meal!' },
  cancelled:  { label: 'Cancelled',          icon: '❌', desc: 'This order was cancelled' },
};

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    setupSocket();
    return () => { socketRef.current?.disconnect(); };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await getOrder(orderId);
      setOrder(res.data.order);
    } catch {
      Alert.alert('Error', 'Could not load order');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = async () => {
    const token = await AsyncStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:order', orderId);
    });

    socket.on('order:status_update', ({ order_id, status, delivery_partner }) => {
      if (order_id === orderId) {
        setOrder((prev) => ({
          ...prev,
          status,
          ...(delivery_partner ? { delivery_partner_name: delivery_partner.name } : {}),
        }));
      }
    });
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(orderId);
            setOrder((prev) => ({ ...prev, status: 'cancelled' }));
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Cannot cancel now');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const info = STATUS_INFO[order.status] || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order Status</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Status card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>{info.icon}</Text>
        <Text style={styles.statusLabel}>{info.label}</Text>
        <Text style={styles.statusDesc}>{info.desc}</Text>
        {order.delivery_partner_name && (
          <Text style={styles.partnerTxt}>🚴 {order.delivery_partner_name} is delivering</Text>
        )}
      </View>

      {/* Progress steps */}
      {!isCancelled && (
        <View style={styles.stepsContainer}>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <React.Fragment key={step}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                    {done && !active && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                    {STATUS_INFO[step]?.label}
                  </Text>
                </View>
                {i < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, i < currentStep && styles.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Order summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order from {order.shop_name}</Text>
        <Text style={styles.summaryAddress}>📍 {order.delivery_address}</Text>
        {order.special_note ? (
          <Text style={styles.summaryNote}>📝 {order.special_note}</Text>
        ) : null}
        <Text style={styles.summaryTotal}>Total: ₹{parseFloat(order.total_amount).toFixed(0)}</Text>
      </View>

      {/* Cancel button (only for pending) */}
      {order.status === 'pending' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelTxt}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      {/* Done button */}
      {(order.status === 'delivered' || order.status === 'cancelled') && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.doneBtnTxt}>Back to Home</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backArrow: { fontSize: 22, color: '#333' },
  title: { fontSize: 18, fontWeight: '700', color: '#222' },
  statusCard: {
    backgroundColor: '#6C63FF', margin: 16, borderRadius: 20,
    padding: 24, alignItems: 'center',
  },
  statusIcon: { fontSize: 48, marginBottom: 8 },
  statusLabel: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statusDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  partnerTxt: { color: '#fff', marginTop: 12, fontSize: 14, fontWeight: '600' },
  stepsContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 8,
    backgroundColor: '#fff', paddingVertical: 16, marginHorizontal: 16,
    borderRadius: 16, flexWrap: 'wrap', justifyContent: 'center',
  },
  stepItem: { alignItems: 'center', width: 60 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#DDD', backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotDone: { backgroundColor: '#E8E4FF', borderColor: '#6C63FF' },
  stepDotActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  checkmark: { color: '#6C63FF', fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' },
  stepLabelDone: { color: '#6C63FF' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#DDD', maxWidth: 20 },
  stepLineDone: { backgroundColor: '#6C63FF' },
  summary: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 16, marginTop: 8,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 6 },
  summaryAddress: { fontSize: 13, color: '#666', marginBottom: 4 },
  summaryNote: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 4 },
  summaryTotal: { fontSize: 15, fontWeight: '700', color: '#6C63FF', marginTop: 6 },
  cancelBtn: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 12,
    paddingVertical: 14, borderWidth: 1.5, borderColor: '#FF5252', alignItems: 'center',
  },
  cancelTxt: { color: '#FF5252', fontSize: 15, fontWeight: '600' },
  doneBtn: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#6C63FF',
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  doneBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
