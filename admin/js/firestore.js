import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { db, isFirebaseConfigured } from "./firebase.js";

const ensureFirebaseIsConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }
};

export const collections = {
  products: "products",
  categories: "categories",
  offers: "offers",
  gallery: "gallery",
  reviews: "reviews",
  settings: "settings"
};

export async function listRecords(
  collectionName,
  { pageSize = 10, lastDoc = null } = {}
) {
  ensureFirebaseIsConfigured();

  let recordsQuery = query(
    collection(db, collectionName),
    orderBy("updatedAt", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    recordsQuery = query(
      collection(db, collectionName),
      orderBy("updatedAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(recordsQuery);

  return {
    records: snapshot.docs.map(record => ({
      id: record.id,
      ...record.data()
    })),
    lastDoc: snapshot.docs.at(-1) || null
  };
}

export async function createRecord(collectionName, data) {
  ensureFirebaseIsConfigured();

  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateRecord(collectionName, id, data) {
  ensureFirebaseIsConfigured();

  return updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteRecord(collectionName, id) {
  ensureFirebaseIsConfigured();

  return deleteDoc(doc(db, collectionName, id));
}
