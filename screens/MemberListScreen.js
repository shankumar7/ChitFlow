import React, { useEffect, useState, useRef } from 'react';
import { 
  FlatList, 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  Platform, 
  StatusBar,
  Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeMembersByGroup } from '../services/memberService';
import { colors, spacing, radius, normalize, layout, window } from '../utils/theme';

export default function MemberListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, monthlyAmount } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeMembersByGroup(groupId, (data) => {
      setMembers(data);
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });
    return unsubscribe;
  }, [groupId]);

  const renderMemberItem = ({ item, index }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0]
    }) }] }]}>
      <View style={styles.cardContent}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name.toUpperCase()}</Text>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone-outline" size={12} color="#9CA3AF" />
            <Text style={styles.contactText}>{item.phone || 'NO CONTACT'}</Text>
          </View>
        </View>
        <Pressable style={styles.actionBtn}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#D1D5DB" />
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="white" barStyle="dark-content" />
      <View style={styles.verticalSpine} />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>GROUP ARCHITECTURE</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>{groupName.split(' ')[0]}</Text>
            {groupName.split(' ').slice(1).length > 0 && (
              <Text style={styles.titleLight}>{groupName.split(' ').slice(1).join(' ')}</Text>
            )}
          </View>
        </View>
        <Pressable 
          style={({ pressed }) => [styles.paymentBtn, pressed && styles.paymentBtnPressed]}
          onPress={() => navigation.navigate('Payment', { groupId, groupName, monthlyAmount })}
        >
          <MaterialCommunityIcons name="currency-inr" size={20} color={colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={renderMemberItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 100 }} />
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>Empty Ledger</Text>
              <Text style={styles.emptySub}>No members found in this group hierarchy.</Text>
            </View>
          )
        }
      />
      
      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <Pressable 
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} 
          onPress={() => navigation.navigate('AddMember', { groupId, groupName })}
        >
          <MaterialCommunityIcons name="account-plus" size={28} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    marginBottom: spacing.md
  },
  headerLeft: { flex: 1 },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1.5 },
  titleLight: { fontSize: normalize(32), fontWeight: '200', color: colors.text, letterSpacing: -1, marginLeft: 6 },
  paymentBtn: { 
    backgroundColor: colors.text, 
    width: normalize(44), 
    height: normalize(44), 
    borderRadius: radius.xs, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 32
  },
  paymentBtnPressed: { opacity: 0.8 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  card: { 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.xs, 
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 }
    })
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { 
    width: normalize(44), 
    height: normalize(44), 
    borderRadius: 4, 
    backgroundColor: colors.text, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: spacing.md 
  },
  avatarText: { fontSize: normalize(18), fontWeight: '900', color: colors.white },
  info: { flex: 1 },
  name: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  contactText: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
  actionBtn: { padding: 4 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 100,
    marginTop: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  fabContainer: { position: 'absolute', right: spacing.xl, zIndex: 100 },
  fab: { 
    backgroundColor: colors.text, 
    width: normalize(64), 
    height: normalize(64), 
    borderRadius: radius.full, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.3)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 12 }
    })
  },
  fabPressed: { transform: [{ scale: 0.9 }], opacity: 0.9 }
});
