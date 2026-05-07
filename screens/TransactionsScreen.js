import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  StatusBar,
  Animated,
  Platform,
  ScrollView,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeGroups } from '../services/groupService';
import { subscribeAllMembers } from '../services/memberService';
import { subscribeAllPaymentsByMonth, subscribeRecentTransactions } from '../services/paymentService';
import { getCurrentMonthNumber, getMonthName } from '../utils/date';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const AuditCard = ({ group, members, payments, opacity, index }) => {
  const groupMembers = members.filter(m => m.groupId === group.id);
  const groupPayments = payments.filter(p => p.groupId === group.id);
  const totalMembers = groupMembers.length;
  const paidCount = groupPayments.length;
  const progress = totalMembers > 0 ? paidCount / totalMembers : 0;
  const totalCollected = groupPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY: opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0]
    }) }] }]}>
      <View style={styles.cardTop}>
        <View style={styles.groupIcon}>
          <MaterialCommunityIcons name="layers" size={24} color={colors.text} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{(group?.name || 'UNKNOWN').toUpperCase()}</Text>
          <Text style={styles.groupSub}>₹ {(group?.monthlyAmount || 0).toLocaleString()} / MEMBER</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{paidCount}/{totalMembers} PAID</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(progress * 100)}% COLLECTED</Text>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>REVENUE</Text>
          <Text style={styles.statValue}>₹ {totalCollected.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PENDING</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            ₹ {((totalMembers - paidCount) * (group?.monthlyAmount || 0)).toLocaleString()}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const TransactionItem = ({ item, members, groups }) => {
  const member = members.find(m => m.id === item.memberId);
  const group = groups.find(g => g.id === item.groupId);
  
  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}>
        <MaterialCommunityIcons 
          name={item.method === 'cash' ? 'cash' : 'cellphone-check'} 
          size={18} 
          color="#10B981" 
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{(member?.name || 'UNKNOWN').toUpperCase()}</Text>
        <Text style={styles.txSub}>{(group?.name || 'GROUP').toUpperCase()} • {getMonthName(item.monthNumber).toUpperCase()}</Text>
        {item.remarks ? <Text style={styles.txRemarks}>"{item.remarks}"</Text> : null}
      </View>
      <View style={styles.txAmountBox}>
        <Text style={styles.txAmount}>₹ {(item.amount || 0).toLocaleString()}</Text>
        <Text style={styles.txMethod}>{(item.method || 'UPI').toUpperCase()}</Text>
      </View>
    </View>
  );
};

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [filterGroupId, setFilterGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;
  const currentMonth = getCurrentMonthNumber();

  useEffect(() => {
    const unsubGroups = subscribeGroups(setGroups);
    const unsubMembers = subscribeAllMembers(setMembers);
    const unsubPayments = subscribeAllPaymentsByMonth(currentMonth, setPayments);
    const unsubRecent = subscribeRecentTransactions(setRecentTx);

    setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 1500);

    return () => {
      unsubGroups();
      unsubMembers();
      unsubPayments();
      unsubRecent();
    };
  }, []);

  const filteredTx = useMemo(() => {
    if (!filterGroupId) return recentTx;
    return recentTx.filter(tx => tx.groupId === filterGroupId);
  }, [recentTx, filterGroupId]);

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.verticalSpine} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.step}>FINANCIAL LEDGER</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Audit</Text>
            <Text style={styles.titleLight}>Hub</Text>
          </View>
          <Text style={styles.monthLabel}>{getMonthName(currentMonth).toUpperCase()} STATUS</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 100 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GROUP PERFORMANCE</Text>
              {groups.length > 0 ? (
                groups.map((group, index) => (
                  <AuditCard 
                    key={group.id} 
                    group={group} 
                    members={members}
                    payments={payments}
                    index={index}
                    opacity={fadeAnim}
                  />
                ))
              ) : null}
            </View>

            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionLabel}>RECENT COLLECTIONS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <Pressable 
                    style={[styles.filterBtn, !filterGroupId && styles.filterBtnActive]}
                    onPress={() => setFilterGroupId(null)}
                  >
                    <Text style={[styles.filterText, !filterGroupId && styles.filterTextActive]}>ALL</Text>
                  </Pressable>
                  {groups.map(g => (
                    <Pressable 
                      key={g.id}
                      style={[styles.filterBtn, filterGroupId === g.id && styles.filterBtnActive]}
                      onPress={() => setFilterGroupId(g.id)}
                    >
                      <Text style={[styles.filterText, filterGroupId === g.id && styles.filterTextActive]}>
                        {g.name.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.historyCard}>
                {filteredTx.length > 0 ? (
                  filteredTx.map((tx) => (
                    <TransactionItem key={tx.id} item={tx} members={members} groups={groups} />
                  ))
                ) : (
                  <View style={styles.emptyHistoryWrap}>
                    <MaterialCommunityIcons name="filter-variant-remove" size={32} color="#E5E7EB" />
                    <Text style={styles.emptyHistory}>No matching records found.</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.topBlocker, { height: safeTop }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { marginBottom: spacing.xl },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  monthLabel: { fontSize: normalize(12), fontWeight: '800', color: '#3B82F6', marginTop: 4, letterSpacing: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  section: { marginBottom: spacing.xxl },
  sectionLabel: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: spacing.lg },
  card: { backgroundColor: '#fff', padding: spacing.lg, borderRadius: radius.xs, marginBottom: spacing.md, borderWidth: 1, borderColor: '#F3F4F6' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  groupIcon: { width: 40, height: 40, backgroundColor: '#F9FAFB', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  groupSub: { fontSize: normalize(9), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  statusBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: normalize(10), fontWeight: '900', color: colors.text },
  progressContainer: { marginBottom: spacing.lg },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#10B981' },
  progressLabel: { fontSize: normalize(9), fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  statBox: { flex: 1 },
  statLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', marginBottom: 4 },
  statValue: { fontSize: normalize(16), fontWeight: '900', color: colors.text },
  divider: { width: 1, height: 24, backgroundColor: '#F3F4F6', marginHorizontal: spacing.md },
  historySection: { marginBottom: spacing.xl },
  historyHeader: { marginBottom: spacing.lg },
  filterScroll: { marginTop: spacing.sm },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginRight: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' },
  filterBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterText: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  filterTextActive: { color: colors.white },
  historyCard: { backgroundColor: '#fff', borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  txIcon: { width: 32, height: 32, backgroundColor: '#F0FDF4', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txName: { fontSize: normalize(11), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  txSub: { fontSize: normalize(8), fontWeight: '700', color: '#9CA3AF', marginTop: 2 },
  txRemarks: { fontSize: normalize(8), color: '#6B7280', fontStyle: 'italic', marginTop: 2 },
  txAmountBox: { alignItems: 'flex-end' },
  txAmount: { fontSize: normalize(14), fontWeight: '900', color: '#10B981' },
  txMethod: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', marginTop: 2 },
  emptyHistoryWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyHistory: { fontSize: normalize(10), color: '#D1D5DB', textAlign: 'center', marginTop: 12, fontWeight: '700' }
});
