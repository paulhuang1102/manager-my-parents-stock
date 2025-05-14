import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
//   onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
//   getDoc, 
  getDocs, 
//   updateDoc, 
  query, 
  where,
  writeBatch 
} from 'firebase/firestore';
import { type StockAccount,  type Stock } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const createStockAccount = async (name: string, userId: string): Promise<StockAccount> => {
  const accountData = {
    name,
    userId,
    createdAt: Date.now()
  };
  
  const docRef = await addDoc(collection(db, 'stockAccounts'), accountData);
  return { id: docRef.id, ...accountData };
};

export const getStockAccounts = async (userId: string): Promise<StockAccount[]> => {
  const q = query(collection(db, 'stockAccounts'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as StockAccount));
};

export const addStockToAccount = async (
  accountId: string, 
  userId: string,
  symbol: string,
  name: string,
  quantity: number
): Promise<Stock> => {
  const stockData = {
    symbol,
    name,
    quantity,
    accountId,
    userId,
    isMarked: false,
    addedAt: Date.now()
  };
  
  const docRef = await addDoc(collection(db, 'stocks'), stockData);
  return { id: docRef.id, ...stockData };
};

export const getStocksByAccount = async (accountId: string): Promise<Stock[]> => {
  const q = query(collection(db, 'stocks'), where('accountId', '==', accountId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Stock));
};

export const getAllStocks = async (userId: string): Promise<Stock[]> => {
  const q = query(collection(db, 'stocks'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Stock));
};

export const toggleStockMarked = async (symbol: string, userId: string, isMarked: boolean): Promise<void> => {
  const q = query(
    collection(db, 'stocks'), 
    where('userId', '==', userId),
    where('symbol', '==', symbol)
  );
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  querySnapshot.docs.forEach(docSnapshot => {
    const stockRef = doc(db, 'stocks', docSnapshot.id);
    batch.update(stockRef, { isMarked });
  });
  
  return batch.commit();
};