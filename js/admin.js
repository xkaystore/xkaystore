/* =========================
   ADMIN PIN LOCK
========================= */

const ADMIN_PIN = "050519"; // 🔥 GANTI PIN KAMU

const lock   = document.getElementById("pinLock");
const input  = document.getElementById("pinInput");
const btn    = document.getElementById("pinBtn");
const error  = document.getElementById("pinError");
const logoutBtn = document.getElementById("logoutBtn");

/* cek kalau sudah unlock sebelumnya */
if(sessionStorage.getItem("admin_ok")){
  lock.style.display = "none";
}

function unlock(){

  if(input.value === ADMIN_PIN){
    sessionStorage.setItem("admin_ok", true);
    lock.style.display = "none";
  }else{
    error.textContent = "PIN salah bro 😅";
    input.value = "";
    lock.querySelector(".pin-box").classList.add("shake");

    setTimeout(()=>{
      lock.querySelector(".pin-box").classList.remove("shake");
    },300);
  }
}

btn.onclick = unlock;

input.addEventListener("keypress", e=>{
  if(e.key === "Enter") unlock();
});

/* =========================
   SUPABASE
========================= */
const SUPABASE_URL = "https://xhsrxxguyylfikbchzke.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc3J4eGd1eXlsZmlrYmNoemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTkwMTgsImV4cCI6MjA4NjE3NTAxOH0.PWCpgiJxsvShgRPK9lVCF3t2GMv9kGEgcC6abz4sYXk";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const list = document.getElementById("adminTestimoniList");
const refreshBtn = document.getElementById("refreshTesti");
const testiPagination = document.getElementById("testiPagination");

let testiData = [];
let testiPage = 1;
const testiPerPage = 5;

/* =========================
   LOAD REVIEWS
========================= */
async function loadTestimoni(){

  list.innerHTML = "Loading...";

  const { data, error } = await db
    .from("reviews")
    .select("*")
    .order("created_at", { ascending:false });

  if(error){
    list.innerHTML = "Gagal load data";
    return;
  }

  testiData = data || [];

  /* reset ke halaman 1 setiap reload */
  testiPage = 1;

  renderTestimoni();
}

function renderTestimoni(){

  list.innerHTML = "";

  const start = (testiPage - 1) * testiPerPage;
  const end   = start + testiPerPage;

  const paginated = testiData.slice(start,end);

  paginated.forEach(item=>{

    const div = document.createElement("div");
    div.className = "admin-item" + (!item.reply ? " pending" : "");

    div.innerHTML = `
      <div class="admin-name">${item.name}</div>
      <div class="admin-text">${item.text}</div>

      ${item.reply ? `
        <div class="admin-replied">
          💬 Admin: ${item.reply}
        </div>
      ` : ""}

      <div class="admin-reply">
        <input placeholder="Balas sebagai admin..." id="reply-${item.id}">
        <button class="btn-admin" onclick="replyTesti(${item.id})">Kirim</button>
        <button class="btn-admin btn-delete" onclick="deleteTesti(${item.id})">Hapus</button>
      </div>
    `;

    list.appendChild(div);
  });

  renderTestiPagination();
}

function renderTestiPagination(){

  if(!testiPagination) return;

  testiPagination.innerHTML = "";

  const totalPages = Math.ceil(testiData.length / testiPerPage);

  for(let i=1;i<=totalPages;i++){

    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn" + (i === testiPage ? " active" : "");

    btn.onclick = ()=>{
      testiPage = i;
      renderTestimoni();
    };

    testiPagination.appendChild(btn);
  }
}

/* =========================
   REPLY
========================= */
async function replyTesti(id){

  const input = document.getElementById(`reply-${id}`);
  const text  = input.value.trim();
  if(!text) return;

  await db
    .from("reviews") // ✅
    .update({ reply: text })
    .eq("id", id);

  loadTestimoni();
}

/* =========================
   DELETE
========================= */
async function deleteTesti(id){

  if(!confirm("Hapus testimoni ini?")) return;

  await db
    .from("reviews") // ✅
    .delete()
    .eq("id", id);

  loadTestimoni();
}

/* =========================
   REALTIME AUTO REFRESH
========================= */
db.channel("reviews-admin-live")
  .on(
    "postgres_changes",
    { event:"*", schema:"public", table:"reviews" },
    ()=>loadTestimoni()
  )
  .subscribe();

