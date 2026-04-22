import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';

import useAuthStore from '../store/authStore';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Student screens
import HomeScreen from '../screens/student/HomeScreen';
import VendorScreen from '../screens/student/VendorScreen';
import CartScreen from '../screens/student/CartScreen';
import OrderTrackingScreen from '../screens/student/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/student/OrderHistoryScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

// Delivery screens
import DashboardScreen from '../screens/delivery/DashboardScreen';
import ActiveDeliveryScreen from '../screens/delivery/ActiveDeliveryScreen';
import EarningsScreen from '../screens/delivery/EarningsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Student Tab Navigator ────────────────────────────────────
function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color, fontSize: 11, fontWeight: focused ? '700' : '500' }}>
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => {
          const icons = { Home: '🏠', Orders: '📋', Profile: '👤' };
          return <Text style={{ fontSize: focused ? 22 : 20 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Delivery Partner Tab Navigator ──────────────────────────
function DeliveryTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused }) => {
          const icons = { Dashboard: '🚴', Earnings: '💰' };
          return <Text style={{ fontSize: focused ? 22 : 20 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────
export default function RootNavigator() {
  const { user, loading, init } = useAuthStore();

  useEffect(() => { init(); }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>CampusCart</Text>
        <ActivityIndicator color="#6C63FF" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'student' ? (
          // Student stack
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen name="Vendor" component={VendorScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          </>
        ) : user.role === 'delivery_partner' ? (
          // Delivery partner stack
          <>
            <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
            <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
          </>
        ) : (
          // Fallback for unknown role
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  splashLogo: { fontSize: 36, fontWeight: '900', color: '#6C63FF' },
});
