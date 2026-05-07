import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Animated, 
  Platform, 
  StatusBar,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeGroups } from '../services/groupService';
import { subscribeAllPaymentsByMonth } from '../services/paymentService';
import { getCurrentMonthNumber } from '../utils/date';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const SummaryCard = ({ title, value, icon, color, opacity, translateY }) => (
  <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardLabel}>{title}</Text>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </Animated.View>
);

const GroupCard = ({ group, onPress, opacity, index }) => (
  <Animated.View style={[styles.groupCard, { opacity, transform: [{ translateY: opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [20 * (index + 1), 0]
  }) }] }]}>
    <Pressable onPress={() => onPress(group)} style={styles.groupCardInner}>
      <View style={styles.groupIcon}>
        <MaterialCommunityIcons name="folder-outline" size={24} color={colors.text} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name.toUpperCase()}</Text>
        <Text style={styles.groupSub}>₹ {group.monthlyAmount.toLocaleString()} • {group.duration} MONTHS</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
    </Pressable>
  </Animated.View>
);

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [monthlyCollections, setMonthlyCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    const currentMonth = getCurrentMonthNumber();
    
    const unsubGroups = subscribeGroups((data) => {
      setGroups(data);
      setLoading(false);
      startAnimations();
    });

    const unsubPayments = subscribeAllPaymentsByMonth(currentMonth, (data) => {
      setMonthlyCollections(data);
    });

    return () => {
      unsubGroups();
      unsubPayments();
    };
  }, []);

  const startAnimations = () => {
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: useNative }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: useNative }),
      Animated.delay(400).start(() => {
        Animated.spring(fabAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: useNative }).start();
      })
    ]).start();
  };

  const totalCollectedSoFar = monthlyCollections.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <StatusBar translucent={false} backgroundColor="white" barStyle="dark-content" />
      <View style={styles.verticalSpine} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandContainer}>
          <Text style={styles.titleHeavy}>Chit</Text>
          <Text style={styles.titleLight}>Flow</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryGrid}>
          <SummaryCard 
            title="MONTHLY FLOW (COLLECTED)" 
            value={`₹ ${totalCollectedSoFar.toLocaleString()}`} 
            icon="cash-multiple" 
            color="#10B981" 
            opacity={fadeAnim} 
            translateY={slideAnim} 
          />
          <SummaryCard 
            title="ACTIVE CHITTI GROUPS" 
            value={groups.length.toString()} 
            icon="layers-outline" 
            color="#3B82F6" 
            opacity={fadeAnim} 
            translateY={slideAnim} 
          />
        </View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionLabel}>RECENT ARCHITECTURE</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} style={{ marginTop: 20 }} />
          ) : groups.length > 0 ? (
            groups.slice(0, 3).map((group, index) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                index={index}
                opacity={fadeAnim}
                onPress={() => navigation.navigate('MemberList', { groupId: group.id, groupName: group.name, monthlyAmount: group.monthlyAmount })} 
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="playlist-remove" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No Active Chits</Text>
              <Text style={styles.emptySub}>Initialize a group to start managing collections.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    marginBottom: spacing.xl
  },
  brandContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(28), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  titleLight: { fontSize: normalize(28), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  summaryGrid: { gap: spacing.md, marginBottom: spacing.xxl },
  card: { 
    backgroundColor: '#fff', 
    padding: spacing.lg, 
    borderRadius: radius.xs,
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
  groupCard: { marginBottom: spacing.sm },
  groupCardInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  groupIcon: { width: 44, height: 44, backgroundColor: '#F9FAFB', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  groupSub: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
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
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
