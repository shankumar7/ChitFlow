import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, normalize } from '../utils/theme';

export default function EmptyState({ title, subtitle, icon = 'layers-off-outline' }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={normalize(32)} color={colors.text} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  iconCircle: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(8),
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: {
    fontSize: normalize(14),
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: normalize(11),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: normalize(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
