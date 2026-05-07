import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './utils/theme';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import GroupListScreen from './screens/GroupListScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import MemberListScreen from './screens/MemberListScreen';
import AddMemberScreen from './screens/AddMemberScreen';
import PaymentScreen from './screens/PaymentScreen';

const Stack = Platform.OS === 'web' ? createStackNavigator() : createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await AsyncStorage.getItem('user_name');
        if (user) {
          setInitialRoute('Dashboard');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.white, // Setting white as default background
      card: colors.white,
      text: colors.text,
      border: colors.border,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '900', fontSize: 18, letterSpacing: -0.5 },
            contentStyle: { backgroundColor: colors.white },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: 'CHIT GROUPS' }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'NEW GROUP' }} />
          <Stack.Screen name="MemberList" component={MemberListScreen} options={{ title: 'MEMBERS' }} />
          <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'NEW MEMBER' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'PAYMENTS' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
