import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import GroupListScreen from './screens/GroupListScreen';
import CollectionFeedScreen from './screens/CollectionFeedScreen';
import ProfileScreen from './screens/ProfileScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import MemberListScreen from './screens/MemberListScreen';
import AddMemberScreen from './screens/AddMemberScreen';
import PaymentScreen from './screens/PaymentScreen';
import AuctionScreen from './screens/AuctionScreen';
import { checkForUpdateOnLaunch, skipVersion } from './services/updateService';
import { colors, normalize } from './utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();

  // Once a day, quietly look for a newer GitHub release and offer it to the user.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    checkForUpdateOnLaunch().then((update) => {
      if (cancelled || !update) return;
      Alert.alert(
        'Update available',
        `ChitFlow v${update.latestVersion} is available. You are on v${update.currentVersion}.`,
        [
          { text: 'Skip this version', style: 'cancel', onPress: () => skipVersion(update.latestVersion) },
          { text: 'Later' },
          { text: 'Download', onPress: () => Linking.openURL(update.downloadUrl).catch(() => {}) },
        ]
      );
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (focused) {
            if (route.name === 'Home') iconName = 'home-variant';
            else if (route.name === 'Groups') iconName = 'layers-triple';
            else if (route.name === 'Collection') iconName = 'lightning-bolt';
            else if (route.name === 'Ledger') iconName = 'book-open-variant';
            else if (route.name === 'Profile') iconName = 'account-circle';
          } else {
            if (route.name === 'Home') iconName = 'home-variant-outline';
            else if (route.name === 'Groups') iconName = 'layers-triple-outline';
            else if (route.name === 'Collection') iconName = 'lightning-bolt-outline';
            else if (route.name === 'Ledger') iconName = 'book-outline';
            else if (route.name === 'Profile') iconName = 'account-outline';
          }
          return <MaterialCommunityIcons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: Platform.OS === 'ios' ? 65 + insets.bottom : 75 + (insets.bottom > 0 ? insets.bottom : 5),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 15,
          paddingTop: 12,
          ...Platform.select({
            web: { boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 15 }
          })
        },
        tabBarLabelStyle: {
          fontSize: normalize(10),
          fontWeight: '800',
          letterSpacing: 0.5,
          marginBottom: 4,
          textTransform: 'uppercase'
        }
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Groups" component={GroupListScreen} />
      <Tab.Screen name="Collection" component={CollectionFeedScreen} />
      <Tab.Screen name="Ledger" component={TransactionsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_name');
      const storedPin = await AsyncStorage.getItem('user_pin');
      if (storedName && storedPin) setInitialRoute('MainTabs');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ExpoStatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="MemberList" component={MemberListScreen} />
          <Stack.Screen name="AddMember" component={AddMemberScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Auction" component={AuctionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
