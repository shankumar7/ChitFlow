import React, { useState, useEffect, useRef } from 'react';
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
import { subscribeMembers } from '../services/memberService';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const MemberCard = ({ member, onPress, opacity, index }) => (
  <Animated.View style={[styles.memberCard, { opacity, transform: [{ translateY: opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [20 * (index + 1), 0]
  }) }] }]}>
    <Pressable onPress={() => onPress(member)} style={styles.memberCardInner}>
      <View style={styles.memberAvatar}>
        <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name.toUpperCase()}</Text>
        <Text style={styles.memberPhone}>{member.phone}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
    </Pressable>
  </Animated.View>
);

export default function MemberListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, monthlyAmount } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Smart fallback for status bar height
  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    const unsubscribe = subscribeMembers(groupId, (data) => {
      setMembers(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    });
    return unsubscribe;
  }, [groupId]);

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.verticalSpine} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>CHITTI GROUP</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>{groupName.split(' ')[0]}</Text>
            <Text style={styles.titleLight}>{groupName.split(' ').slice(1).join(' ') || 'Circle'}</Text>
          </View>
          <Text style={styles.monthlyNote}>₹ {monthlyAmount.toLocaleString()} MONTHLY FLOW</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PARTICIPANTS</Text>
            <Pressable 
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddMember', { groupId, groupName })}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.addBtnText}>ADD</Text>
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
                onPress={() => navigation.navigate('Payment', { memberId: member.id, memberName: member.name, groupId, groupName, monthlyAmount })} 
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No Members Yet</Text>
              <Text style={styles.emptySub}>Initialize your circle by adding participants.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* THE ABSOLUTE SHIELD */}
      <View style={[styles.topBlocker, { height: safeTop }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white, 
    zIndex: 9999, 
  },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { marginBottom: spacing.xl },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  titleLight: { fontSize: normalize(32), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  monthlyNote: { fontSize: normalize(12), fontWeight: '800', color: '#10B981', marginTop: 4, letterSpacing: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionLabel: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2 },
  addBtn: { backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, gap: 4 },
  addBtnText: { color: colors.white, fontSize: normalize(10), fontWeight: '900', letterSpacing: 1 },
  memberCard: { marginBottom: spacing.sm },
  memberCardInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  memberAvatar: { width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: normalize(18), fontWeight: '900', color: colors.text },
  memberInfo: { flex: 1 },
  memberName: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  memberPhone: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
