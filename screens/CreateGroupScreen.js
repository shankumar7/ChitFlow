import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createGroup } from '../services/groupService';
import { createBatchMembers } from '../services/memberService';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

export default function CreateGroupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('5');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [syncMembers, setSyncMembers] = useState(true);
  const chitValue = (parseFloat(monthlyAmount || 0) * parseInt(duration || 0)) || 0;
  const safeTop = insets.top || StatusBar.currentHeight || 30;

  const handleCreate = async () => {
    if (!name || !monthlyAmount || !duration || !startDate) {
      Alert.alert("Incomplete", "Please define all group parameters, including the start date.");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      Alert.alert("Invalid Date", "Please use the format YYYY-MM-DD (e.g. 2026-05-01)");
      return;
    }

    setLoading(true);
    try {
      const groupDoc = await createGroup({
        name,
        monthlyAmount: parseFloat(monthlyAmount),
        duration: parseInt(duration),
        commissionPercentage: parseFloat(commissionPercentage),
        chitValue,
        startDate,
        status: 'active',
        createdAt: new Date(),
        syncMembersToDuration: syncMembers
      });

      if (syncMembers) {
        await createBatchMembers(groupDoc.id, parseInt(duration));
      }

      Alert.alert("Initialized", "The Chitti circle and placeholders have been successfully established.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("System Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={[styles.topBlocker, { height: safeTop }]} pointerEvents="none" />
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Pressable 
              onPress={() => navigation.goBack()} 
              style={styles.backBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.step}>INITIALIZE GROUP</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.titleHeavy}>New</Text>
              <Text style={styles.titleLight}>Circle</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>IDENTIFIER / NAME</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. Monthly Savings"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>START DATE (YYYY-MM-DD)</Text>
              <TextInput 
                style={styles.input}
                placeholder="2026-05-01"
                placeholderTextColor="#9CA3AF"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MONTHLY FLOW (₹)</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. 5000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={monthlyAmount}
                onChangeText={setMonthlyAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DURATION (MONTHS)</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. 12"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            <View style={styles.dynamicsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>MATCH MEMBERS TO DURATION?</Text>
                <Text style={styles.subLabel}>Number of members will equal duration months ({duration || '0'})</Text>
              </View>
              <Pressable 
                onPress={() => setSyncMembers(!syncMembers)}
                style={[styles.toggle, syncMembers && styles.toggleActive]}
              >
                <View style={[styles.toggleCircle, syncMembers && styles.toggleCircleActive]} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ORGANIZER COMMISSION (%)</Text>
              <TextInput 
                style={styles.input}
                placeholder="5"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={commissionPercentage}
                onChangeText={setCommissionPercentage}
              />
            </View>

            <View style={styles.previewBox}>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>ESTIMATED CHIT VALUE</Text>
                <Text style={styles.previewValue}>₹ {chitValue.toLocaleString()}</Text>
              </View>
              {syncMembers && duration && (
                <View style={[styles.previewItem, { marginTop: 12 }]}>
                  <Text style={styles.previewLabel}>REQUIRED MEMBERS</Text>
                  <Text style={styles.previewValue}>{duration} PARTICIPANTS</Text>
                </View>
              )}
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.submitBtn, 
                pressed && styles.submitBtnPressed,
                loading && styles.submitBtnDisabled
              ]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>ESTABLISH CIRCLE</Text>
                  <MaterialCommunityIcons name="check-all" size={20} color={colors.white} />
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
  header: { marginBottom: spacing.xl, zIndex: 10000 },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  titleLight: { fontSize: normalize(32), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  form: { marginTop: spacing.lg },
  inputGroup: { marginBottom: spacing.xl },
  label: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  subLabel: { fontSize: normalize(9), color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
  input: { fontSize: normalize(16), fontWeight: '700', color: colors.text, borderBottomWidth: 2, borderBottomColor: '#F3F4F6', paddingVertical: 12, letterSpacing: 0.5 },
  dynamicsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: radius.xs, marginBottom: spacing.xl, borderWidth: 1, borderColor: '#F3F4F6' },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', padding: 2 },
  toggleActive: { backgroundColor: colors.text },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleCircleActive: { transform: [{ translateX: 20 }] },
  submitBtn: { backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: normalize(18), borderRadius: radius.xs, marginTop: spacing.xl },
  submitBtnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.white, fontSize: normalize(12), fontWeight: '900', letterSpacing: 2 },
  previewBox: { backgroundColor: '#F9FAFB', padding: spacing.md, borderRadius: radius.xs, marginBottom: spacing.xl, borderLeftWidth: 4, borderLeftColor: colors.text },
  previewItem: { },
  previewLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  previewValue: { fontSize: normalize(16), fontWeight: '900', color: colors.text, marginTop: 4 }
});
