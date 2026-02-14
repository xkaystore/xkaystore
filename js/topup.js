/* =============================
   HELPER GLOBAL
============================= */

/* parse: 7,60 | 7.60 | $7.60 */
function parseUSD(val){
  return parseFloat(
    String(val).replace(",", ".").replace(/[^\d.]/g,"")
  ) || 0;
}

/* format rupiah */
function formatIDR(num){
  return Number(num).toLocaleString("id-ID");
}

/* format WIB */
function formatWIB(date){
  return new Date(date).toLocaleString("id-ID", {
    hour12: false,
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* =============================
   WAIT DOM READY
============================= */
document.addEventListener("DOMContentLoaded", () => {

  const supabase = window.supabase.createClient(
    "https://xhsrxxguyylfikbchzke.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc3J4eGd1eXlsZmlrYmNoemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTkwMTgsImV4cCI6MjA4NjE3NTAxOH0.PWCpgiJxsvShgRPK9lVCF3t2GMv9kGEgcC6abz4sYXk"
  );

  /* =============================
     ELEMENT
  ============================== */
  const openBtn   = document.getElementById("openConvert");
  const closeBtn  = document.getElementById("closeConvert");
  const modal     = document.getElementById("convertModal");
  const form      = document.getElementById("convertForm");

  const methodBtn   = document.getElementById("chooseMethod");
  const methodModal = document.getElementById("methodModal");
  const metodeInput = document.getElementById("metode");

  const chooseTujuanBtn = document.getElementById("chooseTujuan");
  const tujuanModal     = document.getElementById("tujuanModal");
  const tujuanInput     = document.getElementById("tujuan");
  const tujuanListBox   = document.getElementById("tujuanList");
  
  const nomorInput = document.getElementById("nomor");
  const usdInput = document.getElementById("usd");
  const idrInput = document.getElementById("idr");

  /* =============================
     OPEN / CLOSE MODAL
  ============================== */
  openBtn?.addEventListener("click", () => modal.classList.add("show"));
  closeBtn?.addEventListener("click", () => modal.classList.remove("show"));

  modal?.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });

  /* =============================
     RATE TOPUP
     1-50  = 17k
     51-500 = 16.5k
     501+  = 16.3k
  ============================= */
  function getRate(usd){
    if (usd <= 50) return 17000;
    if (usd <= 500) return 16500;
    return 16300;
  }

  usdInput?.addEventListener("input", () => {
    const usd = parseUSD(usdInput.value);
    idrInput.value = formatIDR(usd * getRate(usd));
  });

  /* =============================
     DATA LIST
  ============================= */
  const bankList = ["BCA","BRI","BNI","Mandiri","CIMB Niaga","SeaBank","Jago","Permata"];
  const ewalletList = ["DANA","OVO","GoPay","ShopeePay","LinkAja"];

  function fillTujuan(list){
    tujuanListBox.innerHTML = "";
    list.forEach(item=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tujuan-btn";
      btn.textContent = item;

      btn.onclick = ()=>{
        tujuanInput.value = item;
        chooseTujuanBtn.textContent = item;
        tujuanModal.classList.remove("show");
      };

      tujuanListBox.appendChild(btn);
    });
    chooseTujuanBtn.disabled = false;
  }

  /* =============================
     PILIH METODE
  ============================== */
  document.querySelectorAll(".method-btn").forEach(btn=>{
  btn.onclick = ()=>{
    const val = btn.dataset.value;

    metodeInput.value = val;
    methodBtn.textContent = val;
    methodModal.classList.remove("show");

    tujuanInput.value = "";
    chooseTujuanBtn.textContent = "Pilih Pembayaran Dari";

    fillTujuan(val === "Bank Lokal" ? bankList : ewalletList);

    // 🔥 enable nomor
    nomorInput.disabled = false;
    nomorInput.placeholder =
      val === "Bank Lokal"
        ? "Nomor Rekening"
        : "Nomor HP / ID E-Wallet";
  };
});

  methodBtn.onclick = ()=> methodModal.classList.add("show");
  chooseTujuanBtn.onclick = ()=> tujuanModal.classList.add("show");

  /* =============================
     SUBMIT
  ============================== */
  let isSubmitting = false;

  form?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(isSubmitting) return;

    try {
      isSubmitting = true;

      const usd = parseUSD(usdInput.value);
      const idr = usd * getRate(usd);

      if(!form.nama.value || !form.email.value || !metodeInput.value || !tujuanInput.value || !nomorInput.value || !usd){
        alert("Lengkapi semua data dulu ya 🙏");
        return;
      }

      // Waktu WIB langsung dibuat di JS
      const nowWIB = new Date(Date.now() + 7*60*60*1000);

      const { data: inserted, error } = await supabase
        .from("orders")
        .insert([{
          type: "topup",
          nama: form.nama.value.trim(),
          email: form.email.value.trim(),
          metode: metodeInput.value,
          tujuan: tujuanInput.value,
          nomor: nomorInput.value.trim(), // 🔥 baru
          usd,
          idr,
          waktu: nowWIB.toISOString()
        }])
        .select()
        .single();

      if(error) throw error;

      const waktuWIB = formatWIB(inserted.waktu);

      /* WHATSAPP */
      const msg =
`Halo Admin, saya ingin TOP UP PayPal

Waktu: ${waktuWIB}
Nama: ${inserted.nama}
Email: ${inserted.email}
Metode: ${inserted.metode} - ${inserted.tujuan}
Nomor Tujuan: ${inserted.nomor}
Nominal: $${usd}
Total bayar: Rp ${formatIDR(idr)}`;

      window.open(
        "https://wa.me/6285846005280?text=" + encodeURIComponent(msg),
        "_blank"
      );

      form.reset();
      idrInput.value = "";
      chooseTujuanBtn.disabled = true;
      chooseTujuanBtn.textContent = "Pilih Pembayaran Dari";
      modal.classList.remove("show");

    } catch(err){
      console.error(err);
      alert("Gagal simpan order 😢");
    } finally {
      isSubmitting = false;
    }
  });

});