import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { createGroup } from '../services/groupService';
import { colors, radius, spacing, normalize } from '../utils/theme';

export default function CreateGroupScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', monthlyAmount: '', duration: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.monthlyAmount || !form.duration) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await createGroup({
        name: form.name,
        monthlyAmount: Number(form.monthlyAmount),
        duration: Number(form.duration),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>GROUP NAME</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Monthly Savings A" 
          value={form.name} 
          onChangeText={(v) => setForm({ ...form, name: v })} 
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>MONTHLY CONTRIBUTION (₹)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="5000" 
          keyboardType="numeric"
          value={form.monthlyAmount} 
          onChangeText={(v) => setForm({ ...form, monthlyAmount: v })} 
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>DURATION (MONTHS)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="12" 
          keyboardType="numeric"
          value={form.duration} 
          onChangeText={(v) => setForm({ ...form, duration: v })} 
        />
      </View>

      <Pressable 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleSubmit} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'CREATING...' : 'CREATE GROUP'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  field: { marginBottom: spacing.xl },
  label: { fontSize: normalize(12), fontWeight: '800', color: colors.textLight, letterSpacing: 1, marginBottom: 8 },
  input: { 
    backgroundColor: colors.white, 
    borderRadius: radius.md, 
    padding: spacing.md, 
    fontSize: normalize(16), 
    borderWidth: 1, 
    borderColor: colors.border,
    color: colors.text
  },
  button: { 
    backgroundColor: colors.primary, 
    borderRadius: radius.lg, 
    padding: spacing.md, 
    alignItems: 'center', 
    marginTop: spacing.xl 
  },
  buttonText: { color: colors.white, fontWeight: '900', fontSize: normalize(16), letterSpacing: 1 }
});
