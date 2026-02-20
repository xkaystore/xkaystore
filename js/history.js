document.addEventListener("DOMContentLoaded", () => {

  /* =============================
     SUPABASE
  ============================== */
  const supabase = window.supabase.createClient(
    "https://xhsrxxguyylfikbchzke.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc3J4eGd1eXlsZmlrYmNoemtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTkwMTgsImV4cCI6MjA4NjE3NTAxOH0.PWCpgiJxsvShgRPK9lVCF3t2GMv9kGEgcC6abz4sYXk"
  );

  const tbody   = document.querySelector("#historyTable tbody");
  const loading = document.getElementById("loading");
  const empty   = document.getElementById("emptyState");
  const search  = document.getElementById("searchInput");
  const filter  = document.getElementById("typeFilter");
  const pager   = document.getElementById("pagination");
  const totalInfo = document.getElementById("totalInfo");

  const PAGE_SIZE = 10;

  let allData = [];
  let filteredData = [];
  let currentPage = 1;

  /* =============================
     FETCH DATA
  ============================== */
  async function loadHistory(){

    loading.style.display = "block";
    empty.style.display = "none";
    tbody.innerHTML = "";

    try {

      const { data, error } = await supabase
        .from("orders")
        .select("waktu,nama,type,usd,status")
        .order("waktu", { ascending:false });

      if(error) throw error;

      allData = data || [];
      applyFilter();

    } catch(err){
      console.error(err);
      empty.textContent = "Gagal ambil data 😢";
      empty.style.display = "block";
    } finally {
      loading.style.display = "none";
    }
  }

function formatSimple(dateStr){
  if(!dateStr) return "-";

  const d = dateStr.split("T");

  const tanggal = d[0].split("-"); // [YYYY, MM, DD]
  const waktu = d[1].substring(0,5); // HH:MM

  return `${tanggal[2]}/${tanggal[1]}/${tanggal[0]} ${waktu}`;
}

  /* =============================
     RENDER TABLE (NO TIMEZONE LOGIC)
  ============================== */
  function renderTable(){

    tbody.innerHTML = "";

    if(!filteredData.length){
      empty.style.display = "block";
      pager.innerHTML = "";
      return;
    }

    empty.style.display = "none";

    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filteredData.slice(start, start + PAGE_SIZE);

    rows.forEach(item => {
    
      const tr = document.createElement("tr");
    
      const statusText = (item.status || "pending").toLowerCase();
    
      tr.innerHTML = `
        <td>${formatSimple(item.waktu)}</td>
        <td>${item.nama || "-"}</td>
        <td>$${Number(item.usd || 0).toLocaleString("en-US")}</td>
        <td><span class="badge ${item.type}">${item.type}</span></td>
        <td><span class="badge status ${statusText}">${statusText}</span></td>
      `;
    
      tbody.appendChild(tr);
    });

    renderPagination();
  }

  /* =============================
     PAGINATION
  ============================== */
  function renderPagination(){

  pager.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  if(totalPages <= 1) return;

  const maxVisible = 5; // berapa angka ditampilkan

  function createBtn(label, page, active=false, disabled=false){
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "page-btn";

    if(active) btn.classList.add("active");
    if(disabled){
      btn.style.opacity = ".4";
      btn.disabled = true;
    }

    btn.onclick = () => {
      currentPage = page;
      renderTable();
      window.scrollTo({ top:0, behavior:"smooth" });
    };

    pager.appendChild(btn);
  }

  /* ===== PREV ===== */
  createBtn("«", currentPage-1, false, currentPage===1);

  let start = Math.max(1, currentPage - 2);
  let end   = Math.min(totalPages, start + maxVisible - 1);

  if(end - start < maxVisible - 1){
    start = Math.max(1, end - maxVisible + 1);
  }

  /* ===== FIRST + DOTS ===== */
  if(start > 1){
    createBtn(1, 1);
    if(start > 2){
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.className = "page-dots";
      pager.appendChild(dots);
    }
  }

  /* ===== MAIN PAGES ===== */
  for(let i=start; i<=end; i++){
    createBtn(i, i, i===currentPage);
  }

  /* ===== LAST + DOTS ===== */
  if(end < totalPages){
    if(end < totalPages-1){
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.className = "page-dots";
      pager.appendChild(dots);
    }
    createBtn(totalPages, totalPages);
  }

  /* ===== NEXT ===== */
  createBtn("»", currentPage+1, false, currentPage===totalPages);
}

  /* =============================
     FILTER
  ============================== */
  function applyFilter(){
  
    const text = (search.value || "").toLowerCase();
    const type = filter.value;
  
    filteredData = allData.filter(item => {
  
      const matchText =
        (item.nama || "").toLowerCase().includes(text);
  
      const matchType =
        !type || item.type === type;
  
      return matchText && matchType;
    });
  
    totalInfo.textContent = `${filteredData.length} transaksi ditemukan`;
  
    currentPage = 1;
    renderTable();
  }

  search.addEventListener("input", applyFilter);
  filter.addEventListener("change", applyFilter);

  /* =============================
     INIT
  ============================== */
  loadHistory();

});