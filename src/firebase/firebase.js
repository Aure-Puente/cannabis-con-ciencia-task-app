//Forebase:
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7xsHAIYzTHiHEP6nhJKkmtcPsFrMVFuI",
  authDomain: "cannabis-con-ciencia-app.firebaseapp.com",
  projectId: "cannabis-con-ciencia-app",
  storageBucket: "cannabis-con-ciencia-app.firebasestorage.app",
  messagingSenderId: "427055636781",
  appId: "1:427055636781:web:c1663a0510be28ed3073a4",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);