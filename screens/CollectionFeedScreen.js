import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Animated, 
  Platform, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeGroups } from '../services/groupService';
import { subscribeAllMembers } from '../services/memberService';
import { subscribeAllPaymentsByMonth } from '../services/paymentService';
import { getCurrentMonthNumber, getMonthName } from '../utils/date';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const CollectionCard = ({ group, members, payments, onPress, opacity, index }) => {
  const groupMembers = members.filter(m => m.groupId === group.id);
  const groupPayments = payments.filter(p => p.groupId === group.id);
  const totalMembers = groupMembers.length;
  const paidCount = groupPayments.length;
  const progress = totalMembers > 0 ? paidCount / totalMembers : 0;
  const pendingCount = totalMembers - paidCount;

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY: opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0]
    }) }] }]}>
      <Pressable onPress={() => onPress(group)} style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={styles.groupIcon}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color={pendingCount > 0 ? "#3B82F6" : "#10B981"} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{(group?.name || 'GROUP').toUpperCase()}</Text>
            <Text style={styles.groupSub}>{paidCount}/{totalMembers} COLLECTED</Text>
          </View>
          <View style={[styles.actionBadge, { backgroundColor: pendingCount > 0 ? colors.text : '#F0FDF4' }]}>
            <Text style={[styles.actionText, { color: pendingCount > 0 ? colors.white : '#10B981' }]}>
              {pendingCount > 0 ? 'INTAKE' : 'DONE'}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: pendingCount > 0 ? '#3B82F6' : '#10B981' }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% COMPLETE</Text>
            <Text style={[styles.pendingText, pendingCount > 0 && { color: '#EF4444' }]}>
              {pendingCount > 0 ? `${pendingCount} PENDING` : 'ALL CLEAR'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function CollectionFeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;
  const currentMonth = getCurrentMonthNumber();

  useEffect(() => {
    const unsubGroups = subscribeGroups(setGroups);
    const unsubMembers = subscribeAllMembers(setMembers);
    const unsubPayments = subscribeAllPaymentsByMonth(currentMonth, setPayments);

    setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    }, 1200);

    return () => {
      unsubGroups();
      unsubMembers();
      unsubPayments();
    };
  }, []);

  return (
    <View style={styles.container}>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.step}>TRACK FLOW</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Collection</Text>
            <Text style={styles.titleLight}>Feed</Text>
          </View>
          <Text style={styles.monthLabel}>{getMonthName(currentMonth).toUpperCase()} INTAKE</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
        ) : groups.length > 0 ? (
          groups.map((group, index) => (
            <CollectionCard 
              key={group.id} 
              group={group} 
              members={members}
              payments={payments}
              index={index}
              opacity={fadeAnim}
              onPress={(g) => navigation.navigate('Payment', { groupId: g.id, groupName: g.name, monthlyAmount: g.monthlyAmount })} 
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cash-check" size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No Active Cycles</Text>
            <Text style={styles.emptySub}>Initialize a group to start tracking collections.</Text>
          </View>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { marginBottom: spacing.xl },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  monthLabel: { fontSize: normalize(12), fontWeight: '800', color: '#3B82F6', marginTop: 4, letterSpacing: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  card: { marginBottom: spacing.md },
  cardInner: { backgroundColor: '#fff', padding: spacing.lg, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  groupIcon: { width: 44, height: 44, backgroundColor: '#F9FAFB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  groupSub: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  actionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  actionText: { fontSize: normalize(10), fontWeight: '900', letterSpacing: 1 },
  progressSection: { marginTop: spacing.xs },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 0.5 },
  pendingText: { fontSize: normalize(8), fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
