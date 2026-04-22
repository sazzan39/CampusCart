import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SectionList,
} from 'react-native';
import { getVendor } from '../../api/vendors';
import useCartStore from '../../store/cartStore';
import MenuItem from '../../components/MenuItem';

export default function VendorScreen({ route, navigation }) {
  const { vendorId } = route.params;
  const [vendor, setVendor] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, getItemCount, vendorId: cartVendorId } = useCartStore();
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      const res = await getVendor(vendorId);
      setVendor(res.data.vendor);

      // Group menu by category
      const menu = res.data.menu;
      const categoryMap = {};
      menu.forEach((item) => {
        const cat = item.category || 'other';
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(item);
      });
      const secs = Object.keys(categoryMap).map((cat) => ({
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        data: categoryMap[cat],
      }));
      setSections(secs);
    } catch {
      Alert.alert('Error', 'Could not load vendor');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item) => {
    const result = addItem(vendorId, vendor.shop_name, {
      menu_item_id: item.id,
      name: item.name,
      price: parseFloat(item.price),
    });
    if (result === 'cleared') {
      Alert.alert('Cart Cleared', `Starting a new cart from ${vendor.shop_name}`);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Vendor header */}
      <View style={styles.vendorHeader}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.shopName}>{vendor.shop_name}</Text>
          <Text style={styles.shopMeta}>
            {vendor.location} · {vendor.is_open ? '🟢 Open' : '🔴 Closed'} · ⭐ {vendor.rating || '–'}
          </Text>
        </View>
      </View>

      {!vendor.is_open && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>This vendor is currently closed</Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.catHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <MenuItem item={item} onAdd={() => handleAdd(item)} vendorOpen={vendor.is_open} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No menu items yet</Text>
          </View>
        }
      />

      {/* Floating cart bar */}
      {cartCount > 0 && cartVendorId === vendorId && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartBarTxt}>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</Text>
          <Text style={styles.cartBarAction}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vendorHeader: {
    backgroundColor: '#6C63FF', paddingTop: 56, paddingBottom: 20,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
  },
  back: { marginRight: 16 },
  backTxt: { color: '#fff', fontSize: 24 },
  headerInfo: { flex: 1 },
  shopName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  shopMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  closedBanner: {
    backgroundColor: '#FFF3CD', padding: 10, alignItems: 'center',
  },
  closedText: { color: '#856404', fontSize: 14, fontWeight: '600' },
  catHeader: {
    fontSize: 14, fontWeight: '700', color: '#6C63FF',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#F8F8FF',
  },
  list: { paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888' },
  cartBar: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#6C63FF', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 8, shadowOpacity: 0.2, shadowRadius: 8,
  },
  cartBarTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cartBarAction: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
