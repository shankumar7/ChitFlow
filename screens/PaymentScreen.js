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
            <Text style={styles.name}>{item.name.toUpperCase()}</Text>
            
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>₹ {calculatedAmount.toLocaleString()}</Text>
              {dividend > 0 && !isLifted && <Text style={styles.dividendTag}>- ₹{dividend.toLocaleString()} DIVIDEND</Text>}
              {isLifted && <Text style={styles.interestTag}>+ INTEREST</Text>}
            </View>

            <View style={styles.actionRow}>
              {isPaid ? (
                <View style={styles.methodBadge}>
                  <MaterialCommunityIcons name="wallet-outline" size={12} color="#10B981" />
                  <Text style={styles.methodText}>{(payment.method || 'CASH').toUpperCase()}</Text>
                </View>
              ) : (
                <Pressable onPress={() => handleCall(item.phone)} style={styles.callLink}>
                  <MaterialCommunityIcons name="phone" size={14} color="#3B82F6" />
                  <Text style={styles.callText}>FOLLOW UP</Text>
                </Pressable>
              )}
              {isLifted && (
                <View style={styles.liftedBadge}>
                  <MaterialCommunityIcons name="trending-up" size={12} color="#EF4444" />
                  <Text style={styles.liftedText}>LIFTED</Text>
                </View>
              )}
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.statusCircle, 
              isPaid ? styles.statusCirclePaid : styles.statusCirclePending,
              pressed && { scale: 0.95 }
            ]}
            onPress={() => openIntake(item)}
          >
            <MaterialCommunityIcons 
              name={isPaid ? "check" : "circle-outline"} 
              size={24} 
              color={isPaid ? colors.white : "#D1D5DB"} 
            />
            <Text style={[styles.statusSmallText, { color: isPaid ? colors.white : "#9CA3AF" }]}>
              {isPaid ? 'PAID' : 'COLLECT'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      
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
            <View style={styles.summaryItemRight}>
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

      <Modal 
        visible={showIntake} 
        transparent={true} 
        animationType="slide"
        onRequestClose={() => setShowIntake(false)}
      >
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
  header: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg, zIndex: 10000, backgroundColor: colors.white },
  headerTop: { marginBottom: spacing.lg },
  headerContent: { marginTop: spacing.sm },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  titleLight: { fontSize: normalize(32), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  amountText: { fontSize: normalize(14), fontWeight: '700', color: '#9CA3AF', marginTop: 4 },
  
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', marginHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.xs, marginBottom: spacing.xl },
  monthArrow: { padding: 8 },
  monthText: { fontSize: normalize(12), fontWeight: '900', color: colors.text, marginHorizontal: 24, letterSpacing: 1 },
  
  summaryBox: { flexDirection: 'row', backgroundColor: colors.text, padding: spacing.xl, borderRadius: radius.xs, marginBottom: spacing.xxl, marginHorizontal: spacing.xl, alignItems: 'center' },
  summaryItem: { flex: 1.2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.md },
  summaryLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: normalize(22), fontWeight: '900', color: colors.white },
  summaryItemRight: { flex: 0.8, alignItems: 'flex-end' },
  
  list: { paddingHorizontal: spacing.xl },
  card: { backgroundColor: '#FFFFFF', borderRadius: radius.xs, marginBottom: spacing.lg, borderWidth: 1, borderColor: '#F3F4F6' },
  cardContent: { flexDirection: 'row', padding: spacing.lg, alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: normalize(15), fontWeight: '900', color: colors.text, marginBottom: 6 },
  amountContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  amount: { fontSize: normalize(16), fontWeight: '900', color: colors.text },
  dividendTag: { fontSize: normalize(9), fontWeight: '800', color: '#10B981' },
  interestTag: { fontSize: normalize(9), fontWeight: '800', color: '#EF4444' },
  
  actionRow: { flexDirection: 'row', gap: 8 },
  callLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  callText: { fontSize: normalize(9), fontWeight: '900', color: '#3B82F6' },
  methodBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  methodText: { fontSize: normalize(9), fontWeight: '900', color: '#10B981' },
  liftedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  liftedText: { fontSize: normalize(9), fontWeight: '900', color: '#EF4444' },
  
  statusCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statusCirclePending: { backgroundColor: '#FFFFFF', borderColor: '#F3F4F6' },
  statusCirclePaid: { backgroundColor: colors.text, borderColor: colors.text },
  statusSmallText: { fontSize: normalize(8), fontWeight: '900', marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: spacing.xl },
  modalTitle: { fontSize: normalize(11), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  modalName: { fontSize: normalize(28), fontWeight: '900', color: colors.text, letterSpacing: -1, marginBottom: spacing.xxl, textAlign: 'center' },
  
  methodGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  methodBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  methodText: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  methodTextActive: { color: colors.white },
  
  remarksWrap: { marginBottom: spacing.xxl },
  label: { fontSize: normalize(9), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8 },
  remarksInput: { fontSize: normalize(16), fontWeight: '700', color: colors.text, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 12 },
  
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 18, alignItems: 'center' },
  cancelText: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5 },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', paddingVertical: 18, borderRadius: radius.xs, alignItems: 'center' },
  confirmText: { fontSize: normalize(12), fontWeight: '900', color: colors.white, letterSpacing: 1.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(18), fontWeight: '900', color: '#9CA3AF', marginTop: 16 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
