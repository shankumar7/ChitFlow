import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Animated, 
  Platform, 
  StatusBar,
  SafeAreaView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function DashboardScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
    startAnimations();
  }, []);

  const loadUser = async () => {
    const name = await AsyncStorage.getItem('user_name');
    setUserName(name || 'User');
  };

  const startAnimations = () => {
    const useNative = Platform.OS !== 'web';
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: useNative,
      }),
      Animated.delay(400).start(() => {
        Animated.spring(fabAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: useNative,
        }).start();
      })
    ]).start();
  };

  const SummaryCard = ({ title, value, icon, color }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{title}</Text>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.cardValue}>{value}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.verticalSpine} />
        
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Text style={styles.titleHeavy}>Chit</Text>
            <Text style={styles.titleLight}>Flow</Text>
          </View>
          <Pressable 
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.profileBtn, pressed && styles.profileBtnPressed]}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={32} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryGrid}>
            <SummaryCard title="TOTAL CHIT VALUE" value="₹ 0.00" icon="wallet-outline" color="#10B981" />
            <SummaryCard title="ACTIVE GROUPS" value="0" icon="account-group-outline" color="#3B82F6" />
          </View>

          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="playlist-remove" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No active chits found</Text>
              <Text style={styles.emptySub}>Tap the button below to create your first group.</Text>
            </View>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[
          styles.fabContainer, 
          { 
            opacity: fabAnim, 
            transform: [{ scale: fabAnim }, { translateY: fabAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0]
            }) }] 
          }
        ]}>
          <Pressable 
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            onPress={() => Alert.alert("Coming Soon", "The Group Creation module is being polished.")}
          >
            <MaterialCommunityIcons name="plus" size={32} color={colors.white} />
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  safeArea: { flex: 1 },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.xl
  },
  brandContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(28), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  titleLight: { fontSize: normalize(28), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  profileBtn: { padding: 4 },
  profileBtnPressed: { opacity: 0.6 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  summaryGrid: { gap: spacing.md, marginBottom: spacing.xxl },
  card: { 
    backgroundColor: '#fff', 
    padding: spacing.lg, 
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5 },
  cardValue: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  section: { marginTop: spacing.xl },
  sectionLabel: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: spacing.lg },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  fabContainer: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 40 : 30, 
    right: spacing.xl,
    zIndex: 100 
  },
  fab: { 
    backgroundColor: colors.text, 
    width: normalize(64), 
    height: normalize(64), 
    borderRadius: radius.full, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.3)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 12 }
    })
  },
  fabPressed: { transform: [{ scale: 0.9 }], opacity: 0.9 }
});
