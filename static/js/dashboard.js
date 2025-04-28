
// Código do Dashboard JS
let allData = [], currentPage=1, rowsPerPage=10, sortAsc=false;
function formatarDataHora(d){ if(!d) return '—'; const dt=new Date(d); return dt.toLocaleDateString('pt-BR')+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function updateTable(){
  const tbody=document.querySelector('#olt-table tbody');
  const fO=document.getElementById('filter-olt').value.toLowerCase();
  const fS=document.getElementById('filter-status').value;
  tbody.innerHTML='';
  let filt=allData.filter(r=>(!fO||r.olt.toLowerCase().includes(fO))&&(!fS||r.status===fS)).sort((a,b)=>sortAsc?(new Date(a.data_queda)-new Date(b.data_queda)):(new Date(b.data_queda)-new Date(a.data_queda)));
  filt.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.status}</td><td>${r.olt}</td><td>${r.modelo}</td><td>${formatarDataHora(r.data_queda)}</td><td>${r.reboot||'—'}</td><td>${formatarDataHora(r.normalizado_em)}</td>`; tbody.appendChild(tr); });
}
async function fetchData(){ const res=await fetch('/api/status'); allData=await res.json(); updateTable(); }
document.getElementById('filter-olt').oninput=()=>{updateTable();};
document.getElementById('filter-status').onchange=()=>{updateTable();};
fetchData(); setInterval(fetchData,1000);
