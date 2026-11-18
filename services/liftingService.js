import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

const liftingsRef = collection(db, 'home', 'chitflow', 'liftings');

const recordLifting = async ({
  groupId,
  memberId,
  monthNumber,
  bidAmount,
  chitValue,
  totalMembers,
  commissionPercentage = 5,
  memberName,
  groupName,
}) => {
  const totalDiscount = chitValue - bidAmount;
  const organizerCommission = (chitValue * commissionPercentage) / 100;
  const totalDividend = totalDiscount - organizerCommission;
  const dividendPerMember = totalDividend / totalMembers;

  // The lifting record and the member flag are committed atomically.
  const liftingRef = doc(liftingsRef);
  const batch = writeBatch(db);
  batch.set(liftingRef, {
    groupId,
    memberId,
    memberName,
    groupName,
    monthNumber,
    bidAmount,
    totalDiscount,
    organizerCommission,
    totalDividend,
    dividendPerMember,
    timestamp: serverTimestamp(),
  });
  batch.update(doc(db, 'home', 'chitflow', 'members', memberId), {
    hasTakenChit: true,
    chitTakenMonth: monthNumber,
    chitTakenAmount: bidAmount,
  });
  await batch.commit();

  return {
    id: liftingRef.id,
    totalDiscount,
    organizerCommission,
    totalDividend,
    dividendPerMember,
  };
};

const subscribeLiftingsByGroup = (groupId, onUpdate) => {
  const q = query(liftingsRef, where('groupId', '==', groupId));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
};

const subscribeAllLiftings = (onUpdate) => {
  return onSnapshot(liftingsRef, (snapshot) => {
    onUpdate(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
};

export {
  recordLifting,
  subscribeLiftingsByGroup,
  subscribeAllLiftings
};
