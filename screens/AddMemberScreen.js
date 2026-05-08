import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Pressable, 
  Alert, 
  Animated, 
  Platform, 
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createMember, updateMember } from '../services/memberService';
import { colors, radius, spacing, normalize, layout, window } from '../utils/theme';

export default function AddMemberScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, member } = route.params;
  const isEditing = !!member;
  
  const [form, setForm] = useState({ 
    name: member?.name || '', 
    phone: member?.phone || '' 
  });
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
    if (!form.name) {
      Alert.alert('Incomplete Entry', 'Please provide at least the participant name.');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateMember(member.id, {
          name: form.name,
          phone: form.phone,
        });
        Alert.alert("Synchronized", "Member profile updated successfully.");
      } else {
        await createMember({
          groupId,
          name: form.name,
          phone: form.phone,
        });
        Alert.alert("Success", "New member added to the architecture.");
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to synchronize member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <Pressable 
              onPress={() => navigation.goBack()} 
              style={styles.backBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.step}>{isEditing ? 'EDIT PROFILE' : 'MEMBER INDUCTION'}</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.titleHeavy}>{isEditing ? 'Update' : 'Add'}</Text>
              <Text style={styles.titleLight}>Member</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>FULL IDENTITY NAME</Text>
              <TextInput 
                style={styles.input} 
                placeholder="JOHN DOE" 
                placeholderTextColor="#D1D5DB"
                value={form.name} 
                onChangeText={(v) => setForm({ ...form, name: v })} 
              />
              <View style={styles.underline} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONTACT NUMBER</Text>
              <TextInput 
                style={styles.input} 
                placeholder="+91 90000 00000" 
                placeholderTextColor="#D1D5DB"
                keyboardType="phone-pad"
                value={form.phone} 
                onChangeText={(v) => setForm({ ...form, phone: v })} 
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
                    <Text style={styles.buttonText}>{isEditing ? 'SAVE CHANGES' : 'CONFIRM MEMBER'}</Text>
                    <MaterialCommunityIcons name={isEditing ? "account-check" : "account-plus"} size={20} color={colors.white} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.note}>
                {isEditing ? 'Updates will be synchronized across the ledger.' : 'This participant will be added to the active group.'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.topBlocker, { height: insets.top || 30 }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
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
