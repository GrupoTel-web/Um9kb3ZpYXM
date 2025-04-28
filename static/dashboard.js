let allData = [], currentPage=1, rowsPerPage=10, sortAsc=false;
let beepAtivado=true, oldDown=new Set();

function formatarDataHora(d){
  if(!d) return '—';
  const dt=new Date(d);
  return dt.toLocaleDateString('pt-BR')+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}

function beep(){
  if(!beepAtivado) return;
  const ctx=new (window.AudioContext||window.webkitAudioContext)();
  const osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.type='sine';
  osc.frequency.setValueAtTime(400,ctx.currentTime);
  gain.gain.setValueAtTime(0.1,ctx.currentTime);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime+2);
}

function updateTable(){
  const tbody=document.querySelector('#olt-table tbody');
  const fO=filterOlt.value.toLowerCase(), fS=filterStatus.value;
  tbody.innerHTML='';
  let filt=allData.filter(r=>(!fO||r.olt.toLowerCase().includes(fO))&&(!fS||r.status===fS))
    .sort((a,b)=>{
      const da=new Date(a.data_queda), db=new Date(b.data_queda);
      return sortAsc?da-db:db-da;
    });
  const total=Math.ceil(filt.length/rowsPerPage);
  const start=(currentPage-1)*rowsPerPage;
  filt.slice(start,start+rowsPerPage).forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td class="status">${r.status==='DOWN'?'<i class="fas fa-circle text-danger me-1"></i>DOWN':'<i class="fas fa-circle text-success me-1"></i>UP'}</td>
      <td>${r.olt}</td><td>${r.modelo}</td>
      <td>${formatarDataHora(r.data_queda)}</td>
      <td class="${r.reboot==='true'?'reboot-true':'reboot-false'}">${r.reboot||'—'}</td>
      <td>${formatarDataHora(r.normalizado_em)}</td>`;
    tbody.appendChild(tr);
  });
  renderPagination(total);
}

function renderPagination(total){
  const p=document.getElementById('pagination'); p.innerHTML='';
  for(let i=1;i<=total;i++){
    const btn=document.createElement('button');
    btn.textContent=i;
    if(i===currentPage) btn.classList.add('disabled');
    btn.onclick=()=>{currentPage=i;updateTable();};
    p.appendChild(btn);
  }
}

function resetFilters(){ filterOlt.value=''; filterStatus.value=''; currentPage=1; updateTable(); }

async function fetchData(){
  const res=await fetch('/api/status'), data=await res.json();
  const downNow=new Set(data.filter(d=>d.status==='DOWN').map(d=>d.olt));
  for(let olt of downNow){
    if(!oldDown.has(olt)){
      beep();
      oldDown.add(olt);
      if(Notification.permission==='granted')
        new Notification('OLT DOWN',{body:`${olt} caiu!`});
    }
  }
  oldDown=new Set(downNow);
  allData=data; updateTable();
}

document.getElementById('sort-date').onclick=()=>{ sortAsc=!sortAsc; updateTable(); };
document.getElementById('themeToggle').onclick=()=>{
  const cur=document.documentElement.getAttribute('data-theme');
  const nxt=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',nxt);
  localStorage.setItem('theme',nxt);
};
document.getElementById('beepToggle').onclick=()=>{
  beepAtivado=!beepAtivado;
  const ic=document.getElementById('beepToggle').querySelector('i');
  ic.classList.toggle('fa-volume-up');
  ic.classList.toggle('fa-volume-mute');
};
if(localStorage.getItem('theme'))
  document.documentElement.setAttribute('data-theme',localStorage.getItem('theme'));
if(Notification.permission!=='granted')
  Notification.requestPermission();

fetchData();
setInterval(fetchData,1000);

const filterOlt=document.getElementById('filter-olt');
const filterStatus=document.getElementById('filter-status');
filterOlt.oninput=()=>{currentPage=1;updateTable();};
filterStatus.onchange=()=>{currentPage=1;updateTable();};

function exportTable(){
  const ws=XLSX.utils.json_to_sheet(allData.map(r=>({
    Status:r.status, OLT:r.olt, Modelo:r.modelo,
    "Data Queda":formatarDataHora(r.data_queda),
    Reboot:r.reboot||'—',
    Normalizado:formatarDataHora(r.normalizado_em)
  })));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'OLTs');
  XLSX.writeFile(wb,'olts_dashboard.xlsx');
}