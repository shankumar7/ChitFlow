import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembers } from '../services/memberService';
import { recordLifting, subscribeLiftingsByGroup } from '../services/liftingService';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';
import { getCurrentMonthNumber, getMonthName } from '../utils/date';

export default function AuctionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, monthlyAmount, duration, commissionPercentage = 5 } = route.params;

  const [members, setMembers] = useState([]);
  const [liftings, setLiftings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthNumber());
  const [bidAmount, setBidAmount] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const safeTop = insets.top || StatusBar.currentHeight || 30;

  const monthlyAmt = parseFloat(monthlyAmount || 0);
  const dur = parseInt(duration || 0);
  const chitValue = useMemo(() => monthlyAmt * dur, [monthlyAmt, dur]);

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

    const unsubLiftings = subscribeLiftingsByGroup(groupId, (data) => {
      setLiftings(data);
    });

    return () => {
      unsubMembers();
      unsubLiftings();
    };
  }, [groupId]);

  const eligibleMembers = useMemo(() => {
    return members.filter(m => !m.hasTakenChit);
  }, [members]);

  const currentLifting = useMemo(() => {
    return liftings.find(l => l.monthNumber === currentMonth);
  }, [liftings, currentMonth]);

  const calculations = useMemo(() => {
    if (!bidAmount || isNaN(bidAmount) || !chitValue || members.length === 0) return null;
    const bid = parseFloat(bidAmount);
    const totalDiscount = chitValue - bid;
    const commission = parseFloat(commissionPercentage || 5);
    const organizerCommission = (chitValue * commission) / 100;
    const totalDividend = totalDiscount - organizerCommission;
    const dividendPerMember = totalDividend / members.length;

    return {
      bid,
      totalDiscount,
      organizerCommission,
      totalDividend,
      dividendPerMember
    };
  }, [bidAmount, chitValue, commissionPercentage, members.length]);

  const handleRecord = async () => {
    if (!selectedMember || !calculations) {
      Alert.alert("Error", "Please select a member and enter a valid bid amount.");
      return;
    }

    try {
      setLoading(true);
      await recordLifting({
        groupId,
        memberId: selectedMember.id,
        monthNumber: currentMonth,
        bidAmount: calculations.bid,
        chitValue,
        totalMembers: members.length,
        commissionPercentage,
        memberName: selectedMember.name,
        groupName
      });
      Alert.alert("Success", "Lifting recorded successfully.");
      setShowConfirm(false);
      setSelectedMember(null);
      setBidAmount('');
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      let next = prev + delta;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBlocker, { height: safeTop }]} pointerEvents="none" />
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>AUCTION / BIDDING</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Monthly</Text>
            <Text style={styles.titleLight}>Lift</Text>
          </View>
          <Text style={styles.groupContext}>{(groupName || 'GROUP').toUpperCase()}</Text>
        </View>

        <View style={styles.monthPicker}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.monthText}>{getMonthName(currentMonth).toUpperCase()} {new Date().getFullYear()}</Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </Pressable>
        </View>

        {currentLifting ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="trophy-outline" size={32} color="#F59E0B" />
              <View style={styles.resultHeaderInfo}>
                <Text style={styles.resultLabel}>PRIZED SUBSCRIBER</Text>
                <Text style={styles.resultName}>{currentLifting.memberName.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TAKEN AMOUNT</Text>
                <Text style={styles.statValue}>₹ {currentLifting.bidAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DIVIDEND / MEM</Text>
                <Text style={styles.statValue}>₹ {currentLifting.dividendPerMember.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>COMMISSION ({commissionPercentage}%)</Text>
                <Text style={styles.statValue}>₹ {currentLifting.organizerCommission.toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL DISCOUNT</Text>
                <Text style={styles.statValue}>₹ {currentLifting.totalDiscount.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.auctionForm}>
            <Text style={styles.formTitle}>NEW BID FOR {getMonthName(currentMonth).toUpperCase()}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WINNING BID AMOUNT (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 420000"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
              />
              <Text style={styles.inputHint}>Total Chit Value: ₹ {chitValue ? chitValue.toLocaleString() : 'N/A'}</Text>
            </View>

            {calculations && (
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Total Discount</Text>
                  <Text style={styles.previewValue}>₹ {calculations.totalDiscount.toLocaleString()}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Organizer Comm. ({commissionPercentage}%)</Text>
                  <Text style={styles.previewValue}>₹ {calculations.organizerCommission.toLocaleString()}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabelBold}>Dividend / Member</Text>
                  <Text style={styles.previewValueBold}>₹ {calculations.dividendPerMember.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <Text style={styles.label}>SELECT LIFTING MEMBER</Text>
            {eligibleMembers.map((member) => (
              <Pressable
                key={member.id}
                style={[styles.memberSelect, selectedMember?.id === member.id && styles.memberSelectActive]}
                onPress={() => setSelectedMember(member)}
              >
                <Text style={[styles.memberNameText, selectedMember?.id === member.id && styles.memberNameTextActive]}>
                  {member.name.toUpperCase()}
                </Text>
                {selectedMember?.id === member.id && <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} />}
              </Pressable>
            ))}

            <Pressable
              style={[styles.submitBtn, (!selectedMember || !calculations) && styles.submitBtnDisabled]}
              onPress={() => setShowConfirm(true)}
              disabled={!selectedMember || !calculations}
            >
              <Text style={styles.submitBtnText}>CONFIRM LIFTING</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CONFIRM AUCTION WINNER</Text>
            <View style={styles.confirmDetails}>
              <Text style={styles.confirmName}>{selectedMember?.name.toUpperCase()}</Text>
              <Text style={styles.confirmAmount}>₹ {calculations?.bid.toLocaleString()}</Text>
              <Text style={styles.confirmMonth}>{getMonthName(currentMonth).toUpperCase()} COLLECTION</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleRecord}>
                <Text style={styles.confirmText}>APPROVE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
  header: { marginBottom: spacing.xl, zIndex: 10000 },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  groupContext: { fontSize: normalize(12), fontWeight: '800', color: '#3B82F6', marginTop: 4, letterSpacing: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: radius.xs, padding: spacing.xs, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: spacing.xl },
  monthArrow: { padding: 10 },
  monthText: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  resultCard: { backgroundColor: colors.text, borderRadius: radius.xs, padding: spacing.lg, marginBottom: spacing.xl },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  resultHeaderInfo: { marginLeft: 16 },
  resultLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2 },
  resultName: { fontSize: normalize(20), fontWeight: '900', color: colors.white, letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statBox: { flex: 1, backgroundColor: '#1F2937', padding: 12, borderRadius: 4 },
  statLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', marginBottom: 4 },
  statValue: { fontSize: normalize(12), fontWeight: '900', color: colors.white },
  auctionForm: { marginTop: spacing.md },
  formTitle: { fontSize: normalize(10), fontWeight: '900', color: colors.text, letterSpacing: 1, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.xl },
  label: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  input: { fontSize: normalize(24), fontWeight: '900', color: colors.text, borderBottomWidth: 2, borderBottomColor: '#F3F4F6', paddingVertical: 12 },
  inputHint: { fontSize: normalize(10), color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
  previewBox: { backgroundColor: '#F9FAFB', padding: spacing.md, borderRadius: radius.xs, marginBottom: spacing.xl, borderWidth: 1, borderColor: '#F3F4F6' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontSize: normalize(10), color: '#6B7280', fontWeight: '600' },
  previewValue: { fontSize: normalize(10), color: colors.text, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  previewLabelBold: { fontSize: normalize(11), color: colors.text, fontWeight: '900' },
  previewValueBold: { fontSize: normalize(14), color: '#10B981', fontWeight: '900' },
  memberSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F9FAFB', borderRadius: radius.xs, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  memberSelectActive: { backgroundColor: colors.text, borderColor: colors.text },
  memberNameText: { fontSize: normalize(12), fontWeight: '900', color: colors.text },
  memberNameTextActive: { color: colors.white },
  submitBtn: { backgroundColor: colors.text, paddingVertical: 20, borderRadius: radius.xs, alignItems: 'center', marginTop: spacing.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.white, fontSize: normalize(12), fontWeight: '900', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.white, borderRadius: radius.xs, padding: spacing.xl },
  modalTitle: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', textAlign: 'center', letterSpacing: 2, marginBottom: spacing.xl },
  confirmDetails: { alignItems: 'center', marginBottom: spacing.xxl },
  confirmName: { fontSize: normalize(24), fontWeight: '900', color: colors.text, marginBottom: 8 },
  confirmAmount: { fontSize: normalize(32), fontWeight: '900', color: '#10B981', marginBottom: 8 },
  confirmMonth: { fontSize: normalize(12), fontWeight: '800', color: '#3B82F6' },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF' },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: radius.xs, alignItems: 'center' },
  confirmText: { fontSize: normalize(12), fontWeight: '900', color: colors.white }
});
