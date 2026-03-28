// Firebase Configuration (Replace with your own project configuration)
const firebaseConfig = {
  apiKey: "AIzaSyBJZe89ACPbg1Ya5PWFizDARnGK-CpSdXc",
  authDomain: "carraaqqii-book.firebaseapp.com",
  projectId: "carraaqqii-book",
  storageBucket: "carraaqqii-book.firebasestorage.app",
  messagingSenderId: "831923269145",
  appId: "1:831923269145:web:5748af8563942e26730488"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
