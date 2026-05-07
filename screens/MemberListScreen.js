import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembersByGroup } from '../services/memberService';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radius, elevation, normalize } from '../utils/theme';

export default function MemberListScreen({ route, navigation }) {
  const { groupId, groupName, monthlyAmount } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMembersByGroup(groupId, (data) => {
      setMembers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [groupId]);

  const renderMemberItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone" size={14} color={colors.textLight} />
            <Text style={styles.contactText}>{item.phone || 'No phone'}</Text>
          </View>
        </View>
        <Pressable 
          style={styles.actionBtn}
          onPress={() => {}}
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.textLight} />
        </Pressable>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>GROUP MEMBERS</Text>
          <Text style={styles.headerTitle}>{groupName}</Text>
        </View>
        <Pressable 
          style={styles.paymentBtn}
          onPress={() => navigation.navigate('Payment', { groupId, groupName, monthlyAmount })}
        >
          <LinearGradient
            colors={[colors.secondary, colors.secondary]}
            style={styles.paymentBtnGradient}
          >
            <MaterialCommunityIcons name="currency-inr" size={18} color={colors.white} />
            <Text style={styles.paymentBtnText}>PAYMENTS</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderMemberItem}
        ListEmptyComponent={
          <EmptyState 
            title="No members yet" 
            subtitle="Add members to this group to start tracking their payments." 
            actionLabel="Add Member"
            onAction={() => navigation.navigate('AddMember', { groupId, groupName })}
            icon="account-plus-outline"
          />
        }
      />
      
      <Pressable 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddMember', { groupId, groupName })}
      >
        <MaterialCommunityIcons name="account-plus" size={26} color={colors.white} />
      </Pressable>
    </View>
  );
}

// I need LinearGradient for the button
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: spacing.xl, 
    backgroundColor: colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl
  },
  headerLabel: { fontSize: normalize(10), fontWeight: '800', color: colors.textLight, letterSpacing: 1 },
  headerTitle: { fontSize: normalize(22), fontWeight: '900', color: colors.text, marginTop: 4 },
  paymentBtn: { borderRadius: radius.md, overflow: 'hidden' },
  paymentBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  paymentBtnText: { color: colors.white, fontWeight: '900', fontSize: normalize(12), letterSpacing: 0.5 },
  list: { padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...elevation.card },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: normalize(48), height: normalize(48), borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontSize: normalize(20), fontWeight: '800', color: colors.primary },
  info: { flex: 1 },
  name: { fontSize: normalize(16), fontWeight: '800', color: colors.text },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  contactText: { fontSize: normalize(13), color: colors.textMuted, fontWeight: '600' },
  actionBtn: { padding: 4 },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: normalize(60), height: normalize(60), borderRadius: normalize(30), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...elevation.lg },
});
import { Platform } from 'react-native';
