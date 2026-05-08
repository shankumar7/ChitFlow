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
} from 'firebase/firestore';
import { db } from './firebase';

const groupsRef = collection(db, 'home', 'chitflow', 'groups');

export const subscribeGroups = (onUpdate, onError) => {
  const q = query(groupsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

export const createGroup = async (payload) => {
  return await addDoc(groupsRef, { ...payload, createdAt: serverTimestamp() });
};

export const updateGroup = async (groupId, payload) => {
  return await updateDoc(doc(db, 'home', 'chitflow', 'groups', groupId), payload);
};

export const deleteGroup = async (groupId) => {
  return await deleteDoc(doc(db, 'home', 'chitflow', 'groups', groupId));
};
