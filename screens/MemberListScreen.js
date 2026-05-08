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
  ActivityIndicator,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembers } from '../services/memberService';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const MemberCard = ({ member, index, opacity, onEdit }) => {
  const handleCall = () => {
    if (member?.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };

  const isPlaceholder = member.name.startsWith('Member ') && !member.phone;

  return (
    <Animated.View style={[styles.memberCard, {
      opacity, transform: [{
        translateY: opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [20 * (index + 1), 0]
        })
      }]
    }]}>
      <Pressable onPress={() => onEdit(member)} style={styles.avatar}>
        {member.hasTakenChit ? (
          <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
        ) : isPlaceholder ? (
          <MaterialCommunityIcons name="account-edit-outline" size={20} color="#9CA3AF" />
        ) : (
          <Text style={styles.avatarText}>{((member?.name || 'M')[0]).toUpperCase()}</Text>
        )}
      </Pressable>
      <Pressable onPress={() => onEdit(member)} style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.memberName, isPlaceholder && { color: '#9CA3AF' }]}>{(member?.name || 'MEMBER').toUpperCase()}</Text>
          {member.hasTakenChit && (
            <View style={styles.liftedBadge}>
              <Text style={styles.liftedText}>PRIZED</Text>
            </View>
          )}
          {isPlaceholder && (
            <View style={styles.placeholderBadge}>
              <Text style={styles.placeholderText}>SETUP REQUIRED</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberPhone}>{member?.phone || 'NO CONTACT'}</Text>

        <View style={styles.financialMiniGrid}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>PAID</Text>
            <Text style={styles.finValue}>₹ {(member.totalPaid || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>PENDING</Text>
            <Text style={[styles.finValue, (member.pendingAmount || 0) > 0 && { color: '#EF4444' }]}>
              ₹ {(member.pendingAmount || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable onPress={handleCall} style={styles.callBtn}>
        <MaterialCommunityIcons name="phone-outline" size={20} color={colors.text} />
      </Pressable>
    </Animated.View>
  );
};

export default function MemberListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, monthlyAmount, duration, commissionPercentage } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    const unsubscribe = subscribeMembers(groupId, (data) => {
      setMembers(data);
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    });
    return unsubscribe;
  }, [groupId]);

  return (
    <View style={styles.container}>

      <View style={[styles.header, { paddingTop: safeTop + 20, paddingHorizontal: spacing.xl }]}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.step}>MEMBER DIRECTORY</Text>
        <View style={styles.brandTitleContainer}>
          <Text style={styles.titleHeavy}>Circle</Text>
          <Text style={styles.titleLight}>Members</Text>
        </View>
        <Text style={styles.groupContext}>{(groupName || 'GROUP').toUpperCase()}</Text>

        <Pressable
          style={styles.auctionBtn}
          onPress={() => navigation.navigate('Auction', { groupId, groupName, monthlyAmount, duration, commissionPercentage })}
        >
          <MaterialCommunityIcons name="gavel" size={18} color={colors.white} />
          <Text style={styles.auctionBtnText}>LIFT CHITTI</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.actionRow}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{members.length} PARTICIPANTS</Text>
          </View>
          <Pressable style={styles.collectionBtn} onPress={() => navigation.navigate('Payment', { groupId, groupName, monthlyAmount, duration, commissionPercentage })}>
            <Text style={styles.collectionBtnText}>COLLECT INSTALLMENTS</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
        ) : members.length > 0 ? (
          members.map((member, index) => (
            <MemberCard 
              key={member.id} 
              member={member} 
              index={index}
              opacity={fadeAnim}
              onEdit={(m) => navigation.navigate('AddMember', { groupId, member: m })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No Members Yet</Text>
            <Text style={styles.emptySub}>Start adding participants to this Chitti circle.</Text>
          </View>
        )}
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { marginBottom: spacing.xl, zIndex: 10000 },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  groupContext: { fontSize: normalize(12), fontWeight: '800', color: '#3B82F6', marginTop: 4, letterSpacing: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  countBadge: { backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  countText: { fontSize: normalize(9), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  auctionBtn: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xs, marginTop: 16, alignSelf: 'flex-start' },
  auctionBtnText: { color: colors.white, fontSize: normalize(10), fontWeight: '900', letterSpacing: 1.5 },
  collectionBtn: { backgroundColor: colors.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4 },
  collectionBtnText: { color: colors.white, fontSize: normalize(9), fontWeight: '900', letterSpacing: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liftedBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  liftedText: { fontSize: normalize(7), fontWeight: '900', color: '#B45309' },
  placeholderBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  placeholderText: { fontSize: normalize(7), fontWeight: '900', color: '#9CA3AF' },
  financialMiniGrid: { flexDirection: 'row', gap: spacing.lg, marginTop: 8 },
  finItem: {},
  finLabel: { fontSize: normalize(7), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 2 },
  finValue: { fontSize: normalize(10), fontWeight: '800', color: colors.text },
  memberCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: normalize(14), fontWeight: '900', color: colors.text },
  memberInfo: { flex: 1 },
  memberName: { fontSize: normalize(13), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  memberPhone: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 80, // Positioned higher as requested to distinguish from global FAB
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
  }
});
