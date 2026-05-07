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
import { subscribeGroups } from '../services/groupService';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const GroupCard = ({ group, onPress, opacity, index }) => (
  <Animated.View style={[styles.groupCard, { opacity, transform: [{ translateY: opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [20 * (index + 1), 0]
  }) }] }]}>
    <Pressable onPress={() => onPress(group)} style={styles.groupCardInner}>
      <View style={styles.groupIcon}>
        <MaterialCommunityIcons name="layers-outline" size={24} color={colors.text} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name.toUpperCase()}</Text>
        <Text style={styles.groupSub}>₹ {group.monthlyAmount.toLocaleString()} • {group.duration} MONTHS</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
    </Pressable>
  </Animated.View>
);

export default function GroupListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;

  // Smart fallback for status bar height
  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    const unsubscribe = subscribeGroups((data) => {
      setGroups(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      Animated.spring(fabAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    });
    return unsubscribe;
  }, []);

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
          <Text style={styles.step}>CHITTI GROUP</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>All</Text>
            <Text style={styles.titleLight}>Groups</Text>
          </View>
        </View>

        <View style={styles.section}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 100 }} />
          ) : groups.length > 0 ? (
            groups.map((group, index) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                index={index}
                opacity={fadeAnim}
                onPress={() => navigation.navigate('MemberList', { groupId: group.id, groupName: group.name, monthlyAmount: group.monthlyAmount })} 
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="folder-open-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No Active Circles</Text>
              <Text style={styles.emptySub}>Tap the + button to create a new Chitti group.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Animated.View style={[
        styles.fabContainer, 
        { 
          bottom: spacing.xs,
          opacity: fabAnim, 
          transform: [{ scale: fabAnim }, { translateY: fabAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0]
          }) }] 
        }
      ]}>
        <Pressable 
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <MaterialCommunityIcons name="plus" size={32} color={colors.white} />
        </Pressable>
      </Animated.View>

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
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  groupCard: { marginBottom: spacing.sm },
  groupCardInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  groupIcon: { width: 44, height: 44, backgroundColor: '#F9FAFB', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  groupSub: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 2 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  fabContainer: { 
    position: 'absolute', 
    right: spacing.xl,
    zIndex: 100 
  },
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
