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
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeGroups } from '../services/groupService';
import { subscribeAllMembers } from '../services/memberService';
import { subscribeAllPaymentsByMonth } from '../services/paymentService';
import { subscribeAllLiftings } from '../services/liftingService';
import { getCurrentMonthNumber } from '../utils/date';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PerformanceCard = ({ group, members, payments, index, navigation }) => {
  const groupMembers = members.filter(m => m.groupId === group.id);
  const groupPayments = payments.filter(p => p.groupId === group.id);
  const totalMembers = groupMembers.length;
  const paidCount = groupPayments.length;
  const pendingCount = totalMembers - paidCount;
  
  if (totalMembers === 0) return null;

  return (
    <Pressable 
      onPress={() => navigation.navigate('Groups')}
      style={styles.perfCard}
    >
      <View style={styles.perfInfo}>
        <Text style={styles.perfName}>{(group?.name || 'GROUP').toUpperCase()}</Text>
        <Text style={styles.perfSub}>{pendingCount} MEMBERS PENDING</Text>
      </View>
      <View style={styles.perfAction}>
        <View style={[styles.perfBadge, { backgroundColor: pendingCount > 0 ? '#FEF2F2' : '#F0FDF4' }]}>
          <Text style={[styles.perfBadgeText, { color: pendingCount > 0 ? '#EF4444' : '#10B981' }]}>
            {pendingCount > 0 ? `₹ ${(pendingCount * (group?.monthlyAmount || 0)).toLocaleString()}` : 'CLEARED'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [liftings, setLiftings] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;
  const currentMonth = getCurrentMonthNumber();


  useEffect(() => {
    const unsubGroups = subscribeGroups((data) => {
      setGroups(data);
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    });
    const unsubMembers = subscribeAllMembers(setMembers);
    const unsubPayments = subscribeAllPaymentsByMonth(currentMonth, setPayments);
    const unsubLiftings = subscribeAllLiftings(setLiftings);

    // Safety net so the screen still appears if the first snapshot never arrives (for example offline).
    const fallback = setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }).start();
    }, 4000);

    return () => {
      clearTimeout(fallback);
      unsubGroups();
      unsubMembers();
      unsubPayments();
      unsubLiftings();
    };
  }, []);

  const stats = {
    totalGroups: groups.length,
    totalMembers: members.length,
    monthlyCollection: payments.reduce((sum, p) => sum + (p.amount || 0), 0) + 
                       liftings
                        .filter(l => l.monthNumber === currentMonth)
                        .reduce((sum, l) => sum + (l.organizerCommission || 0), 0)
  };

  return (
    <View style={styles.container}>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Text style={styles.step}>MANAGER DASHBOARD</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.titleHeavy}>Chit</Text>
              <Text style={styles.titleLight}>Flow</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statMain}>
              <Text style={styles.statLabel}>MONTHLY REVENUE</Text>
              <Text style={styles.statValueLarge}>₹ {stats.monthlyCollection.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statSmall}>
                <Text style={styles.statLabel}>GROUPS</Text>
                <Text style={styles.statValueSmall}>{stats.totalGroups}</Text>
              </View>
              <View style={styles.statSmall}>
                <Text style={styles.statLabel}>MEMBERS</Text>
                <Text style={styles.statValueSmall}>{stats.totalMembers}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>PENDING PERFORMANCE</Text>
              <MaterialCommunityIcons name="alert-decagram-outline" size={16} color="#EF4444" />
            </View>
            {groups.length > 0 ? (
              groups.map((group, index) => (
                <PerformanceCard 
                  key={group.id} 
                  group={group} 
                  members={members} 
                  payments={payments} 
                  index={index} 
                  navigation={navigation}
                />
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No Active Circles</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { marginBottom: spacing.xl },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(54), fontWeight: '900', color: colors.text, letterSpacing: -3 },
  titleLight: { fontSize: normalize(54), fontWeight: '200', color: colors.text, letterSpacing: -2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  statsGrid: { marginBottom: spacing.xxl },
  statMain: { backgroundColor: colors.text, padding: spacing.lg, borderRadius: radius.xs, marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statSmall: { flex: 1, backgroundColor: '#F9FAFB', padding: spacing.lg, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6' },
  statLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  statValueLarge: { fontSize: normalize(32), fontWeight: '900', color: colors.white, letterSpacing: -1 },
  statValueSmall: { fontSize: normalize(24), fontWeight: '900', color: colors.text },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  sectionLabel: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2 },
  perfCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  perfInfo: { flex: 1 },
  perfName: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  perfSub: { fontSize: normalize(9), fontWeight: '700', color: '#9CA3AF', marginTop: 2 },
  perfBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  perfBadgeText: { fontSize: normalize(10), fontWeight: '900' },
  emptyBox: { padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(12), fontWeight: '800', color: '#D1D5DB' }
});
