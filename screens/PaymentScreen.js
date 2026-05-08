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
  Animated,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembers } from '../services/memberService';
import { subscribePaymentsByGroupAndMonth, togglePaymentStatus } from '../services/paymentService';
import { subscribeLiftingsByGroup } from '../services/liftingService';
import { getCurrentMonthNumber, getMonthName } from '../utils/date';
import { colors, spacing, radius, normalize, layout, window } from '../utils/theme';

export default function PaymentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, monthlyAmount, duration, commissionPercentage = 5 } = route.params;
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [liftings, setLiftings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthNumber());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Intake State
  const [showIntake, setShowIntake] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [method, setMethod] = useState('cash'); // cash, upi
  const [remarks, setRemarks] = useState('');

  const chitValue = useMemo(() => (parseFloat(monthlyAmount) * parseInt(duration)) || 0, [monthlyAmount, duration]);
  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    const unsubMembers = subscribeMembers(groupId, (data) => {
      setMembers(data);
      setLoading(false);
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    });

    const unsubPayments = subscribePaymentsByGroupAndMonth(groupId, currentMonth, (data) => {
      setPayments(data);
    });

    const unsubLiftings = subscribeLiftingsByGroup(groupId, (data) => {
      setLiftings(data);
    });

    return () => {
      unsubMembers();
      unsubPayments();
      unsubLiftings();
    };
  }, [groupId, currentMonth]);

  const currentLifting = useMemo(() => {
    return liftings.find(l => l.monthNumber === currentMonth);
  }, [liftings, currentMonth]);

  const dividend = useMemo(() => {
    return currentLifting?.dividendPerMember || 0;
  }, [currentLifting]);

  const calculateMemberAmount = (member) => {
    const interest = chitValue * 0.01;
    if (member.hasTakenChit && member.chitTakenMonth < currentMonth) {
      return monthlyAmount + interest;
    }
    return Math.max(0, monthlyAmount - dividend);
  };

  const summary = useMemo(() => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalCollected = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      totalMembers: members.length,
      paidCount: paidPayments.length,
      totalCollected,
    };
  }, [members, payments]);

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

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const openIntake = (member) => {
    const existing = payments.find(p => p.memberId === member.id);
    if (existing?.status === 'paid') {
      handleConfirm(member.id, 'unpaid', member.name);
    } else {
      setSelectedMember(member);
      setMethod('cash');
      setRemarks('');
      setShowIntake(true);
    }
  };

  const handleConfirm = async (memberId, status = 'paid', mName) => {
    const targetMemberId = memberId || selectedMember.id;
    const finalMemberName = mName || selectedMember?.name || 'Member';
    const memberObj = members.find(m => m.id === targetMemberId);
    
    const finalAmount = calculateMemberAmount(memberObj);

    await togglePaymentStatus({
      groupId,
      groupName,
      memberId: targetMemberId,
      memberName: finalMemberName,
      month: currentMonth,
      amount: finalAmount,
      status,
      method: status === 'paid' ? method : 'none',
      remarks: status === 'paid' ? remarks : '',
      currentTotalPaid: memberObj?.totalPaid || 0,
      monthlyAmount: monthlyAmount
    });
    setShowIntake(false);
    setSelectedMember(null);
  };

  const renderPaymentRow = ({ item, index }) => {
    const payment = payments.find(p => p.memberId === item.id);
    const isPaid = payment?.status === 'paid';
    const calculatedAmount = calculateMemberAmount(item);
    const isLifted = item.hasTakenChit && item.chitTakenMonth < currentMonth;

    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20 * (index + 1), 0]
      }) }] }]}>
        <View style={styles.cardContent}>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name.toUpperCase()}</Text>
              {isLifted && <MaterialCommunityIcons name="trending-up" size={16} color="#EF4444" />}
            </View>
            
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>₹ {calculatedAmount.toLocaleString()}</Text>
              {dividend > 0 && !isLifted && <Text style={styles.dividendTag}>- ₹{dividend.toLocaleString()} DIVIDEND</Text>}
              {isLifted && <Text style={styles.interestTag}>+ ₹{(chitValue * 0.01).toLocaleString()} INTEREST</Text>}
            </View>

            {isPaid ? (
              <Text style={styles.methodTag}>{(payment.method || 'CASH').toUpperCase()} {payment.remarks ? `• ${payment.remarks}` : ''}</Text>
            ) : (
              <Pressable onPress={() => handleCall(item.phone)} style={styles.callLink}>
                <MaterialCommunityIcons name="phone" size={12} color="#3B82F6" />
                <Text style={styles.callText}>FOLLOW UP NOW</Text>
              </Pressable>
            )}
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.actionBtn, 
              isPaid ? styles.actionBtnPaid : styles.actionBtnUnpaid,
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => openIntake(item)}
          >
            <MaterialCommunityIcons 
              name={isPaid ? "check-circle" : "circle-outline"} 
              size={20} 
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
      <View style={[styles.topBlocker, { height: safeTop }]} pointerEvents="none" />
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={[styles.header, { paddingTop: safeTop + 20 }]}>
        <View style={styles.headerTop}>
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </Pressable>
          
          <View style={styles.headerContent}>
            <Text style={styles.step}>COLLECTION FEED</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.titleHeavy}>{(groupName || 'Circle').split(' ')[0]}</Text>
              <Text style={styles.titleLight}>{(groupName || '').split(' ').slice(1).join(' ') || 'Ledger'}</Text>
            </View>
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
              <Text style={styles.summaryLabel}>TOTAL COLLECTED</Text>
              <Text style={styles.summaryValue}>₹ {summary.totalCollected.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>PAID RATIO</Text>
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

      <Modal visible={showIntake} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>CONFIRM COLLECTION</Text>
            <Text style={styles.modalName}>{(selectedMember?.name || 'Member').toUpperCase()}</Text>
            
            <View style={styles.methodGrid}>
              <Pressable style={[styles.methodBtn, method === 'cash' && styles.methodBtnActive]} onPress={() => setMethod('cash')}>
                <MaterialCommunityIcons name="cash" size={24} color={method === 'cash' ? colors.white : colors.text} />
                <Text style={[styles.methodText, method === 'cash' && styles.methodTextActive]}>CASH</Text>
              </Pressable>
              <Pressable style={[styles.methodBtn, method === 'upi' && styles.methodBtnActive]} onPress={() => setMethod('upi')}>
                <MaterialCommunityIcons name="cellphone-check" size={24} color={method === 'upi' ? colors.white : colors.text} />
                <Text style={[styles.methodText, method === 'upi' && styles.methodTextActive]}>UPI</Text>
              </Pressable>
            </View>

            <View style={styles.remarksWrap}>
              <Text style={styles.label}>AUDIT REMARKS</Text>
              <TextInput style={styles.remarksInput} placeholder="e.g. GPay or PhonePe" placeholderTextColor="#9CA3AF" value={remarks} onChangeText={setRemarks} />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowIntake(false)}><Text style={styles.cancelText}>CANCEL</Text></Pressable>
              <Pressable style={styles.confirmBtn} onPress={() => handleConfirm()}><Text style={styles.confirmText}>CONFIRM PAID</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
  header: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg, zIndex: 10000 },
  headerTop: { marginBottom: spacing.lg },
  headerContent: { marginTop: spacing.sm },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: radius.xs, padding: spacing.xs, borderWidth: 1, borderColor: '#F3F4F6' },
  monthArrow: { padding: 10 },
  monthText: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  summaryBox: { flexDirection: 'row', backgroundColor: colors.text, borderRadius: radius.xs, padding: spacing.lg, marginBottom: spacing.xl, justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  summaryValue: { fontSize: normalize(20), fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
  summaryDivider: { width: 1, height: 24, backgroundColor: '#374151' },
  list: { paddingHorizontal: spacing.xl },
  card: { 
    backgroundColor: '#fff', 
    padding: spacing.lg, 
    borderRadius: radius.xs, 
    marginBottom: spacing.md, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }
    })
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: normalize(16), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  amountContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  amount: { fontSize: normalize(14), fontWeight: '800', color: '#6B7280' },
  dividendTag: { fontSize: normalize(10), fontWeight: '800', color: '#10B981', letterSpacing: 0.5 },
  interestTag: { fontSize: normalize(10), fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
  callLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#F9FAFB', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: radius.full,
    alignSelf: 'flex-start'
  },
  callText: { fontSize: normalize(10), fontWeight: '900', color: '#3B82F6', letterSpacing: 1 },
  methodTag: { 
    fontSize: normalize(9), 
    fontWeight: '900', 
    color: '#10B981', 
    letterSpacing: 0.5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  actionBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderRadius: radius.xs, 
    alignItems: 'center', 
    justifyContent: 'center',
    minWidth: 110,
    borderWidth: 1
  },
  actionBtnPaid: { backgroundColor: colors.text, borderColor: colors.text },
  actionBtnUnpaid: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  actionText: { fontSize: normalize(10), fontWeight: '900', letterSpacing: 1.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: spacing.xl },
  modalTitle: { fontSize: normalize(11), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2.5, marginBottom: 8, textAlign: 'center' },
  modalName: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1.5, marginBottom: spacing.xxl, textAlign: 'center' },
  methodGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  methodBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  methodText: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  methodTextActive: { color: colors.white },
  remarksWrap: { marginBottom: spacing.xxl },
  label: { fontSize: normalize(9), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8 },
  remarksInput: { fontSize: normalize(18), fontWeight: '700', color: colors.text, borderBottomWidth: 2, borderBottomColor: '#F3F4F6', paddingVertical: 12 },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 18, alignItems: 'center' },
  cancelText: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5 },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', paddingVertical: 18, borderRadius: radius.xs, alignItems: 'center' },
  confirmText: { fontSize: normalize(12), fontWeight: '900', color: colors.white, letterSpacing: 1.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(18), fontWeight: '900', color: '#9CA3AF', marginTop: 16 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
