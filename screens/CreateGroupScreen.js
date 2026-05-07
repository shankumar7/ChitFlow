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
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

export default function CreateGroupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Smart fallback for status bar height
  const safeTop = insets.top || StatusBar.currentHeight || 30;

  const handleCreate = async () => {
    if (!name || !monthlyAmount || !duration) {
      Alert.alert("Incomplete", "Please define all group parameters.");
      return;
    }

    setLoading(true);
    try {
      await createGroup({
        name,
        monthlyAmount: parseFloat(monthlyAmount),
        duration: parseInt(duration),
        status: 'active',
        createdAt: new Date()
      });
      Alert.alert("Initialized", "The Chitti circle has been successfully established.");
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
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.verticalSpine} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
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

      {/* THE ABSOLUTE SHIELD */}
      <View style={[styles.topBlocker, { height: safeTop }]} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white, 
    zIndex: 9999, 
  },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { marginBottom: spacing.xl },
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
  input: { 
    fontSize: normalize(16), 
    fontWeight: '700', 
    color: colors.text, 
    borderBottomWidth: 2, 
    borderBottomColor: '#F3F4F6', 
    paddingVertical: 12,
    letterSpacing: 0.5
  },
  submitBtn: { 
    backgroundColor: colors.text, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12, 
    paddingVertical: normalize(18), 
    borderRadius: radius.xs,
    marginTop: spacing.xl,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }
    })
  },
  submitBtnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.white, fontSize: normalize(12), fontWeight: '900', letterSpacing: 2 }
});
