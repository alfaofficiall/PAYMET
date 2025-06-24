// =======================================================================
// =       KODE LENGKAP - LOGIKA CEPAT & BERISIKO (MENIRU BOT)         =
// =======================================================================

// --- PENGATURAN ---
// Ganti nilai di bawah ini dengan kredensial asli milik Anda.
const SETTINGS = {
  QRIS: {
    apikey: "alfa2025", // Ganti dengan API Key Anda
    merchantId: "OK2385395", // Ganti dengan Merchant ID Anda
    keyorkut: "184646517465972242385395OKCTB1BFD496F29624C01FF8E5728CF69A17", // Ganti dengan Keyorkut Anda
    qrisCode: "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214140263240266770303UMI51440014ID.CO.QRIS.WWW0215ID20253948029410303UMI5204481253033605802ID5919ANDI CALL OK23853956005BLORA61055821162070703A0163044FEE" // Ganti dengan qrisCode Anda
  },
  CHECK_INTERVAL_MS: 5000 // Mengecek setiap 5 detik
};


// --- KODE APLIKASI ---

let user = {
  saldo: 0,
  status: false,
  amount: 0,
  transactionId: null,
  interval: null,
  isPaid: false // Penanda baru untuk mencegah konfirmasi ganda
};

window.buatPembayaran = async function () {
  const jumlahDeposit = parseInt(document.getElementById("jumlah").value);
  if (!jumlahDeposit || jumlahDeposit <= 0) return alert("Masukkan jumlah yang valid!");

  const { apikey, qrisCode } = SETTINGS.QRIS;
  const apiUrl = `https://www.alfaofficial.cloud/orderkuota/createpayment?apikey=${apikey}&amount=${jumlahDeposit}&codeqr=${qrisCode}`;

  try {
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json?.result) return alert("❌ Gagal membuat QRIS: " + (json.message || "Tidak ada result."));

    const data = json.result;

    if (!data.idtransaksi || !data.imageqris || !data.imageqris.url) {
      console.error("Data respons tidak lengkap:", data);
      return alert("Gagal mendapatkan data QRIS yang lengkap dari server.");
    }

    user.status = true;
    user.amount = jumlahDeposit;
    user.transactionId = data.idtransaksi;
    user.isPaid = false; // Set status bayar ke false setiap membuat pembayaran baru

    document.getElementById("inputArea").classList.add("hidden");
    document.getElementById("qrisArea").classList.remove("hidden");
    document.getElementById("batalBtn").classList.remove("hidden");
    document.getElementById("suksesArea").classList.add("hidden");

    document.getElementById("qrisImage").src = data.imageqris.url;
    document.getElementById("paymentInfo").innerHTML = `
      💰 Jumlah: Rp ${jumlahDeposit.toLocaleString()}<br>
      🆔 Transaksi: ${data.idtransaksi}<br> 
      ⏰ Expired: 5 menit
    `;

    if (user.interval) clearInterval(user.interval);
    user.interval = setInterval(cekStatusPembayaran, SETTINGS.CHECK_INTERVAL_MS);

  } catch (err) {
    console.error("Error saat membuat pembayaran:", err);
    alert("Terjadi error. Silakan cek konsol (F12).");
  }
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
  if (!user.status || user.isPaid) return clearInterval(user.interval);

  const { apikey, merchantId, keyorkut } = SETTINGS.QRIS;
  const apiUrl = `https://www.alfaofficial.cloud/orderkuota/cekstatus?apikey=${apikey}&merchant=${merchantId}&keyorkut=${keyorkut}`;

  try {
    const res = await fetch(apiUrl);
    const json = await res.json();
    
    // LOGIKA BARU: Meniru cara kerja bot dengan mencocokkan JUMLAH UANG
    // PERINGATAN: Cara ini tidak aman untuk transaksi serentak.
    if (json?.result && json.result.amount == user.amount) {
      
      // Cek sederhana untuk mencegah konfirmasi berulang
      if (user.status && !user.isPaid) { 
        console.log("Transaksi dengan jumlah yang cocok ditemukan! Menganggap pembayaran berhasil.");
        
        user.isPaid = true; // Tandai sudah lunas agar tidak dicek lagi
        user.status = false;
        clearInterval(user.interval);
        user.saldo += user.amount;

        document.getElementById("qrisArea").classList.add("hidden");
        document.getElementById("batalBtn").classList.add("hidden");
        document.getElementById("suksesArea").classList.remove("hidden");

        document.getElementById("suksesInfo").innerHTML = `
          <strong>Pembayaran Berhasil ✅</strong><br><br>
          💰 Jumlah: Rp ${user.amount.toLocaleString()}<br>
          🆔 ID Transaksi: ${user.transactionId} (Dikonfirmasi berdasarkan jumlah)<br>
          📈 Saldo Baru: Rp ${user.saldo.toLocaleString()}
        `;
      }

    } else {
      console.log(`Mencari transaksi dengan jumlah Rp ${user.amount}... Belum ditemukan.`);
    }
  } catch (err) {
    console.error("Gagal cek status:", err);
  }
}
