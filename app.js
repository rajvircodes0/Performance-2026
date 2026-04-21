
let DATA = [];
let META = {};
let charts = {};

const els = {
  search: document.getElementById('globalSearch'),
  month: document.getElementById('monthFilter'),
  status: document.getElementById('statusFilter'),
  designation: document.getElementById('designationFilter'),
  location: document.getElementById('locationFilter'),
  product: document.getElementById('productFilter'),
  clear: document.getElementById('clearFilters'),
  kpiLibrary: document.getElementById('kpiLibrary'),
  topCards: document.getElementById('topCards'),
  resultsTable: document.getElementById('resultsTable'),
  resultCount: document.getElementById('resultCount'),
  dataSummary: document.getElementById('dataSummary'),
  loadError: document.getElementById('loadError'),
  modal: document.getElementById('staffModal'),
  staffDetail: document.getElementById('staffDetail'),
  closeModal: document.getElementById('closeModal'),
  modalCloseBackdrop: document.getElementById('modalCloseBackdrop'),
  downloadJson: document.getElementById('downloadJson')
};

function fmtNumber(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
}

function fmtCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0
  }).format(num);
}

function uniqueValues(field) {
  return [...new Set(DATA.map(r => r[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function fillSelect(select, values, label) {
  select.innerHTML = `<option value="">${label}</option>` + values.map(v => `<option value="${String(v).replaceAll('"','&quot;')}">${v}</option>`).join('');
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key] || 'Unknown';
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});
}

function sum(items, key) {
  return items.reduce((t, item) => t + Number(item[key] || 0), 0);
}

function applyFilters() {
  const q = els.search.value.trim().toLowerCase();
  return DATA.filter(row => {
    const searchMatch = !q || [row['Tahoe id'], row['HRMS ID'], row['Staff Name']]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q));

    const monthMatch = !els.month.value || row['Month'] === els.month.value;
    const statusMatch = !els.status.value || row['Status'] === els.status.value;
    const designationMatch = !els.designation.value || row['Designation'] === els.designation.value;
    const locationMatch = !els.location.value || row['Location'] === els.location.value;
    const productMatch = !els.product.value || row['Product'] === els.product.value;

    return searchMatch && monthMatch && statusMatch && designationMatch && locationMatch && productMatch;
  });
}

function cardTemplate(label, value, note='') {
  return `
    <div class="stat-card">
      <p>${label}</p>
      <h3>${value}</h3>
      <small>${note}</small>
    </div>
  `;
}

function renderCards(rows) {
  const activeCount = rows.filter(r => String(r.Status || '').toLowerCase() === 'active').length;
  const totalRevenue = sum(rows, 'Total Revenue');
  const totalCC = sum(rows, 'Total CC');
  const totalLoan = sum(rows, 'Total Loan');
  const totalAccounts = sum(rows, 'Total Accounts');
  const avgRevenue = rows.length ? totalRevenue / rows.length : 0;

  els.topCards.innerHTML = [
    cardTemplate('Filtered Records', fmtNumber(rows.length), 'Current result set'),
    cardTemplate('Active Staff', fmtNumber(activeCount), 'Status = Active'),
    cardTemplate('Total Revenue', fmtCurrency(totalRevenue), 'Sum of Total Revenue'),
    cardTemplate('Cards / Loans / Accounts', `${fmtNumber(totalCC)} / ${fmtNumber(totalLoan)} / ${fmtNumber(totalAccounts)}`, 'Volume KPIs'),
    cardTemplate('Avg Revenue / Staff', fmtCurrency(avgRevenue), 'Filtered average')
  ].join('');
}

function destroyChart(name) {
  if (charts[name]) charts[name].destroy();
}

