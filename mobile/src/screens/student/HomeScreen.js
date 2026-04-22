import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { getVendors } from '../../api/vendors';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import VendorCard from '../../components/VendorCard';

export default function HomeScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.getItemCount());

  const fetchVendors = useCallback(async () => {
    try {
      const res = await getVendors();
      setVendors(res.data.vendors);
      setFiltered(res.data.vendors);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(vendors);
    } else {
      const q = search.toLowerCase();
      setFiltered(vendors.filter((v) =>
        v.shop_name.toLowerCase().includes(q) || v.location?.toLowerCase().includes(q)
      ));
    }
  }, [search, vendors]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.sub}>{user?.hostel || 'Campus'} · {user?.reward_points} pts</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder="Search vendors, cafes..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.sectionTitle}>
        {filtered.length} Vendor{filtered.length !== 1 ? 's' : ''} Available
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            onPress={() => navigation.navigate('Vendor', { vendorId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchVendors(); }}
            tintColor="#6C63FF"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No vendors open right now</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#6C63FF',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 24 },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#FF5252', borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  search: {
    margin: 16, borderRadius: 12, backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    color: '#222', elevation: 2, shadowOpacity: 0.08, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 13, color: '#888', fontWeight: '600', paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888' },
});
