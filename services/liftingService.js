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

export const recordLifting = async ({
  groupId,
  memberId,
  monthNumber,
  bidAmount, // This is the amount the member takes (e.g. 4,20,000)
  chitValue, // Total chit value (e.g. 5,00,000)
  totalMembers,
  commissionPercentage = 5, // Default 5%
  memberName,
  groupName,
}) => {
  const totalDiscount = chitValue - bidAmount;
  const organizerCommission = (chitValue * commissionPercentage) / 100;
  const totalDividend = totalDiscount - organizerCommission;
  const dividendPerMember = totalDividend / totalMembers;

  // 1. Record the lifting event
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

  // 2. Update the member's status
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

export const subscribeLiftingsByGroup = (groupId, onUpdate) => {
  const q = query(liftingsRef, where('groupId', '==', groupId));
  return onSnapshot(q, (snapshot) => {
    onUpdate(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
};
