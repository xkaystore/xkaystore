/* =========================
   SUPABASE CONFIG
========================= */
const SUPABASE_URL = "https://xhsrxxguyylfikbchzke.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc3J4eGd1eXlsZmlrYmNoemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTkwMTgsImV4cCI6MjA4NjE3NTAxOH0.PWCpgiJxsvShgRPK9lVCF3t2GMv9kGEgcC6abz4sYXk";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   ELEMENT
========================= */
const nameInput = document.getElementById("nameInput");
const textInput = document.getElementById("textInput");
const sendBtn   = document.getElementById("sendBtn");
const list      = document.getElementById("reviewList");
const picker    = document.getElementById("starPicker");
const avgScore  = document.getElementById("avgScore");
const avgStars  = document.getElementById("avgStars");
const totalRev  = document.getElementById("totalReview");
const barsBox   = document.getElementById("bars");
const sortSel   = document.getElementById("sortSelect");
const loadBtn = document.getElementById("loadMore");
const LIMIT = 10;
let page = 0;
let currentData = [];

let rating = 5;

/* =========================
   ⭐ STAR PICKER (NEW UX)
   klik per bintang + hover
========================= */
picker.innerHTML = "";

for(let i=1;i<=5;i++){
  const star = document.createElement("span");
  star.textContent = "☆";
  star.dataset.val = i;

  star.onmouseenter = ()=> renderStars(picker, i);
  star.onclick = ()=>{
    rating = i;
    renderStars(picker, rating);
  };

  picker.appendChild(star);
}

picker.onmouseleave = ()=> renderStars(picker, rating);

function renderStars(el, r){
  [...el.children].forEach((s,i)=>{
    s.textContent = i<r ? "★" : "☆";
  });
}

renderStars(picker, rating);

/* =========================
   ADD REVIEW → SUPABASE
========================= */
sendBtn.onclick = async ()=>{

  if(!textInput.value) return;

  sendBtn.disabled = true;
  sendBtn.textContent = "Mengirim...";

  await db.from("reviews").insert({
    name: nameInput.value || "Customer",
    text: textInput.value,
    rating
  });

  nameInput.value="";
  textInput.value="";
  rating=5;

  renderStars(picker,5);

  sendBtn.disabled=false;
  sendBtn.textContent="Kirim Testimoni";

  load();
};

/* =========================
   LOAD DATA
========================= */
async function load(reset=true){

  if(reset){
    page = 0;
    list.innerHTML = "";
    currentData = [];
  }

  let query = db.from("reviews").select("*");

  if(sortSel.value==="high")
    query = query.order("rating",{ascending:false});
  else if(sortSel.value==="low")
    query = query.order("rating",{ascending:true});
  else
    query = query.order("created_at",{ascending:false});

  const from = page * LIMIT;
  const to   = from + LIMIT - 1;

  const {data} = await query.range(from,to);

  if(!data) return;

  currentData = [...currentData, ...data];

  append(data);
  updateStats(currentData);
  
  if(data.length < LIMIT){
    loadBtn.style.display = "none";
  }else{
    loadBtn.style.display = "block";
  }
}

sortSel.onchange = ()=>load(true);

/* =========================
   RELATIVE TIME (INDONESIA)
========================= */

function timeAgo(dateStr){

  const diff = (Date.now() - new Date(dateStr)) / 1000;

  if(diff < 60) return "baru saja";

  const m = diff/60;
  if(m < 60) return `${Math.floor(m)} menit lalu`;

  const h = m/60;
  if(h < 24) return `${Math.floor(h)} jam lalu`;

  const d = h/24;
  if(d < 2) return "kemarin";
  if(d < 7) return `${Math.floor(d)} hari lalu`;

  // fallback tanggal normal WIB
  return new Date(dateStr).toLocaleDateString("id-ID",{
    timeZone:"Asia/Jakarta",
    day:"2-digit",
    month:"short",
    year:"numeric"
  });
}

/* =========================
   AVATAR IMAGE (DiceBear)
========================= */
function getAvatar(name){
  const seed = encodeURIComponent(name || "customer");

  // style: initials / bottts / lorelei / fun-emoji
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundType=gradientLinear`;
}

/* =========================
   RENDER LIST (avatar + WIB time)
========================= */
function append(data){

  data.forEach(r=>{

    const name = r.name || "Customer";
    const avatar = getAvatar(name);

    const div = document.createElement("div");
    div.className="review-card";

    div.innerHTML = `
      <div class="review-head">
        <div class="review-user">
          <div class="avatar">
            <img src="${avatar}">
          </div>
          <div>
            <div class="review-name">${name}</div>
            <div class="review-meta" data-time="${r.created_at}">
              ${timeAgo(r.created_at)}
            </div>
          </div>
        </div>
        <div class="review-stars">${"★".repeat(r.rating)}</div>
      </div>
      <div class="review-text">${r.text}</div>
      ${r.reply ? `<div class="admin-reply-view">💬 Admin: ${r.reply}</div>` : ""}
    `;

    list.appendChild(div);
  });
}

document.getElementById("loadMore").onclick = ()=>{
  page++;
  load(false);
};

/* =========================
   STATS
========================= */
function updateStats(data){

  const total = data.length;

  if(!total){
    avgScore.textContent="0.0";
    totalRev.textContent="0 ulasan";
    barsBox.innerHTML="";
    return;
  }

  const sum = data.reduce((a,b)=>a+b.rating,0);
  const avg = (sum/total).toFixed(1);

  avgScore.textContent = avg;
  totalRev.textContent = `${total} ulasan`;

  renderStars(avgStars, Math.round(avg));

  const counts=[0,0,0,0,0];
  data.forEach(r=>counts[r.rating-1]++);

  barsBox.innerHTML="";

  for(let i=5;i>=1;i--){
    const percent = (counts[i-1]/total)*100;

    barsBox.innerHTML += `
      <div class="bar-row">
        ${i}★
        <div class="bar">
          <div class="bar-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }
}

/* =========================
   REALTIME AUTO UPDATE
========================= */
db.channel("reviews-live")
  .on("postgres_changes",
    { event:"*", schema:"public", table:"reviews" },
    ()=>load(true)
  )
  .subscribe();

load();

/* =========================
   AUTO REFRESH RELATIVE TIME
========================= */

setInterval(()=>{

  document.querySelectorAll("[data-time]").forEach(el=>{
    el.textContent = timeAgo(el.dataset.time);
  });

}, 30000);