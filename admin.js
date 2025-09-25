import { firebaseConfig } from './firebase-config.js';
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginAdmin = document.getElementById('loginAdmin');
const adminPanel = document.getElementById('adminPanel');
const tbody = document.querySelector('#presensiTable tbody');

document.getElementById('loginAdminBtn').onclick = () =>
  signInWithEmailAndPassword(auth, adminEmail.value, adminPass.value).catch(alert);

document.getElementById('logoutAdminBtn').onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    loginAdmin.style.display="none";
    adminPanel.style.display="block";
    loadData();
  } else {
    loginAdmin.style.display="block";
    adminPanel.style.display="none";
  }
});

async function loadData() {
  tbody.innerHTML = "";
  const snap = await getDocs(collection(db, "presensi"));
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const datang = d.datang || {};
    const pulang = d.pulang || {};
    const row = `<tr>
      <td>${datang.email || pulang.email || ''}</td>
      <td>${docSnap.id.split('_')[1]}</td>
      <td>${datang.time ? new Date(datang.time.seconds*1000).toLocaleString() : ''}</td>
      <td>${datang.lat? datang.lat.toFixed(4)+','+datang.lng.toFixed(4): ''}</td>
      <td>${pulang.time ? new Date(pulang.time.seconds*1000).toLocaleString() : ''}</td>
      <td>${pulang.lat? pulang.lat.toFixed(4)+','+pulang.lng.toFixed(4): ''}</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

// Download CSV
document.getElementById('downloadCsvBtn').onclick = () => {
  let csv = "Email,Tanggal,Datang Time,Datang Loc,Pulang Time,Pulang Loc\n";
  [...tbody.rows].forEach(r => {
    csv += [...r.cells].map(c => `"${c.innerText}"`).join(",") + "\n";
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rekap_presensi.csv';
  a.click();
  URL.revokeObjectURL(url);
};
