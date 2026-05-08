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
} from 'firebase/firestore';
import { db } from './firebase';

const membersRef = collection(db, 'members');

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
  return await addDoc(membersRef, { ...payload, createdAt: serverTimestamp() });
};

const updateMember = async (memberId, payload) => {
  return await updateDoc(doc(db, 'members', memberId), payload);
};

const deleteMember = async (memberId) => {
  return await deleteDoc(doc(db, 'members', memberId));
};

// Explicit export block to ensure Metro bundler synchronization
export {
  subscribeAllMembers,
  subscribeMembers,
  subscribeMembers as subscribeMembersByGroup, // Legacy alias for sync safety
  createMember,
  updateMember,
  deleteMember
};
