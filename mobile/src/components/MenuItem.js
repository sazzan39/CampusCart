import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useCartStore from '../store/cartStore';

export default function MenuItem({ item, onAdd, vendorOpen }) {
  const quantity = useCartStore((s) => s.getItemQuantity(item.id));

  return (
    <View style={[styles.card, !item.is_available && styles.cardUnavailable]}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        <Text style={styles.price}>₹{parseFloat(item.price).toFixed(0)}</Text>
        {!item.is_available && <Text style={styles.unavailable}>Currently unavailable</Text>}
      </View>
      {vendorOpen && item.is_available && (
        <View style={styles.actions}>
          {quantity === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
              <Text style={styles.addBtnTxt}>+ Add</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyTxt}>{quantity} added</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4,
    borderRadius: 12, padding: 14,
  },
  cardUnavailable: { opacity: 0.5 },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#222' },
  desc: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 16 },
  price: { fontSize: 14, fontWeight: '700', color: '#6C63FF', marginTop: 6 },
  unavailable: { fontSize: 11, color: '#FF5252', marginTop: 2 },
  actions: {},
  addBtn: {
    backgroundColor: '#6C63FF', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  qtyBadge: {
    backgroundColor: '#F0EEFF', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 10,
  },
  qtyTxt: { color: '#6C63FF', fontWeight: '700', fontSize: 12 },
});
