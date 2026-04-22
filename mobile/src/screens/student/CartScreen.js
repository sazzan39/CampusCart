import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { placeOrder } from '../../api/orders';

const DELIVERY_FEE = 15;

export default function CartScreen({ navigation }) {
  const { items, vendorId, vendorName, addItem, removeItem, clearCart, getTotal } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const defaultAddress = [user?.hostel, user?.room_number].filter(Boolean).join(', ') || '';
  const [address, setAddress] = useState(defaultAddress);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = getTotal();
  const total = subtotal + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const res = await placeOrder({
        vendor_id: vendorId,
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
        })),
        delivery_address: address.trim(),
        special_note: note.trim() || undefined,
      });

      clearCart();
      navigation.replace('OrderTracking', { orderId: res.data.order.id });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place order';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Cart is empty</Text>
        <Text style={styles.emptySub}>Add items from a vendor</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTxt}>Browse Vendors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <TouchableOpacity onPress={() => { clearCart(); }}>
          <Text style={styles.clearTxt}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.menu_item_id}
        ListHeaderComponent={
          <Text style={styles.vendorLabel}>from {vendorName}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
            <View style={styles.qty}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.menu_item_id)}>
                <Text style={styles.qtyTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyCount}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => addItem(vendorId, vendorName, {
                  menu_item_id: item.menu_item_id, name: item.name, price: item.price,
                })}
              >
                <Text style={styles.qtyTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Delivery address */}
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Hostel, Block, Room no."
              placeholderTextColor="#aaa"
            />

            {/* Special note */}
            <Text style={styles.label}>Special Instructions (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Less spicy, no onion..."
              placeholderTextColor="#aaa"
              multiline
            />

            {/* Bill summary */}
            <View style={styles.bill}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
                <Text style={styles.billValue}>₹{subtotal.toFixed(0)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <Text style={styles.billValue}>₹{DELIVERY_FEE}</Text>
              </View>
              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Place order button */}
      <TouchableOpacity
        style={[styles.orderBtn, loading && styles.orderBtnDisabled]}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.orderBtnTxt}>Place Order · ₹{total.toFixed(0)}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptySub: { fontSize: 14, color: '#888', marginTop: 6, marginBottom: 24 },
  backBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  backBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backArrow: { fontSize: 22, color: '#333' },
  title: { fontSize: 18, fontWeight: '700', color: '#222' },
  clearTxt: { fontSize: 14, color: '#FF5252', fontWeight: '600' },
  vendorLabel: { fontSize: 13, color: '#888', padding: 16, paddingBottom: 4 },
  list: { paddingBottom: 100 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 4,
    borderRadius: 12, padding: 14,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#222' },
  itemPrice: { fontSize: 14, color: '#6C63FF', marginTop: 4, fontWeight: '700' },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center',
  },
  qtyTxt: { fontSize: 18, color: '#6C63FF', fontWeight: '700' },
  qtyCount: { fontSize: 16, fontWeight: '700', color: '#222', minWidth: 20, textAlign: 'center' },
  footer: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#222', borderWidth: 1, borderColor: '#E8E8E8',
  },
  bill: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginTop: 16, borderWidth: 1, borderColor: '#F0F0F0',
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#666' },
  billValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#222' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#6C63FF' },
  orderBtn: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', elevation: 6,
  },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
