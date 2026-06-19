import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  INITIAL_SERVICES,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_INCENTIVES,
  INITIAL_SALES_EMPLOYEES
} from '../data/mockData';
import { Service, Client, Project, Incentive, SalesEmployee } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAtVTh_9j-yKsuU-zotRyHhIhNuHAZFuKo",
  authDomain: "crm-integrasi-lab.firebaseapp.com",
  projectId: "crm-integrasi-lab",
  storageBucket: "crm-integrasi-lab.firebasestorage.app",
  messagingSenderId: "454494046613",
  appId: "1:454494046613:web:5f47f36c2f07568d00ce9c",
  measurementId: "G-ZZETSB2F8N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth };

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);
export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

// Firestore CRUD helpers
async function seedCollection(collectionName: string, initialData: any[]) {
  try {
    const batch = writeBatch(db);
    initialData.forEach((item) => {
      batch.set(doc(db, collectionName, item.id), item);
    });
    await batch.commit();
  } catch (err) {
    console.error(`Failed to seed ${collectionName}:`, err);
  }
}

export async function getServicesFromDb(): Promise<Service[]> {
  try {
    const snapshot = await getDocs(collection(db, 'services'));
    if (snapshot.empty) { await seedCollection('services', INITIAL_SERVICES); return INITIAL_SERVICES; }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service));
  } catch { return INITIAL_SERVICES; }
}

export async function getClientsFromDb(): Promise<Client[]> {
  try {
    const snapshot = await getDocs(collection(db, 'clients'));
    if (snapshot.empty) { await seedCollection('clients', INITIAL_CLIENTS); return INITIAL_CLIENTS; }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client));
  } catch { return INITIAL_CLIENTS; }
}

export async function getProjectsFromDb(): Promise<Project[]> {
  try {
    const snapshot = await getDocs(collection(db, 'projects'));
    if (snapshot.empty) { await seedCollection('projects', INITIAL_PROJECTS); return INITIAL_PROJECTS; }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
  } catch { return INITIAL_PROJECTS; }
}

export async function getIncentivesFromDb(): Promise<Incentive[]> {
  try {
    const snapshot = await getDocs(collection(db, 'incentives'));
    if (snapshot.empty) { await seedCollection('incentives', INITIAL_INCENTIVES); return INITIAL_INCENTIVES; }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Incentive));
  } catch { return INITIAL_INCENTIVES; }
}

export async function getSalesEmployeesFromDb(): Promise<SalesEmployee[]> {
  try {
    const snapshot = await getDocs(collection(db, 'sales_employees'));
    if (snapshot.empty) { await seedCollection('sales_employees', INITIAL_SALES_EMPLOYEES); return INITIAL_SALES_EMPLOYEES; }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SalesEmployee));
  } catch { return INITIAL_SALES_EMPLOYEES; }
}

export const dbAddService = (s: Service) => setDoc(doc(db, 'services', s.id), s);
export const dbUpdateService = (id: string, u: Partial<Service>) => updateDoc(doc(db, 'services', id), u);
export const dbDeleteService = (id: string) => deleteDoc(doc(db, 'services', id));

export const dbAddClient = (c: Client) => setDoc(doc(db, 'clients', c.id), c);
export const dbUpdateClient = (id: string, u: Partial<Client>) => updateDoc(doc(db, 'clients', id), u);
export const dbDeleteClient = (id: string) => deleteDoc(doc(db, 'clients', id));

export const dbAddProject = (p: Project) => setDoc(doc(db, 'projects', p.id), p);
export const dbUpdateProject = (id: string, u: Partial<Project>) => updateDoc(doc(db, 'projects', id), u);
export const dbDeleteProject = (id: string) => deleteDoc(doc(db, 'projects', id));

export const dbAddIncentive = (i: Incentive) => setDoc(doc(db, 'incentives', i.id), i);
export const dbUpdateIncentive = (id: string, u: Partial<Incentive>) => updateDoc(doc(db, 'incentives', id), u);
export const dbDeleteIncentive = (id: string) => deleteDoc(doc(db, 'incentives', id));

export const dbAddSalesEmployee = (e: SalesEmployee) => setDoc(doc(db, 'sales_employees', e.id), e);
export const dbUpdateSalesEmployee = (id: string, u: Partial<SalesEmployee>) => updateDoc(doc(db, 'sales_employees', id), u);
export const dbDeleteSalesEmployee = (id: string) => deleteDoc(doc(db, 'sales_employees', id));

export async function dbResetToStandard() {
  const batch = writeBatch(db);
  [...INITIAL_SERVICES].forEach(i => batch.set(doc(db, 'services', i.id), i));
  [...INITIAL_CLIENTS].forEach(i => batch.set(doc(db, 'clients', i.id), i));
  [...INITIAL_PROJECTS].forEach(i => batch.set(doc(db, 'projects', i.id), i));
  [...INITIAL_INCENTIVES].forEach(i => batch.set(doc(db, 'incentives', i.id), i));
  [...INITIAL_SALES_EMPLOYEES].forEach(i => batch.set(doc(db, 'sales_employees', i.id), i));
  await batch.commit();
}
