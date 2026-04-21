
const D = window.__DASHBOARD_DATA__;
const views = document.querySelectorAll('.view');
const tabs = document.querySelectorAll('.tab');
const charts = {};

const fmtNum = v => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(Number(v||0));
const fmtAED = v => `AED ${new Intl.NumberFormat('en-US', {maximumFractionDigits:1}).format(Number(v||0)/1000000)}M`;
const fmtAEDFull = v => `AED ${new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(Number(v||0))}`;

tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(t => t.classList.remove('active'));
  views.forEach(v => v.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
}));

document.getElementById('periodLabel').textContent = `OVERALL KPIS · ${D.meta.period}`;

function card(cls, mini, big, sub, bigClass=''){
  return `<div class="card ${cls}"><div class="mini">${mini}</div><div class="big ${bigClass}">${big}</div><div class="sub">${sub}</div></div>`;
}

document.getElementById('overviewCards').innerHTML = [
  card('', 'Total Headcount', fmtNum(D.overall.totalHeadcount), 'Unique staff on sheet'),
  card('green', 'Active Staff', fmtNum(D.overall.activeStaff), 'Currently employed'),
  card('orange', 'Total CC Bookings', fmtNum(D.overall.totalCC), 'All banks • 3 months'),
  card('purple', 'Total Loan Bookings', fmtAEDFull(D.overall.totalLoan), `${fmtNum(D.overall.totalLoan)} disbursed`, 'blue'),
  card('', 'Total Card Revenue', fmtAED(D.overall.totalCardRevenue), 'Card commissions', 'blue'),
  card('green', 'Total Loan Revenue', fmtAED(D.overall.totalLoanRevenue), 'Loan commissions'),
  card('orange', 'Total Revenue', fmtAED(D.overall.totalRevenue), 'Cards + Loans + Accounts', 'green'),
  card('pink', 'Total Cost', fmtAED(D.overall.totalCost), 'Salary + Incentives', 'pink')
].join('');

function mkChart(id, type, data, options={}){
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), {
    type,
    data,
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{enabled:true}},
      scales:{
        x:{ticks:{color:'#5f7ea8'}, grid:{color:'rgba(255,255,255,0.05)'}},
        y:{ticks:{color:'#5f7ea8'}, grid:{color:'rgba(255,255,255,0.05)'}}
      },
      ...options
    }
  });
}

const months = D.monthlyTrend.map(x => x.MonthLabel);
mkChart('ccTrendChart','line',{
  labels: months,
  datasets:[{data:D.monthlyTrend.map(x => x['Total CC']), borderColor:'#67b7ff', backgroundColor:'rgba(103,183,255,0.18)', fill:true, tension:.35}]
});
mkChart('loanTrendChart','bar',{
  labels: months,
  datasets:[{data:D.monthlyTrend.map(x => x['Total Loan']/1000000), backgroundColor:'#ffb84d'}]
});

const sb = document.getElementById('statusBars');
const maxStatus = Math.max(...D.statusBreakdown.map(x => x.count),1);
const statusClasses = ['green','pink','orange','purple'];
sb.innerHTML = D.statusBreakdown.map((x,i)=>`
  <div class="status-row">
    <div class="status-label"><span>${x.Status}</span><span>${fmtNum(x.count)}</span></div>
    <div class="track"><div class="fill ${statusClasses[i%statusClasses.length]}" style="width:${(x.count/maxStatus)*100}%">${fmtNum(x.count)}</div></div>
  </div>
`).join('');

const loc = document.getElementById('locationSplit');
loc.className = 'location-grid';
loc.innerHTML = D.locationSplit.slice(0,4).map((x,i)=>`
  <div class="location-box">
    <div class="pct" style="color:${i%2===0?'#67b7ff':'#ffb84d'}">~${x.pct}%</div>
    <div class="name">${x.location}</div>
    <div class="cc">${fmtNum(x.cc)} CC</div>
  </div>
`).join('');

mkChart('bankRevenueChart','bar',{
  labels:D.byBank.slice(0,10).map(x=>x.bank || 'Unknown'),
  datasets:[{data:D.byBank.slice(0,10).map(x=>x.revenue), backgroundColor:'#67b7ff'}]
},{
  plugins:{legend:{display:false}},
});
document.getElementById('bankTable').innerHTML = D.byBank.map(x=>`
  <tr><td>${x.bank||'-'}</td><td>${fmtNum(x.headcount)}</td><td>${fmtNum(x.cc)}</td><td>${fmtAEDFull(x.loan)}</td><td>${fmtAEDFull(x.revenue)}</td></tr>
`).join('');

mkChart('bhRevenueChart','bar',{
  labels:D.byBH.slice(0,12).map(x=>x.bh || 'Unknown'),
  datasets:[{data:D.byBH.slice(0,12).map(x=>x.revenue), backgroundColor:'#b191ff'}]
});
document.getElementById('bhTable').innerHTML = D.byBH.map(x=>`
  <tr><td>${x.bh||'-'}</td><td>${fmtNum(x.headcount)}</td><td>${fmtNum(x.cc)}</td><td>${fmtAEDFull(x.loan)}</td><td>${fmtAEDFull(x.revenue)}</td></tr>
`).join('');

function renderStaff(rows){
  document.getElementById('staffTable').innerHTML = rows.slice(0,300).map(x=>`
    <tr>
      <td>${x['Staff Name']||'-'}</td>
      <td>${x['Tahoe id']||'-'}</td>
      <td>${x['HRMS ID']||'-'}</td>
      <td>${x['Status']||'-'}</td>
      <td>${x['Designation']||'-'}</td>
      <td>${x['Location']||'-'}</td>
      <td>${x['Bank Code']||'-'}</td>
      <td>${fmtAEDFull(x['Total Revenue'])}</td>
    </tr>
  `).join('');
}
renderStaff(D.staff);

document.getElementById('searchInput').addEventListener('input', e=>{
  const q = e.target.value.trim().toLowerCase();
  const rows = !q ? D.staff : D.staff.filter(x =>
    [x['Tahoe id'], x['HRMS ID'], x['Staff Name']].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
  );
  renderStaff(rows);
});

mkChart('topPerfChart','bar',{
  labels:D.topPerformers.slice(0,15).map(x=>x['Staff Name']),
  datasets:[{data:D.topPerformers.slice(0,15).map(x=>x['Total Revenue']), backgroundColor:'#69d89a'}]
},{
  indexAxis:'y'
});
document.getElementById('topPerfTable').innerHTML = D.topPerformers.map((x,i)=>`
  <tr>
    <td>${i+1}</td>
    <td>${x['Staff Name']||'-'}</td>
    <td>${x['Tahoe id']||'-'}</td>
    <td>${x['HRMS ID']||'-'}</td>
    <td>${x['Designation']||'-'}</td>
    <td>${x['Location']||'-'}</td>
    <td>${fmtNum(x['Total CC'])}</td>
    <td>${fmtAEDFull(x['Total Loan'])}</td>
    <td>${fmtAEDFull(x['Total Revenue'])}</td>
  </tr>
`).join('');