refreshBtn?.addEventListener("click", loadTestimoni);

loadTestimoni();

/* =========================
   LOGOUT
========================= */
logoutBtn?.addEventListener("click", ()=>{

  sessionStorage.removeItem("admin_ok");

  lock.style.display = "flex"; // tampilkan lock lagi
  input.value = "";
  input.focus();

});

/* =========================
   ORDERS MANAGEMENT
========================= */
const ordersBody = document.getElementById("ordersBody");
const refreshOrders = document.getElementById("refreshOrders");
const modal       = document.getElementById("orderModal");
const modalNama   = document.getElementById("modalNama");
const modalUsd    = document.getElementById("modalUsd");
const modalType   = document.getElementById("modalType");
const saveBtn     = document.getElementById("saveOrderBtn");
const cancelBtn   = document.getElementById("cancelOrderBtn");
const ordersPagination = document.getElementById("ordersPagination");

let ordersPage = 1;
const ordersPerPage = 5;

let editingId = null;

let ordersData = [];

function formatSimple(dateStr){
  if(!dateStr) return "-";
  const [d,t] = dateStr.split("T");
  const [y,m,day] = d.split("-");
  return `${day}/${m}/${y} ${t.substring(0,5)}`;
}

async function loadOrders(){

  if(!ordersBody) return;

  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("waktu",{ ascending:false });

  if(error){
    ordersBody.innerHTML = "<tr><td colspan='5'>Gagal load</td></tr>";
    return;
  }

  ordersData = data || [];
  ordersPage = 1;   // tambahkan ini
  renderOrders();
}

function renderOrders(){

  ordersBody.innerHTML = "";

  const start = (ordersPage - 1) * ordersPerPage;
  const end   = start + ordersPerPage;

  const paginatedData = ordersData.slice(start, end);

  paginatedData.forEach(item=>{

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatSimple(item.waktu)}</td>
      <td>${item.nama}</td>
      <td>$${Number(item.usd).toLocaleString("en-US")}</td>
      <td>${item.type}</td>
      <td>
        <button class="action-btn btn-edit" onclick="editOrder(${item.id})">✏️</button>
        <button class="action-btn btn-del" onclick="deleteOrder(${item.id})">🗑</button>
      </td>
    `;

    ordersBody.appendChild(tr);
  });

  renderOrdersPagination();
}

function renderOrdersPagination(){

  if(!ordersPagination) return;

  ordersPagination.innerHTML = "";

  const totalPages = Math.ceil(ordersData.length / ordersPerPage);

  for(let i=1;i<=totalPages;i++){

    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn" + (i === ordersPage ? " active" : "");

    btn.onclick = ()=>{
      ordersPage = i;
      renderOrders();
    };

    ordersPagination.appendChild(btn);
  }
}

/* ================= EDIT ================= */
window.editOrder = function(id){

  const item = ordersData.find(x=>x.id===id);
  if(!item) return;

  editingId = id;

  modalNama.value = item.nama || "";
  modalUsd.value  = item.usd || "";
  modalType.value = item.type || "convert";

  modal.classList.add("show");
};

saveBtn?.addEventListener("click", async ()=>{

  if(!editingId) return;

  await db
    .from("orders")
    .update({
      nama: modalNama.value,
      usd: Number(modalUsd.value),
      type: modalType.value
    })
    .eq("id", editingId);

  modal.classList.remove("show");
  editingId = null;

  loadOrders();
});

cancelBtn?.addEventListener("click", ()=>{
  modal.classList.remove("show");
  editingId = null;
});

/* klik luar modal = close */
modal?.addEventListener("click", e=>{
  if(e.target === modal){
    modal.classList.remove("show");
    editingId = null;
  }
});

/* ================= DELETE ================= */
window.deleteOrder = async function(id){

  if(!confirm("Hapus transaksi ini?")) return;

  await db
    .from("orders")
    .delete()
    .eq("id",id);

  loadOrders();
};

/* ================= REALTIME ================= */
db.channel("orders-admin-live")
  .on(
    "postgres_changes",
    { event:"*", schema:"public", table:"orders" },
    ()=>loadOrders()
  )
  .subscribe();

refreshOrders?.addEventListener("click", loadOrders);

loadOrders();