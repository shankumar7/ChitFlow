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
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeAllPaymentsLedger } from '../services/paymentService';
import { subscribeGroups } from '../services/groupService';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const TransactionItem = ({ item, index, opacity }) => (
  <Animated.View style={[styles.transactionCard, { opacity, transform: [{ translateY: opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [15 * (index % 10 + 1), 0]
  }) }] }]}>
    <View style={styles.txMain}>
      <View style={styles.txIdentity}>
        <Text style={styles.txMember}>{(item.memberName || 'MEMBER').toUpperCase()}</Text>
        <Text style={styles.txGroup}>{(item.groupName || 'GROUP').toUpperCase()}</Text>
      </View>
      <View style={styles.txValue}>
        <Text style={styles.txAmount}>₹ {(item.amount || 0).toLocaleString()}</Text>
        <View style={styles.txMeta}>
          <View style={[styles.methodBadge, { backgroundColor: item.method === 'UPI' ? '#EFF6FF' : '#F0FDF4' }]}>
            <Text style={[styles.methodText, { color: item.method === 'UPI' ? '#3B82F6' : '#10B981' }]}>
              {(item.method || 'CASH').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.txTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    </View>
    {item.remarks ? (
      <View style={styles.txRemarks}>
        <MaterialCommunityIcons name="comment-text-outline" size={12} color="#9CA3AF" />
        <Text style={styles.remarksText}>{item.remarks}</Text>
      </View>
    ) : null}
    <View style={styles.txFooter}>
      <Text style={styles.txDate}>{item.date || '---'}</Text>
    </View>
  </Animated.View>
);

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    const unsubPayments = subscribeAllPaymentsLedger((data) => {
      setPayments(data);
      setLoading(false);
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 800, 
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    });

    const unsubGroups = subscribeGroups(setGroups);

    return () => {
      unsubPayments();
      unsubGroups();
    };
  }, []);

  useEffect(() => {
    if (selectedGroup === 'ALL') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(p => p.groupId === selectedGroup));
    }
  }, [selectedGroup, payments]);

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={[styles.header, { paddingTop: safeTop + 20 }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.step}>AUDIT LOG</Text>
            <View style={styles.brandTitleContainer}>
              <Text style={styles.titleHeavy}>Payment</Text>
              <Text style={styles.titleLight}>Ledger</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="history" size={32} color={colors.text} />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterBar}
          contentContainerStyle={styles.filterContent}
        >
          <Pressable 
            onPress={() => setSelectedGroup('ALL')}
            style={[styles.filterChip, selectedGroup === 'ALL' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, selectedGroup === 'ALL' && styles.filterTextActive]}>ALL CIRCLES</Text>
          </Pressable>
          {groups.map(g => (
            <Pressable 
              key={g.id}
              onPress={() => setSelectedGroup(g.id)}
              style={[styles.filterChip, selectedGroup === g.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedGroup === g.id && styles.filterTextActive]}>{(g.name || 'GROUP').toUpperCase()}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <TransactionItem item={item} index={index} opacity={fadeAnim} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="text-box-search-outline" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No Transactions Found</Text>
              <Text style={styles.emptySub}>Select a different circle or start recording payments.</Text>
            </View>
          }
        />
      )}

      <View style={[styles.topBlocker, { height: safeTop }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
  header: { paddingHorizontal: spacing.xl, backgroundColor: colors.white, paddingBottom: spacing.md },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(32), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  titleLight: { fontSize: normalize(32), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  filterBar: { marginTop: spacing.sm },
  filterContent: { paddingRight: spacing.xl, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterText: { fontSize: normalize(9), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  filterTextActive: { color: colors.white },
  listContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  transactionCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: spacing.md },
  txMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  txIdentity: { flex: 1 },
  txMember: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  txGroup: { fontSize: normalize(9), fontWeight: '800', color: '#9CA3AF', marginTop: 2, letterSpacing: 0.5 },
  txValue: { alignItems: 'flex-end' },
  txAmount: { fontSize: normalize(16), fontWeight: '900', color: colors.text },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3 },
  methodText: { fontSize: normalize(8), fontWeight: '900', letterSpacing: 0.5 },
  txTime: { fontSize: normalize(9), fontWeight: '700', color: '#9CA3AF' },
  txRemarks: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 4 },
  remarksText: { fontSize: normalize(10), color: '#6B7280', fontWeight: '600', fontStyle: 'italic', flex: 1 },
  txFooter: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  txDate: { fontSize: normalize(9), fontWeight: '900', color: '#D1D5DB', letterSpacing: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, backgroundColor: '#F9FAFB', borderRadius: radius.xs, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