function buildChart(id, type, data, options = {}) {
  return new Chart(document.getElementById(id), {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#dfe8ff' } } },
      scales: {
        x: { ticks: { color: '#bcd0f3' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: { ticks: { color: '#bcd0f3' }, grid: { color: 'rgba(255,255,255,0.06)' } }
      },
      ...options
    }
  });
}

function renderCharts(rows) {
  const monthly = Object.values(groupBy(rows, 'Month')).map(group => ({
    month: group[0].Month,
    revenue: sum(group, 'Total Revenue'),
    headcount: group.length
  })).sort((a, b) => String(a.month).localeCompare(String(b.month)));

  destroyChart('revenueTrend');
  destroyChart('headcountTrend');
  destroyChart('designation');
  destroyChart('topPerformers');

  charts.revenueTrend = buildChart('revenueTrendChart', 'line', {
    labels: monthly.map(m => m.month),
    datasets: [{ label: 'Total Revenue', data: monthly.map(m => m.revenue), tension: 0.35 }]
  });

  charts.headcountTrend = buildChart('headcountTrendChart', 'bar', {
    labels: monthly.map(m => m.month),
    datasets: [{ label: 'Headcount', data: monthly.map(m => m.headcount) }]
  });

  const designationGroups = Object.entries(groupBy(rows, 'Designation'))
    .map(([k, v]) => ({ label: k, value: v.length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  charts.designation = buildChart('designationChart', 'doughnut', {
    labels: designationGroups.map(d => d.label),
    datasets: [{ data: designationGroups.map(d => d.value) }]
  }, { scales: {} });

  const byPerson = Object.values(groupBy(rows, 'Staff Name')).map(group => ({
    name: group[0]['Staff Name'],
    revenue: sum(group, 'Total Revenue'),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  charts.topPerformers = buildChart('topPerformersChart', 'bar', {
    labels: byPerson.map(d => d.name),
    datasets: [{ label: 'Total Revenue', data: byPerson.map(d => d.revenue) }]
  }, { indexAxis: 'y' });
}

function renderTable(rows) {
  els.resultCount.textContent = `${rows.length} results`;
  els.resultsTable.innerHTML = rows.slice(0, 300).map((r, idx) => `
    <tr data-index="${idx}">
      <td>${r['Month'] || ''}</td>
      <td>${r['HRMS ID'] || ''}</td>
      <td>${r['Tahoe id'] || ''}</td>
      <td>${r['Staff Name'] || ''}</td>
      <td>${r['Status'] || ''}</td>
      <td>${r['Designation'] || ''}</td>
      <td>${r['Location'] || ''}</td>
      <td>${fmtNumber(r['Total CC'])}</td>
      <td>${fmtNumber(r['Total Loan'])}</td>
      <td>${fmtNumber(r['Total Accounts'])}</td>
      <td>${fmtCurrency(r['Total Revenue'])}</td>
    </tr>
  `).join('');

  [...els.resultsTable.querySelectorAll('tr')].forEach((tr, idx) => {
    tr.addEventListener('click', () => openStaffModal(rows[idx]));
  });
}

function renderKpiLibrary() {
  els.kpiLibrary.innerHTML = META.allKpis.map(k => `<span class="kpi-tag">${k}</span>`).join('');
}

function openStaffModal(row) {
  const renderList = (keys) => keys.map(k => `<li><span>${k}</span><strong>${typeof row[k] === 'number' ? fmtNumber(row[k]) : (row[k] || 0)}</strong></li>`).join('');
  els.staffDetail.innerHTML = `
    <div>
      <p class="eyebrow">Staff KPI detail</p>
      <h2 style="margin:0 0 8px">${row['Staff Name'] || 'Unknown Staff'}</h2>
      <p class="hero-copy">Tahoe ID: ${row['Tahoe id'] || '-'} · ERP / HRMS ID: ${row['HRMS ID'] || '-'} · Month: ${row['Month'] || '-'}</p>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <h4>Profile</h4>
        <dl class="definition-list">
          <dt>Status</dt><dd>${row['Status'] || '-'}</dd>
          <dt>Designation</dt><dd>${row['Designation'] || '-'}</dd>
          <dt>Location</dt><dd>${row['Location'] || '-'}</dd>
          <dt>Product</dt><dd>${row['Product'] || '-'}</dd>
          <dt>Department</dt><dd>${row['Dept'] || '-'}</dd>
          <dt>DOJ</dt><dd>${row['DOJ'] || '-'}</dd>
          <dt>DOL</dt><dd>${row['DOL'] || '-'}</dd>
          <dt>Vintage</dt><dd>${row['Vintage Category'] || '-'}</dd>
        </dl>
      </div>
      <div class="detail-card">
        <h4>Headline KPIs</h4>
        <dl class="definition-list">
          <dt>Total CC</dt><dd>${fmtNumber(row['Total CC'])}</dd>
          <dt>Total Loan</dt><dd>${fmtNumber(row['Total Loan'])}</dd>
          <dt>Total Accounts</dt><dd>${fmtNumber(row['Total Accounts'])}</dd>
          <dt>Total Revenue</dt><dd>${fmtCurrency(row['Total Revenue'])}</dd>
          <dt>Incentive</dt><dd>${fmtCurrency(row['Incentive'])}</dd>
          <dt>Paid MOL Salary</dt><dd>${fmtCurrency(row['Paid MOL Salary'])}</dd>
        </dl>
      </div>
    </div>
    <div class="kpi-columns">
      <div class="kpi-box">
        <h4>Compensation KPIs</h4>
        <ul>${renderList(META.kpiGroups.compensation)}</ul>
      </div>
      <div class="kpi-box">
        <h4>Volume KPIs</h4>
        <ul>${renderList(META.kpiGroups.volumes)}</ul>
      </div>
      <div class="kpi-box">
        <h4>Revenue KPIs</h4>
        <ul>${renderList(META.kpiGroups.revenue)}</ul>
      </div>
    </div>
  `;
  els.modal.classList.remove('hidden');
}

function closeModal() { els.modal.classList.add('hidden'); }

function downloadFiltered(rows) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered-performance-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function render() {
  const rows = applyFilters();
  renderCards(rows);
  renderCharts(rows);
  renderTable(rows);
}

function wireEvents() {
  [els.search, els.month, els.status, els.designation, els.location, els.product]
    .forEach(el => el.addEventListener('input', render));
  els.clear.addEventListener('click', () => {
    els.search.value = '';
    els.month.value = '';
    els.status.value = '';
    els.designation.value = '';
    els.location.value = '';
    els.product.value = '';
    render();
  });
  els.closeModal.addEventListener('click', closeModal);
  els.modalCloseBackdrop.addEventListener('click', closeModal);
  els.downloadJson.addEventListener('click', () => downloadFiltered(applyFilters()));
}

function initializeFromPayload(payload) {
  DATA = payload.records || [];
  META = payload.metadata || {};
  fillSelect(els.month, uniqueValues('Month'), 'All Months');
  fillSelect(els.status, uniqueValues('Status'), 'All Status');
  fillSelect(els.designation, uniqueValues('Designation'), 'All Designations');
  fillSelect(els.location, uniqueValues('Location'), 'All Locations');
  fillSelect(els.product, uniqueValues('Product'), 'All Products');
  els.dataSummary.textContent = `Built from ${META.sourceWorkbook}. The dataset contains ${fmtNumber(META.recordCount)} records across ${fmtNumber((META.months || []).length)} monthly periods.`;
  renderKpiLibrary();
  wireEvents();
  render();
}

async function init() {
  try {
    if (window.__DASHBOARD_PAYLOAD__) {
      initializeFromPayload(window.__DASHBOARD_PAYLOAD__);
      return;
    }
    const res = await fetch('./data/dashboard-data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    initializeFromPayload(payload);
  } catch (err) {
    console.error(err);
    els.loadError.textContent = 'Data did not load. Re-upload the fixed package files to GitHub and make sure index.html is in the repo root.';
  }
}

init();
