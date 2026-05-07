import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeGroups } from '../services/groupService';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radius, elevation, normalize, layout } from '../utils/theme';

export default function GroupListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeGroups((data) => {
      setGroups(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const renderGroupItem = ({ item }) => (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate('Payment', { 
        groupId: item.id, 
        groupName: item.name,
        monthlyAmount: item.monthlyAmount 
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="account-group" size={normalize(24)} color={colors.primary} />
        </View>
        <View style={styles.titleInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.memberCount}>{item.memberCount || 0} Members</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
      </View>
      <View style={styles.divider} />
      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>MONTHLY</Text>
          <Text style={styles.statValue}>₹{item.monthlyAmount}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>DURATION</Text>
          <Text style={styles.statValue}>{item.duration} Months</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
          <View style={[styles.dot, { backgroundColor: item.status === 'active' ? colors.secondary : colors.accent }]} />
          <Text style={[styles.badgeText, { color: item.status === 'active' ? colors.secondary : colors.accent }]}>
            {item.status?.toUpperCase() || 'ACTIVE'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={styles.root}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.scrollList}
        renderItem={renderGroupItem}
        ListEmptyComponent={
          <EmptyState 
            title="No groups found" 
            subtitle="Create your first chit group to start managing." 
            actionLabel="Create Group"
            onAction={() => navigation.navigate('CreateGroup')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: layout.container,
  scrollList: { padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...elevation.card },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconBox: { width: normalize(48), height: normalize(48), borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  titleInfo: { flex: 1 },
  groupName: { fontSize: normalize(18), fontWeight: '900', color: colors.text },
  memberCount: { fontSize: normalize(13), color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md, opacity: 0.5 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: normalize(10), fontWeight: '800', color: colors.textLight, letterSpacing: 0.5 },
  statValue: { fontSize: normalize(15), fontWeight: '800', color: colors.text, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: normalize(11), fontWeight: '900', letterSpacing: 0.5 },
});
