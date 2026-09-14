import "./firebase-config.js";
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const DEFAULT_IMAGE = "images/shop3.jpeg";

function getDatabase() {
  const firebaseConfig = globalThis.FIREBASE_CONFIG;
  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) {
    throw new Error("The product catalogue is not configured.");
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
}

function localizedValue(value, fallback = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { hi: value.hi || value.en || fallback, en: value.en || value.hi || fallback };
  }
  return { hi: fallback || value || "", en: value || fallback || "" };
}

function normalizeProduct(id, data) {
  const images = Array.isArray(data.gallery) && data.gallery.length
    ? data.gallery
    : Array.isArray(data.images) && data.images.length
      ? data.images
      : data.image ? [data.image] : [DEFAULT_IMAGE];

  return {
    ...data,
    id: data.id || id,
    image: images[0],
    gallery: images,
    name: data.name || localizedValue(data.nameEn, data.nameHi),
    description: data.description || localizedValue(data.descriptionEn, data.descriptionHi),
    features: data.features || { hi: [], en: [] },
    specifications: data.specifications || { hi: {}, en: {} },
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    featured: Boolean(data.featured)
  };
}

export async function getProducts() {
  const snapshot = await getDocs(collection(getDatabase(), "products"));
  return snapshot.docs.map((item) => normalizeProduct(item.id, item.data()));
}

export async function getProductById(id) {
  if (!id) return null;
  const database = getDatabase();
  const directMatch = await getDoc(doc(database, "products", id));
  if (directMatch.exists()) return normalizeProduct(directMatch.id, directMatch.data());
  const legacyMatch = await getDocs(query(collection(database, "products"), where("id", "==", id)));
  const match = legacyMatch.docs[0];
  return match ? normalizeProduct(match.id, match.data()) : null;
}
