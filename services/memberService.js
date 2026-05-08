import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

const membersRef = collection(db, 'home', 'chitflow', 'members');

const subscribeAllMembers = (onUpdate) => {
  return onSnapshot(membersRef, (snapshot) => {
    onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

const subscribeMembers = (groupId, onUpdate, onError) => {
  const q = query(membersRef, where('groupId', '==', groupId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

const createMember = async (payload) => {
  return await addDoc(membersRef, { 
    ...payload, 
    hasTakenChit: false,
    chitTakenMonth: 0,
    chitTakenAmount: 0,
    totalPaid: 0,
    pendingAmount: 0,
    createdAt: serverTimestamp() 
  });
};

const createBatchMembers = async (groupId, count) => {
  const batch = writeBatch(db);
  for (let i = 1; i <= count; i++) {
    const newMemberRef = doc(membersRef);
    batch.set(newMemberRef, {
      groupId,
      name: `Member ${i}`,
      phone: '',
      hasTakenChit: false,
      chitTakenMonth: 0,
      chitTakenAmount: 0,
      totalPaid: 0,
      pendingAmount: 0,
      createdAt: serverTimestamp()
    });
  }
  return await batch.commit();
};

const updateMember = async (memberId, payload) => {
  return await updateDoc(doc(db, 'home', 'chitflow', 'members', memberId), payload);
};

const deleteMember = async (memberId) => {
  return await deleteDoc(doc(db, 'home', 'chitflow', 'members', memberId));
};

// Explicit export block to ensure Metro bundler synchronization
export {
  subscribeAllMembers,
  subscribeMembers,
  subscribeMembers as subscribeMembersByGroup, // Legacy alias for sync safety
  createMember,
  createBatchMembers,
  updateMember,
  deleteMember
};
