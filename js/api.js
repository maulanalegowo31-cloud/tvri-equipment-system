// Fungsi untuk mengambil data dari Google Sheets
function ambilDataInventaris() {
  fetch('/api/getInventaris')
    .then(res => res.json())
    .then(data => {
      isiTabelInventaris(data);
    })
    .catch(err => {
      console.error("Gagal mengambil data:", err);
    });
}

// Fungsi untuk mengisi tabel dengan data
function isiTabelInventaris(data) {
  const tbody = document.querySelector("#tabel-inventaris tbody");
  tbody.innerHTML = "";
  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.nama}</td>
      <td>${row.jenis}</td>
      <td>${row.status}</td>
      <td>${row.lokasi}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Fungsi untuk mengirim data baru ke Google Sheets
function kirimData(formData) {
  fetch('/api/simpanData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(response => {
      alert("Data berhasil dikirim!");
      ambilDataInventaris(); // refresh tabel
    })
    .catch(err => {
      console.error("Gagal mengirim data:", err);
      alert("Gagal mengirim data.");
    });
}

// Event listener form
document.getElementById("form-peminjaman").addEventListener("submit", function (e) {
  e.preventDefault();
  const data = {
    nama: document.getElementById("nama").value,
    jenis: document.getElementById("jenis").value,
    status: "Dipinjam",
    lokasi: document.getElementById("lokasi").value
  };
  kirimData(data);
});

// Jalankan saat halaman dimuat
document.addEventListener("DOMContentLoaded", ambilDataInventaris);
