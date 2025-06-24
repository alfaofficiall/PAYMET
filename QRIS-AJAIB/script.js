import SETTINGS from './settings.js';

let user = {
  saldo: 0,
  status: false,
  amount: 0,
  transactionId: null,
  interval: null
};

window.buatPembayaran = async function () {
  const jumlahDeposit = parseInt(document.getElementById("jumlah").value);
  if (!jumlahDeposit || jumlahDeposit <= 0) return alert("Masukkan jumlah yang valid!");

  // Pastikan Anda sudah mengisi SETTINGS.js dengan benar
  const { apikey, qrisCode } = SETTINGS.QRIS;
  const res = await fetch(`https://www.alfaofficial.cloud/orderkuota/createpayment?apikey=${apikey}&amount=${jumlahDeposit}&codeqr=${qrisCode}`);
  const json = await res.json();

  // Cek dasar, kalau result tidak ada, gagal.
  if (!json?.result) return alert("❌ Gagal membuat QRIS.");

  const data = json.result;

  // Cek PENTING: Kalau ID transaksi atau gambar QRIS tidak ada, gagal.
  if (!data.idtransaksi || !data.imageqris || !data.imageqris.url) {
    console.error("Data respons tidak lengkap:", data);
    return alert("Gagal mendapatkan data QRIS yang lengkap dari server.");
  }

  // Jika semua data lengkap, baru tampilkan semuanya
  user.status = true;
  user.amount = jumlahDeposit;
  user.transactionId = data.idtransaksi; // Menggunakan idtransaksi

  document.getElementById("inputArea").classList.add("hidden");
  document.getElementById("qrisArea").classList.remove("hidden");
  document.getElementById("batalBtn").classList.remove("hidden");
  document.getElementById("suksesArea").classList.add("hidden");

  document.getElementById("qrisImage").src = data.imageqris.url; // Menggunakan imageqris.url

  document.getElementById("paymentInfo").innerHTML = `
    💰 Jumlah: Rp ${jumlahDeposit.toLocaleString()}<br>
    🆔 Transaksi: ${data.idtransaksi}<br> 
    ⏰ Expired: 5 menit
  `;

  if (user.interval) clearInterval(user.interval);
  user.interval = setInterval(cekStatusPembayaran, SETTINGS.CHECK_INTERVAL_MS);
};

window.batalkanPembayaran = function () {
  if (!user.status) return alert("Tidak ada transaksi aktif.");
  user.status = false;
  clearInterval(user.interval);
  user.transactionId = null;
  user.amount = 0;

  document.getElementById("qrisArea").classList.add("hidden");
  document.getElementById("batalBtn").classList.add("hidden");
  document.getElementById("suksesArea").classList.add("hidden");
  document.getElementById("inputArea").classList.remove("hidden");
};

async function cekStatusPembayaran() {
  if (!user.status) return clearInterval(user.interval);

  const { apikey, merchantId, keyorkut } = SETTINGS.QRIS;

  try {
    const res = await fetch(`https://www.alfaofficial.cloud/orderkuota/cekstatus?apikey=${apikey}&merchant=${merchantId}&keyorkut=${keyorkut}`);
    const json = await res.json();

    if (!json?.data || !Array.isArray(json.data)) {
      console.log("Struktur data status tidak valid.");
      return;
    }

    // Cari transaksi berdasarkan idtransaksi yang sudah kita simpan
    const transaksi = json.data.find(item => item.idtransaksi === user.transactionId);

    if (!transaksi) {
      console.log("Transaksi belum ditemukan, mengecek ulang...");
      return;
    }

    if (transaksi.status === "PAID") {
      user.status = false;
      clearInterval(user.interval);
      user.saldo += user.amount;

      document.getElementById("qrisArea").classList.add("hidden");
      document.getElementById("batalBtn").classList.add("hidden");
      document.getElementById("suksesArea").classList.remove("hidden");

      // Menampilkan ID Transaksi yang asli, bukan random
      document.getElementById("suksesInfo").innerHTML = `
        <strong>Pembayaran Berhasil ✅</strong><br><br>
        💰 Jumlah: Rp ${user.amount.toLocaleString()}<br>
        🆔 ID Transaksi: ${user.transactionId}<br>
        📈 Saldo Baru: Rp ${user.saldo.toLocaleString()}
      `;
    } else {
      console.log("Status: " + transaksi.status + ". Belum dibayar, mengecek ulang...");
    }

  } catch (err) {
    console.error("Gagal cek status:", err);
  }
}
