import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Pressable, 
  Alert, 
  ScrollView, 
  Animated, 
  Platform, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createGroup } from '../services/groupService';
import { colors, radius, spacing, normalize, layout, window } from '../utils/theme';

export default function CreateGroupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ name: '', monthlyAmount: '', duration: '' });
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: useNative,
      })
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.monthlyAmount || !form.duration) {
      Alert.alert('Missing Information', 'Please provide a group name, monthly contribution, and duration.');
      return;
    }
    setLoading(true);
    try {
      await createGroup({
        name: form.name,
        monthlyAmount: Number(form.monthlyAmount),
        duration: Number(form.duration),
      });
      Alert.alert("Success", "Group created successfully.");
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to create group. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.verticalSpine} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.step}>NEW ARCHITECTURE</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.titleHeavy}>Create</Text>
              <Text style={styles.titleLight}>Group</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>IDENTIFIER / NAME</Text>
              <TextInput 
                style={styles.input} 
                placeholder="SAVINGS ALPHA" 
                placeholderTextColor="#D1D5DB"
                value={form.name} 
                onChangeText={(v) => setForm({ ...form, name: v })} 
              />
              <View style={styles.underline} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>MONTHLY CONTRIBUTION (₹)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="5000" 
                placeholderTextColor="#D1D5DB"
                keyboardType="numeric"
                value={form.monthlyAmount} 
                onChangeText={(v) => setForm({ ...form, monthlyAmount: v })} 
              />
              <View style={styles.underline} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>DURATION (MONTHS)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="12" 
                placeholderTextColor="#D1D5DB"
                keyboardType="numeric"
                value={form.duration} 
                onChangeText={(v) => setForm({ ...form, duration: v })} 
              />
              <View style={styles.underline} />
            </View>

            <View style={styles.bottomSection}>
              <Pressable 
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]} 
                onPress={handleSubmit} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>INITIALIZE GROUP</Text>
                    <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.note}>This will create a new ledger entry.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, ...layout.container },
  header: { marginBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  form: { marginVertical: spacing.xl },
  field: { marginBottom: spacing.xxl },
  label: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  input: { 
    fontSize: normalize(28), 
    fontWeight: '900', 
    color: colors.text, 
    paddingVertical: spacing.sm, 
    letterSpacing: 1,
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  underline: { height: 3, backgroundColor: colors.text, width: normalize(40) },
  bottomSection: { marginTop: spacing.xxl },
  button: { 
    backgroundColor: colors.text, 
    paddingVertical: normalize(20), 
    borderRadius: radius.xs, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }
    })
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buttonText: { color: colors.white, fontSize: normalize(14), fontWeight: '900', letterSpacing: 2 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.6 },
  note: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 16, textAlign: 'center' }
});
