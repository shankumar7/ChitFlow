import React, { useEffect, useState, useRef } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  StatusBar,
  Animated,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeRecentTransactions } from '../services/paymentService';
import { getMonthName } from '../utils/date';
import { colors, spacing, radius, normalize, layout } from '../utils/theme';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeRecentTransactions((data) => {
      setTransactions(data);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    });
    return unsubscribe;
  }, []);

  const renderTransaction = ({ item, index }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0]
    }) }] }]}>
      <View style={styles.cardContent}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="arrow-down-circle" size={24} color="#10B981" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>COLLECTION RECEIVED</Text>
          <Text style={styles.sub}>{getMonthName(item.monthNumber).toUpperCase()} INSTALLMENT</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amount}>+₹ {item.amount.toLocaleString()}</Text>
          <Text style={styles.status}>SUCCESS</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.verticalSpine} />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.step}>FINANCIAL LEDGER</Text>
        <View style={styles.brandTitleContainer}>
          <Text style={styles.titleHeavy}>Trans</Text>
          <Text style={styles.titleLight}>actions</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderTransaction}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-off" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No History</Text>
              <Text style={styles.emptySub}>Financial records will appear here as payments are made.</Text>
            </View>
          )
        }
        ListHeaderComponent={
          loading && <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 100 }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  list: { paddingHorizontal: spacing.xl },
  card: { 
    backgroundColor: '#fff', 
    padding: spacing.md, 
    borderRadius: radius.xs, 
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }
    })
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  sub: { fontSize: normalize(9), color: '#9CA3AF', fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  amountBox: { alignItems: 'flex-end' },
  amount: { fontSize: normalize(16), fontWeight: '900', color: '#10B981', letterSpacing: -0.5 },
  status: { fontSize: normalize(8), fontWeight: '900', color: '#10B981', letterSpacing: 1, marginTop: 2 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 100,
    backgroundColor: '#F9FAFB', 
    borderRadius: radius.xs,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  emptyText: { fontSize: normalize(16), fontWeight: '800', color: '#9CA3AF', marginTop: 12 },
  emptySub: { fontSize: normalize(12), color: '#D1D5DB', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }
});
