import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, normalize, elevation } from '../utils/theme';

export default function SummaryCard({ summary }) {
  const collectionRate = summary.totalMembers > 0 
    ? Math.round((summary.paidCount / summary.totalMembers) * 100) 
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>MONTHLY OVERVIEW</Text>
          <Text style={styles.title}>Collection Hub</Text>
        </View>
        <View style={styles.rateContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.rateBadge}
          >
            <Text style={styles.rateValue}>{collectionRate}%</Text>
          </LinearGradient>
          <Text style={styles.rateLabel}>COLLECTED</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Received</Text>
          <Text style={styles.metricValue}>₹{summary.totalCollected.toLocaleString()}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Remaining Due</Text>
          <Text style={[styles.metricValue, { color: colors.accent }]}>
            ₹{(summary.totalMembers * summary.monthlyAmount - summary.totalCollected).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${collectionRate}%` }]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressSub}>{summary.paidCount} of {summary.totalMembers} Members Paid</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  titleBlock: { flex: 1 },
  eyebrow: { color: colors.textLight, fontSize: normalize(10), fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontSize: normalize(22), fontWeight: '900', color: colors.text, marginTop: 4 },
  rateContainer: { alignItems: 'center' },
  rateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rateValue: { fontSize: normalize(18), fontWeight: '900', color: colors.white },
  rateLabel: { fontSize: normalize(9), fontWeight: '800', color: colors.textLight, letterSpacing: 1, marginTop: 4 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radius.lg },
  metricItem: { flex: 1 },
  metricLabel: { fontSize: normalize(11), color: colors.textMuted, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: normalize(19), fontWeight: '900', color: colors.text },
  metricDivider: { width: 1, height: 34, backgroundColor: colors.border, marginHorizontal: spacing.md },
  progressContainer: { marginTop: spacing.sm },
  progressBarBg: { height: normalize(12), backgroundColor: 'rgba(79, 70, 229, 0.08)', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  progressSub: { fontSize: normalize(12), color: colors.textMuted, fontWeight: '600' },
});

