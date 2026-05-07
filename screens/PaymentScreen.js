import { useEffect, useState, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembersByGroup } from '../services/memberService';
import { subscribePaymentsByGroupAndMonth } from '../services/paymentService';
import { getCurrentMonthNumber, getMonthName } from '../utils/date';
import MemberPaymentRow from '../components/MemberPaymentRow';
import SummaryCard from '../components/SummaryCard';
import EmptyState from '../components/EmptyState';
import { colors, spacing, normalize, layout } from '../utils/theme';

export default function PaymentScreen({ route }) {
  const { groupId, groupName, monthlyAmount } = route.params;
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthNumber());

  useEffect(() => {
    const unsubMembers = subscribeMembersByGroup(groupId, (data) => {
      setMembers(data);
      setLoading(false);
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

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.monthPicker}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthText}>{monthLabel}</Text>
        <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<SummaryCard summary={summary} />}
        ListEmptyComponent={
          <EmptyState 
            title="No members" 
            subtitle="Add members to this group to start tracking payments." 
            icon="account-off-outline"
          />
        }
        renderItem={({ item }) => (
          <MemberPaymentRow 
            member={item} 
            groupId={groupId} 
            month={currentMonth} 
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  monthPicker: { 
    ...layout.container,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: spacing.md, 
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  monthArrow: { padding: 8 },
  monthText: { fontSize: normalize(16), fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
  list: { ...layout.container, padding: spacing.md, paddingBottom: 100 }
});
