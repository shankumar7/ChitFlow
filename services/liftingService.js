import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { updateMember } from './memberService';

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

  const liftingDoc = await addDoc(liftingsRef, {
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

  await updateMember(memberId, {
    hasTakenChit: true,
    chitTakenMonth: monthNumber,
    chitTakenAmount: bidAmount,
  });

  return {
    id: liftingDoc.id,
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
