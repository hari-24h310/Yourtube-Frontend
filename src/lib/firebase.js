// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFYKNz9Dw_OSTIC7s046F0GX7oyKIFJus",
  authDomain: "yourtube-hari.firebaseapp.com",
  projectId: "yourtube-hari",
  storageBucket: "yourtube-hari.firebasestorage.app",
  messagingSenderId: "200032865433",
  appId: "1:200032865433:web:47c9eb71aa962808103c08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});
export { auth, provider };
