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

export const subscribeAllMembers = (onUpdate) => {
  return onSnapshot(membersRef, (snapshot) => {
    onUpdate(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const subscribeMembersByGroup = (groupId, onUpdate, onError) => {
  const q = query(membersRef, where('groupId', '==', groupId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

export const createMember = async (payload) => {
  return await addDoc(membersRef, { ...payload, createdAt: serverTimestamp() });
};

export const updateMember = async (memberId, payload) => {
  return await updateDoc(doc(db, 'members', memberId), payload);
};

export const deleteMember = async (memberId) => {
  return await deleteDoc(doc(db, 'members', memberId));
};
