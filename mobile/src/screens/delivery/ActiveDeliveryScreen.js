import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { markDelivered } from '../../api/delivery';

export default function ActiveDeliveryScreen({ route, navigation }) {
  const { order, pickup, dropoff } = route.params;
  const [marking, setMarking] = useState(false);

  const handleDelivered = () => {
    Alert.alert('Confirm Delivery', 'Mark this order as delivered?', [
      { text: 'Cancel' },
      {
        text: 'Yes, Delivered',
        onPress: async () => {
          setMarking(true);
          try {
            const res = await markDelivered(order.id);
            Alert.alert(
              'Delivery Complete! 🎉',
              `You earned +${res.data.points_earned} reward points!`,
              [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
            );
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Could not mark as delivered');
          } finally {
            setMarking(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Active Delivery</Text>
        <Text style={styles.subtitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
      </View>

      {/* Step 1: Pickup */}
      <View style={styles.stepCard}>
        <View style={styles.stepNum}><Text style={styles.stepNumTxt}>1</Text></View>
        <View style={styles.stepContent}>
          <Text style={styles.stepAction}>Go to Pickup</Text>
          <Text style={styles.stepLocation}>{pickup?.shop_name}</Text>
          <Text style={styles.stepAddress}>📍 {pickup?.location}</Text>
        </View>
      </View>

      <View style={styles.stepDivider} />

      {/* Step 2: Deliver */}
      <View style={styles.stepCard}>
        <View style={[styles.stepNum, styles.stepNumTwo]}><Text style={styles.stepNumTxt}>2</Text></View>
        <View style={styles.stepContent}>
          <Text style={styles.stepAction}>Deliver to</Text>
          <Text style={styles.stepAddress}>🏠 {dropoff?.address || order.delivery_address}</Text>
        </View>
      </View>

      {/* Order details */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Order Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Value</Text>
          <Text style={styles.detailValue}>₹{parseFloat(order.total_amount).toFixed(0)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Your Earnings</Text>
          <Text style={[styles.detailValue, styles.earnings]}>₹{parseFloat(order.delivery_fee).toFixed(0)}</Text>
        </View>
        {order.special_note ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Note</Text>
            <Text style={styles.detailValue}>{order.special_note}</Text>
          </View>
        ) : null}
      </View>

      {/* Tip */}
      <View style={styles.tip}>
        <Text style={styles.tipTxt}>💡 Collect the order from the vendor, then deliver to the student's room</Text>
      </View>

      {/* Mark delivered */}
      <TouchableOpacity
        style={[styles.deliverBtn, marking && styles.deliverBtnDisabled]}
        onPress={handleDelivered}
        disabled={marking}
      >
        {marking
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.deliverBtnTxt}>Mark as Delivered ✓</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  header: {
    backgroundColor: '#6C63FF', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  stepCard: {
    flexDirection: 'row', backgroundColor: '#fff', margin: 16, marginBottom: 4,
    borderRadius: 16, padding: 16, alignItems: 'flex-start',
    elevation: 2, shadowOpacity: 0.06, shadowRadius: 4,
  },
  stepNum: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#6C63FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14, marginTop: 2,
  },
  stepNumTwo: { backgroundColor: '#4CAF50' },
  stepNumTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  stepContent: { flex: 1 },
  stepAction: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4 },
  stepLocation: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  stepAddress: { fontSize: 14, color: '#555' },
  stepDivider: {
    width: 2, height: 20, backgroundColor: '#E0E0E0',
    marginLeft: 31, marginVertical: 0,
  },
  detailCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16,
  },
  detailTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#222' },
  earnings: { color: '#4CAF50', fontSize: 16 },
  tip: {
    backgroundColor: '#FFF9E6', marginHorizontal: 16, borderRadius: 12,
    padding: 12, borderLeftWidth: 3, borderLeftColor: '#FFD700',
  },
  tipTxt: { fontSize: 13, color: '#856404' },
  deliverBtn: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', elevation: 6,
  },
  deliverBtnDisabled: { opacity: 0.6 },
  deliverBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
