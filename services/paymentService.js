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
import { updateMember } from './memberService';
import { getCurrentMonthNumber } from '../utils/date';

const paymentsRef = collection(db, 'home', 'chitflow', 'payments');

const getPaymentId = ({ groupId, memberId, monthNumber }) => `${groupId}_${memberId}_${monthNumber}`;

const togglePaymentStatus = async ({ groupId, memberId, month, amount, status, method, remarks, memberName, groupName, currentTotalPaid = 0, monthlyAmount = 0 }) => {
  const docId = getPaymentId({ groupId, memberId, monthNumber: month });
  const timestamp = new Date().toISOString();
  const currentMonth = getCurrentMonthNumber();

  await setDoc(
    doc(db, 'home', 'chitflow', 'payments', docId),
    {
      groupId,
      memberId,
      memberName,
      groupName,
      monthNumber: month,
      amount,
      status,
      method: method || 'none',
      remarks: remarks || '',
      timestamp,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const newTotalPaid = status === 'paid' ? (currentTotalPaid + Number(amount)) : (currentTotalPaid - Number(amount));
  const totalDueTillNow = currentMonth * monthlyAmount;
  const newPendingAmount = Math.max(0, totalDueTillNow - newTotalPaid);

  await updateMember(memberId, {
    totalPaid: newTotalPaid,
    pendingAmount: newPendingAmount
  });

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
