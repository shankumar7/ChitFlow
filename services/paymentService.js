import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebase';

const paymentsRef = collection(db, 'payments');

const getPaymentId = ({ groupId, memberId, monthNumber }) => `${groupId}_${memberId}_${monthNumber}`;

export const togglePaymentStatus = async ({ groupId, memberId, month, amount, status, method, remarks, memberName, groupName }) => {
  const docId = getPaymentId({ groupId, memberId, monthNumber: month });
  const timestamp = new Date().toISOString(); // High-precision local time for Ledger
  
  return await setDoc(
    doc(db, 'payments', docId),
    {
      groupId,
      memberId,
      memberName, // Store names for ledger display without extra joins
      groupName,
      monthNumber: month,
      amount,
      status,
      method: method || 'none',
      remarks: remarks || '',
      timestamp, // ISO string for immediate display
      updatedAt: serverTimestamp(), // Firestore sync time
    },
    { merge: true }
  );
};

export const subscribeAllPayments = (onUpdate) => {
  const q = query(paymentsRef, where('status', '==', 'paid'));
  return onSnapshot(q, (snapshot) => {
    // Sort by timestamp descending
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    onUpdate(data);
  });
};

export const subscribePaymentsByGroupAndMonth = (groupId, monthNumber, onUpdate, onError) => {
  const q = query(
    paymentsRef,
    where('groupId', '==', groupId),
    where('monthNumber', '==', monthNumber)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

export const subscribeAllPaymentsByMonth = (monthNumber, onUpdate) => {
  const q = query(paymentsRef, where('monthNumber', '==', monthNumber), where('status', '==', 'paid'));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeRecentTransactions = (onUpdate) => {
  const q = query(paymentsRef, where('status', '==', 'paid'));
  return onSnapshot(q, (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    onUpdate(sorted.slice(0, 50));
  });
};

export const getDashboardStats = async (currentMonthNumber) => {
  const [groupsSnap, membersSnap, paymentsSnap] = await Promise.all([
    getCountFromServer(collection(db, 'groups')),
    getCountFromServer(collection(db, 'members')),
    getDocs(query(paymentsRef, where('monthNumber', '==', currentMonthNumber), where('status', '==', 'paid'))),
  ]);

  const totalGroups = groupsSnap.data().count;
  const totalMembers = membersSnap.data().count;

  const recentActivity = paymentsSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 5);

  const monthlyCollection = paymentsSnap.docs.reduce((sum, item) => {
    const payment = item.data();
    return sum + Number(payment.amount || 0);
  }, 0);

  return {
    totalGroups,
    totalMembers,
    monthlyCollection,
    recentActivity,
  };
};
