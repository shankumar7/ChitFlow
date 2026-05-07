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

export const updatePaymentStatus = async (groupId, memberId, monthNumber, payload) => {
  const docId = getPaymentId({ groupId, memberId, monthNumber });
  return await setDoc(
    doc(db, 'payments', docId),
    {
      ...payload,
      groupId,
      memberId,
      monthNumber,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
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
