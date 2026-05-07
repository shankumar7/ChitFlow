import 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './utils/theme';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import GroupListScreen from './screens/GroupListScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import MemberListScreen from './screens/MemberListScreen';
import AddMemberScreen from './screens/AddMemberScreen';
import PaymentScreen from './screens/PaymentScreen';

const Stack = Platform.OS === 'web' ? createStackNavigator() : createNativeStackNavigator();

export default function App() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '800', fontSize: 18 },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: 'Chit Groups' }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create Group' }} />
          <Stack.Screen name="MemberList" component={MemberListScreen} options={{ title: 'Members' }} />
          <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'Add Member' }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Track Payments' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
