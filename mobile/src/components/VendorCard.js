import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function VendorCard({ vendor, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Colored header strip */}
      <View style={[styles.strip, !vendor.is_open && styles.stripClosed]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{vendor.shop_name}</Text>
          <View style={[styles.badge, vendor.is_open ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeTxt}>{vendor.is_open ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
        {vendor.location && <Text style={styles.location}>📍 {vendor.location}</Text>}
        <View style={styles.meta}>
          {vendor.rating > 0 && <Text style={styles.rating}>⭐ {vendor.rating}</Text>}
          <Text style={styles.owner}>{vendor.owner_name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    overflow: 'hidden', elevation: 2, shadowOpacity: 0.06, shadowRadius: 4,
  },
  strip: { height: 5, backgroundColor: '#6C63FF' },
  stripClosed: { backgroundColor: '#DDD' },
  body: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#222', flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeOpen: { backgroundColor: '#E8F5E9' },
  badgeClosed: { backgroundColor: '#F5F5F5' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  location: { fontSize: 13, color: '#888', marginBottom: 8 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  rating: { fontSize: 13, color: '#666', fontWeight: '600' },
  owner: { fontSize: 12, color: '#aaa' },
});
