import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  FlatList, 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  Platform, 
  StatusBar,
  Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembersByGroup } from '../services/memberService';
import { subscribePaymentsByGroupAndMonth, togglePaymentStatus } from '../services/paymentService';
import { getCurrentMonthNumber, getMonthName } from '../utils/date';
import { colors, spacing, radius, normalize, layout, window } from '../utils/theme';

export default function PaymentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, monthlyAmount } = route.params;
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthNumber());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubMembers = subscribeMembersByGroup(groupId, (data) => {
      setMembers(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    });

    const unsubPayments = subscribePaymentsByGroupAndMonth(groupId, currentMonth, (data) => {
      setPayments(data);
    });

    return () => {
      unsubMembers();
      unsubPayments();
    };
  }, [groupId, currentMonth]);

  const summary = useMemo(() => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalCollected = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      totalMembers: members.length,
      monthlyAmount: monthlyAmount,
      paidCount: paidPayments.length,
      totalCollected,
    };
  }, [members, payments, monthlyAmount]);

  const monthLabel = useMemo(() => {
    return `${getMonthName(currentMonth)} ${new Date().getFullYear()}`;
  }, [currentMonth]);

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      let next = prev + delta;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      return next;
    });
  };

  const handleToggle = async (memberId) => {
    const existing = payments.find(p => p.memberId === memberId);
    await togglePaymentStatus({
      groupId,
      memberId,
      month: currentMonth,
      amount: monthlyAmount,
      status: existing?.status === 'paid' ? 'unpaid' : 'paid'
    });
  };

  const renderPaymentRow = ({ item, index }) => {
    const payment = payments.find(p => p.memberId === item.id);
    const isPaid = payment?.status === 'paid';

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20 * (index + 1), 0]
      }) }] }]}>
        <View style={styles.cardContent}>
          <View style={[styles.statusIndicator, { backgroundColor: isPaid ? '#10B981' : '#F3F4F6' }]} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name.toUpperCase()}</Text>
            <Text style={styles.amount}>₹ {monthlyAmount.toLocaleString()}</Text>
          </View>
          <Pressable 
            style={({ pressed }) => [
              styles.actionBtn, 
              isPaid ? styles.actionBtnPaid : styles.actionBtnUnpaid,
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => handleToggle(item.id)}
          >
            <MaterialCommunityIcons 
              name={isPaid ? "check-circle" : "circle-outline"} 
              size={24} 
              color={isPaid ? colors.white : "#9CA3AF"} 
            />
            <Text style={[styles.actionText, { color: isPaid ? colors.white : "#9CA3AF" }]}>
              {isPaid ? 'PAID' : 'PENDING'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.verticalSpine} />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>PAYMENT LEDGER</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Track</Text>
            <Text style={styles.titleLight}>Flow</Text>
          </View>
        </View>

        <View style={styles.monthPicker}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.monthText}>{monthLabel.toUpperCase()}</Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>COLLECTED</Text>
              <Text style={styles.summaryValue}>₹ {summary.totalCollected.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>PAID</Text>
              <Text style={styles.summaryValue}>{summary.paidCount}/{summary.totalMembers}</Text>
            </View>
          </View>
        }
        renderItem={renderPaymentRow}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-off" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No Entries</Text>
              <Text style={styles.emptySub}>Add members to start the tracking cycle.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  headerTop: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  monthPicker: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xs,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  monthArrow: { padding: 10 },
  monthText: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  summaryBox: { 
    flexDirection: 'row', 
    backgroundColor: colors.text, 
    borderRadius: radius.xs, 
    padding: spacing.lg, 
    marginBottom: spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  summaryValue: { fontSize: normalize(20), fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
  summaryDivider: { width: 1, height: 24, backgroundColor: '#374151' },
  list: { paddingHorizontal: spacing.xl },
  card: { 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.xs, 
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  amount: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 4,
    minWidth: 100,
    justifyContent: 'center'
  },
  actionBtnPaid: { backgroundColor: '#10B981' },
  actionBtnUnpaid: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' },
  actionText: { fontSize: normalize(10), fontWeight: '900', letterSpacing: 1 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60,
    backgroundColor: '#F9FAFB', 
    borderRadius: radius.xs,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8 }
});
