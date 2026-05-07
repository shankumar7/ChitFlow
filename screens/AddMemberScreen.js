import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { createMember } from '../services/memberService';
import { colors, radius, spacing, normalize } from '../utils/theme';

export default function AddMemberScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await createMember({
        groupId,
        name: form.name,
        phone: form.phone,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.field}>
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. John Doe" 
          value={form.name} 
          onChangeText={(v) => setForm({ ...form, name: v })} 
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput 
          style={styles.input} 
          placeholder="+91 9876543210" 
          keyboardType="phone-pad"
          value={form.phone} 
          onChangeText={(v) => setForm({ ...form, phone: v })} 
        />
      </View>

      <Pressable 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleSubmit} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'ADDING...' : 'ADD MEMBER'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
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
