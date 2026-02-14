/* =================================================
   XKAY STORE — CLEAN & FIXED FULL SCRIPT
   (tanpa ubah fitur, cuma dirapihin & dibenerin)
================================================= */
const body      = document.body;
const nav       = document.querySelector("nav");
const menu      = document.getElementById("menu");
const themeBtn  = document.getElementById("themeBtn");
const hamburger = document.querySelector(".hamburger");

const waFloat = document.querySelector(".wa-float");
const tooltip = document.querySelector(".wa-tooltip");
const bubble  = document.getElementById("waBubble");

/* =================================================
   🌙 THEME SYSTEM
================================================= */

function applyTheme(theme) {
  body.classList.toggle("light", theme === "light");
  updateThemeIcon();
}

function updateThemeIcon() {
  if (!themeBtn) return;
  themeBtn.textContent =
    body.classList.contains("light") ? "🌙" : "☀️";
}

function toggleMode() {
  const isLight = body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  updateThemeIcon();
}

window.toggleMode = toggleMode; // supaya onclick HTML tetap jalan

// first load
(function initTheme(){
  const saved = localStorage.getItem("theme");

  if (saved) {
    applyTheme(saved);
  } else {
    const systemDark =
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(systemDark ? "dark" : "light");
  }
})();

// follow system realtime
window.matchMedia("(prefers-color-scheme: dark)")
.addEventListener("change", e => {
  if (!localStorage.getItem("theme")) {
    applyTheme(e.matches ? "dark" : "light");
  }
});

/* =================================================
   ☰ NAVBAR / HAMBURGER
================================================= */

function toggleMenu(btn){
  menu.classList.toggle("show");
  btn.classList.toggle("active");
  nav.classList.toggle("scrolled", menu.classList.contains("show"));
}

window.toggleMenu = toggleMenu; // support onclick

function closeMenu(){
  menu.classList.remove("show");
  hamburger?.classList.remove("active");
}

// klik luar
document.addEventListener("click", e=>{
  if(!e.target.closest("nav")) closeMenu();
});

// klik link menu
document.querySelectorAll(".dropdown a").forEach(a=>{
  a.addEventListener("click", closeMenu);
});

// shadow scroll
window.addEventListener("scroll", ()=>{
  nav.classList.toggle("scrolled", window.scrollY > 10);
});

/* =================================================
   🟢 TOOLTIP FIRST SHOW
================================================= */

window.addEventListener("load", ()=>{
  if(!waFloat) return;

  waFloat.classList.add("show-tooltip");
  setTimeout(()=>{
    waFloat.classList.remove("show-tooltip");
  }, 3000);
});

/* =================================================
   💬 CHAT BUBBLE
================================================= */

function showBubble(){
  if(!bubble) return;

  bubble.classList.add("show");

  setTimeout(()=>{
    bubble.classList.remove("show");
  }, 5000);
}

setTimeout(showBubble, 4000);
setInterval(showBubble, 45000);

bubble?.addEventListener("click", ()=>{
  waFloat.click();
});

/* =================================================
   🕒 JAM ONLINE DINAMIS
================================================= */

const openHour  = 6;
const closeHour = 23;

function updateOnlineStatus(){
  if(!tooltip) return;

  const hour = parseInt(
    new Date().toLocaleString("en-US", {
      hour:"numeric",
      hour12:false,
      timeZone:"Asia/Jakarta"
    })
  );

  if(hour >= openHour && hour < closeHour){
    tooltip.textContent = "🟢 Online sekarang";
  } else {
    tooltip.textContent = "🔴 Offline • buka 06:00";
  }
}

updateOnlineStatus();
setInterval(updateOnlineStatus, 60000);

/* =========================
   GLOBAL ORDERS FLOATING
========================= */
const toastContainer = document.getElementById("orderToastContainer");

if(toastContainer){

  const supabase = window.supabase.createClient(
    "https://xhsrxxguyylfikbchzke.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc3J4eGd1eXlsZmlrYmNoemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTkwMTgsImV4cCI6MjA4NjE3NTAxOH0.PWCpgiJxsvShgRPK9lVCF3t2GMv9kGEgcC6abz4sYXk"
  );

  let ordersData = [];
  let currentIndex = 0;

  function showToast(item){

    const div = document.createElement("div");
    div.className = "toast";

    const usdFormatted = Number(item.usd).toLocaleString("en-US");

    div.innerHTML =
      `💸 ${item.nama} berhasil ${item.type} <b>$${usdFormatted}</b>`;

    toastContainer.appendChild(div);

    setTimeout(()=>{
      div.classList.add("fade");
      setTimeout(()=>div.remove(),400);
    },4000);
  }

  async function loadOrders(){

    const { data, error } = await supabase
      .from("orders")
      .select("nama,type,usd")
      .order("usd",{ ascending:false });

    if(error || !data?.length) return;

    ordersData = data;
    startLoop();
  }

  function startLoop(){

    setInterval(()=>{

      if(!ordersData.length) return;

      showToast(ordersData[currentIndex]);

      currentIndex++;

      if(currentIndex >= ordersData.length){
        currentIndex = 0;
      }

    },5000); // tiap 5 detik muncul baru
  }

  loadOrders();
}