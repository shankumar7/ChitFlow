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
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentMonthNumber } from '../utils/date';

const paymentsRef = collection(db, 'home', 'chitflow', 'payments');

const getPaymentId = ({ groupId, memberId, monthNumber }) => `${groupId}_${memberId}_${monthNumber}`;

const togglePaymentStatus = async ({ groupId, memberId, month, amount, status, method, remarks, memberName, groupName, currentTotalPaid = 0, monthlyAmount = 0 }) => {
  const docId = getPaymentId({ groupId, memberId, monthNumber: month });
  const timestamp = new Date().toISOString();
  const currentMonth = getCurrentMonthNumber();
  const safeAmount = Number(amount) || 0;

  const newTotalPaid = Math.max(
    0,
    status === 'paid' ? currentTotalPaid + safeAmount : currentTotalPaid - safeAmount
  );
  const totalDueTillNow = currentMonth * (Number(monthlyAmount) || 0);
  const newPendingAmount = Math.max(0, totalDueTillNow - newTotalPaid);

  // Write the payment and the member totals together so they can never drift apart.
  const batch = writeBatch(db);
  batch.set(
    doc(db, 'home', 'chitflow', 'payments', docId),
    {
      groupId,
      memberId,
      memberName,
      groupName,
      monthNumber: month,
      amount: safeAmount,
      status,
      method: method || 'none',
      remarks: remarks || '',
      timestamp,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  batch.update(doc(db, 'home', 'chitflow', 'members', memberId), {
    totalPaid: newTotalPaid,
    pendingAmount: newPendingAmount,
  });
  await batch.commit();

  return true;
};

const subscribeAllPaymentsLedger = (onUpdate) => {
  const q = query(paymentsRef, where('status', '==', 'paid'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    onUpdate(data);
  });
};

const subscribePaymentsByGroupAndMonth = (groupId, monthNumber, onUpdate, onError) => {
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

const subscribeAllPaymentsByMonth = (monthNumber, onUpdate) => {
  const q = query(paymentsRef, where('monthNumber', '==', monthNumber), where('status', '==', 'paid'));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

const subscribeRecentTransactions = (onUpdate) => {
  const q = query(paymentsRef, where('status', '==', 'paid'));
  return onSnapshot(q, (snapshot) => {
    const sorted = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    onUpdate(sorted.slice(0, 50));
  });
};

const getDashboardStats = async (currentMonthNumber) => {
  const [groupsSnap, membersSnap, paymentsSnap] = await Promise.all([
    getCountFromServer(collection(db, 'home', 'chitflow', 'groups')),
    getCountFromServer(collection(db, 'home', 'chitflow', 'members')),
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

export {
  togglePaymentStatus,
  subscribeAllPaymentsLedger,
  subscribePaymentsByGroupAndMonth,
  subscribeAllPaymentsByMonth,
  subscribeRecentTransactions,
  getDashboardStats
};
