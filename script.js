import { firebaseConfig } from './firebase-config.js';
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const authDiv = document.getElementById('authDiv');
const mainDiv = document.getElementById('mainDiv');
const userEmail = document.getElementById('userEmail');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

document.getElementById('loginBtn').onclick = () =>
  signInWithEmailAndPassword(auth, email.value, password.value).catch(alert);

document.getElementById('registerBtn').onclick = () =>
  createUserWithEmailAndPassword(auth, email.value, password.value).catch(alert);

document.getElementById('logoutBtn').onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    authDiv.style.display = "none";
    mainDiv.style.display = "block";
    userEmail.innerText = "Login: " + user.email;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => video.srcObject = stream);
  } else {
    authDiv.style.display = "block";
    mainDiv.style.display = "none";
  }
});

async function presensi(tipe) {
  const user = auth.currentUser;
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];
  const docId = `${user.uid}_${today}`;
  const docRef = doc(db, "presensi", docId);
  const snapshot = await getDoc(docRef);

  // Cek jika sudah presensi tipe tsb
  if (snapshot.exists() && snapshot.data()[tipe]) {
    alert(`Anda sudah presensi ${tipe} hari ini`);
    return;
  }

  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  canvas.toBlob(async blob => {
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const storageRef = ref(storage, `presensi/${docId}_${tipe}.jpg`);
      await uploadBytes(storageRef, blob);
      const fotoURL = await getDownloadURL(storageRef);
      await setDoc(docRef, {
        [tipe]: {
          time: new Date(),
          lat, lng,
          foto: fotoURL,
          email: user.email
        }
      }, { merge: true });
      alert(`Presensi ${tipe} berhasil`);
    }, () => alert("Lokasi gagal diakses"));
  }, 'image/jpeg', 0.9);
}

document.getElementById('datangBtn').onclick = () => presensi('datang');
document.getElementById('pulangBtn').onclick = () => presensi('pulang');
