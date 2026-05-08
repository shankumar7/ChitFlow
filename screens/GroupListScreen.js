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
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const calculateEndDate = (startDateStr, durationMonths) => {
  if (!startDateStr) return 'N/A';
  const start = new Date(startDateStr);
  const end = new Date(start.setMonth(start.getMonth() + durationMonths));
  return end.toISOString().split('T')[0];
};

const GroupCard = ({ group, onPress, opacity, index }) => {
  const endDate = calculateEndDate(group.startDate, group.duration);
  const isActive = group.status === 'active';
  
  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY: opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0]
    }) }] }]}>
      <Pressable onPress={() => onPress(group)} style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={styles.groupIcon}>
            <MaterialCommunityIcons name="layers-triple" size={24} color={colors.text} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{(group?.name || 'GROUP').toUpperCase()}</Text>
            <Text style={styles.groupAmount}>₹ {(group?.monthlyAmount || 0).toLocaleString()} / MO</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
        </View>

        <View style={styles.timeline}>
          <View style={styles.timePoint}>
            <Text style={styles.timeLabel}>START</Text>
            <Text style={styles.timeValue}>{group.startDate || 'N/A'}</Text>
          </View>
          <View style={styles.timeConnector} />
          <View style={styles.timePoint}>
            <Text style={styles.timeLabel}>MATURITY</Text>
            <Text style={styles.timeValue}>{endDate}</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.durationTag}>{group.duration} MONTH CYCLE</Text>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#F0FDF4' : '#F3F4F6' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#10B981' : '#9CA3AF' }]}>
              {(group.status || 'ACTIVE').toUpperCase()}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function GroupListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    const unsubscribe = subscribeGroups((data) => {
      setGroups(data);
      setLoading(false);
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.step}>CHITTI DIRECTORY</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Active</Text>
            <Text style={styles.titleLight}>Groups</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
        ) : groups.length > 0 ? (
          groups.map((group, index) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              index={index}
              opacity={fadeAnim}
              onPress={(g) => navigation.navigate('MemberList', { 
                groupId: g.id, 
                groupName: g.name, 
                monthlyAmount: g.monthlyAmount,
                duration: g.duration,
                commissionPercentage: g.commissionPercentage
              })} 
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="layers-off-outline" size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No Active Groups</Text>
            <Text style={styles.emptySub}>Initialize your first Chitti circle from the Dashboard.</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB FOR NEW GROUP - RECALIBRATED TO CLEAR NAV BAR */}
      <Pressable 
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
        onPress={() => navigation.navigate('CreateGroup')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="plus" size={32} color={colors.white} />
      </Pressable>

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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  card: { marginBottom: spacing.md },
  cardInner: { backgroundColor: '#fff', padding: spacing.lg, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  groupIcon: { width: 44, height: 44, backgroundColor: '#F9FAFB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  groupAmount: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  timeline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 4, marginBottom: spacing.md },
  timePoint: { flex: 1 },
  timeLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', marginBottom: 2 },
  timeValue: { fontSize: normalize(11), fontWeight: '700', color: colors.text },
  timeConnector: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationTag: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: normalize(10), fontWeight: '900' },
  fab: { 
    position: 'absolute', 
    right: spacing.xl, 
    bottom: 24, // Positioned just above navigation bar
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: colors.text, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 12px rgba(0,0,0,0.3)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }
    }),
    zIndex: 1000
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
