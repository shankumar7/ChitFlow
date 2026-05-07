import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, TextInput, Alert, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribePaymentsByGroupAndMonth, updatePaymentStatus } from '../services/paymentService';
import { colors, radius, spacing, elevation, normalize } from '../utils/theme';

export default function MemberPaymentRow({ member, groupId, month }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = subscribePaymentsByGroupAndMonth(
      groupId,
      month,
      (payments) => {
        const myPayment = payments.find(p => p.memberId === member.id);
        setPayment(myPayment || null);
        setAmount(myPayment?.amount?.toString() || '');
        setLoading(false);
      },
      (err) => console.error(err)
    );
    return unsubscribe;
  }, [groupId, month, member.id]);

  const animatePress = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      tension: 100,
      friction: 5,
    }).start();
  };

  const toggleStatus = async () => {
    if (saving) return;
    setSaving(true);
    animatePress(0.95);
    try {
      const newStatus = payment?.status === 'paid' ? 'pending' : 'paid';
      const finalAmount = Number(amount) || 0;
      
      if (newStatus === 'paid' && finalAmount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount.');
        setSaving(false);
        animatePress(1);
        return;
      }

      await updatePaymentStatus(groupId, member.id, month, {
        status: newStatus,
        amount: finalAmount,
        memberName: member.name,
        paymentDate: new Date().toISOString(),
        paymentMode: 'cash'
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setSaving(false);
      animatePress(1);
    }
  };

  const isPaid = payment?.status === 'paid';

  return (
    <Animated.View style={[styles.card, isPaid && styles.paidCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.topRow}>
        <View style={styles.memberMeta}>
          <View style={[styles.avatar, isPaid && styles.paidAvatar]}>
            <Text style={[styles.avatarText, isPaid && styles.paidAvatarText]}>{member.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.statusLabel}>{isPaid ? 'Payment Recorded' : 'Payment Expected'}</Text>
          </View>
        </View>
        <Pressable 
          onPress={toggleStatus} 
          style={({ pressed }) => [
            styles.statusBtn, 
            isPaid ? styles.paidBtn : styles.pendingBtn,
            pressed && { opacity: 0.8 }
          ]}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color={isPaid ? colors.white : colors.primary} /> : (
            <>
              <MaterialCommunityIcons name={isPaid ? "check-decagram" : "plus-circle-outline"} size={normalize(20)} color={isPaid ? colors.white : colors.primary} />
              <Text style={[styles.btnText, isPaid ? styles.paidBtnText : styles.pendingBtnText]}>{isPaid ? 'PAID' : 'COLLECT'}</Text>
            </>
          )}
        </Pressable>
      </View>
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <View style={styles.amountContainer}>
          <Text style={styles.fieldLabel}>CONTRIBUTION AMOUNT</Text>
          <View style={[styles.inputBox, isPaid && styles.disabledInput]}>
            <Text style={styles.currency}>₹</Text>
            <TextInput 
              style={styles.input} 
              value={amount} 
              onChangeText={setAmount} 
              placeholder="0.00" 
              keyboardType="numeric" 
              editable={!isPaid && !saving} 
            />
          </View>
        </View>
        {isPaid && (
          <View style={styles.modeTag}>
            <MaterialCommunityIcons name="cash" size={14} color={colors.secondary} />
            <Text style={styles.modeText}>CASH</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.border, ...elevation.sm },
  paidCard: { borderColor: colors.secondary, backgroundColor: '#F0FDF4' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  memberMeta: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: normalize(44), height: normalize(44), borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  paidAvatar: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  avatarText: { fontSize: normalize(18), fontWeight: '800', color: colors.textMuted },
  paidAvatarText: { color: colors.secondary },
  name: { fontSize: normalize(16), fontWeight: '900', color: colors.text },
  statusLabel: { fontSize: normalize(11), color: colors.textLight, marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(16), paddingVertical: normalize(10), borderRadius: radius.md, gap: 8 },
  paidBtn: { backgroundColor: colors.secondary },
  pendingBtn: { backgroundColor: colors.primarySoft },
  btnText: { fontSize: normalize(12), fontWeight: '900', letterSpacing: 1 },
  paidBtnText: { color: colors.white },
  pendingBtnText: { color: colors.primary },
  divider: { height: 1.5, backgroundColor: colors.border, marginBottom: spacing.md, opacity: 0.5 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  amountContainer: { flex: 1 },
  fieldLabel: { fontSize: normalize(10), fontWeight: '800', color: colors.textLight, letterSpacing: 1, marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderSize: 1, borderColor: colors.border },
  disabledInput: { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: 'transparent' },
  currency: { fontSize: normalize(18), fontWeight: '900', color: colors.text, marginRight: 4 },
  input: { fontSize: normalize(18), fontWeight: '900', color: colors.text, flex: 1, padding: 0 },
  modeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  modeText: { fontSize: normalize(10), fontWeight: '800', color: colors.secondary, letterSpacing: 0.5 },
});

