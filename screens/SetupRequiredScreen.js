import { StyleSheet, Text, View, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize } from '../utils/theme';

const STEPS = [
  'Create a free Firebase project and enable Cloud Firestore.',
  'Copy .env.example to .env in the project folder.',
  'Paste your own Firebase web app values into .env.',
  'Restart the app with: npx expo start --clear',
];

// Shown instead of the app when no Firebase keys were provided, which is the normal first run
// for anyone who clones this open source project.
export default function SetupRequiredScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="key-variant" size={normalize(34)} color={colors.white} />
      </View>
      <Text style={styles.eyebrow}>ONE LAST STEP</Text>
      <Text style={styles.title}>Add your Firebase keys</Text>
      <Text style={styles.body}>
        ChitFlow stores its data in your own Firebase project. No keys are included with the source code, so you need to add yours before the app can run.
      </Text>
      <View style={styles.card}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.button} onPress={() => Linking.openURL('https://github.com/shankumar7/ChitFlow#getting-started').catch(() => {})}>
        <Text style={styles.buttonText}>OPEN SETUP GUIDE</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  iconWrap: { width: normalize(72), height: normalize(72), borderRadius: radius.lg, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontSize: normalize(10), fontWeight: '900', letterSpacing: 2, color: colors.textLight },
  title: { fontSize: normalize(26), fontWeight: '900', color: colors.text, marginTop: 6, textAlign: 'center' },
  body: { fontSize: normalize(14), color: colors.textMuted, textAlign: 'center', lineHeight: normalize(21), marginTop: spacing.md },
  card: { alignSelf: 'stretch', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl, gap: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.white, fontWeight: '900', fontSize: 12 },
  stepText: { flex: 1, fontSize: normalize(13), color: colors.text, fontWeight: '600', lineHeight: normalize(19) },
  button: { marginTop: spacing.xl, backgroundColor: colors.text, paddingVertical: 16, paddingHorizontal: spacing.xl, borderRadius: radius.xs },
  buttonText: { color: colors.white, fontSize: normalize(12), fontWeight: '900', letterSpacing: 2 },
});
