const navButtons = document.querySelectorAll('header nav button');
const panels = document.querySelectorAll('.panel');
const recordsTableBody = document.querySelector('#records-table tbody');
const totalCountEl = document.querySelector('#total-count');
const avgPerLitreEl = document.querySelector('#avg-per-litre');
const reportDetails = document.querySelector('#report-details');
const analyticDetails = document.querySelector('#analytic-details');
const recordInfo = document.querySelector('#record-info');
const workerEndpointInput = document.querySelector('#worker-endpoint');
const saveSettingsBtn = document.querySelector('#save-settings-btn');
const settingsStatus = document.querySelector('#settings-status');

const STORAGE_KEY = 'fuel_verify_records_v1';
const STORAGE_SETTINGS = 'fuel_verify_settings_v1';

let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let settings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}');

function setSection(section) {
  panels.forEach(panel => panel.classList.toggle('visible', panel.id === section));
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => setSection(btn.dataset.section));
});

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  renderUI();
}

function saveSettings() {
  settings = { workerEndpoint: workerEndpointInput.value.trim() };
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  settingsStatus.textContent = 'Saved.';
  setTimeout(() => settingsStatus.textContent = '', 2000);
}

function fetchWorker(path, opts = {}) {
  const base = settings.workerEndpoint || '';
  const url = base ? `${base}${path}` : `http://localhost:8787${path}`;

  return fetch(url, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(opts.headers || {}),
    },
  }).then((r) => r.ok ? r.json() : Promise.reject(new Error('Request failed')));
}

function renderUI() {
  recordsTableBody.innerHTML = '';
  records.forEach((r) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${new Date(r.createdAt).toLocaleString()}</td><td>${r.location}</td><td>${r.fuelType}</td><td>${r.litre}</td><td>${(r.unitPrice || 0).toFixed(2)}</td><td>${(r.cost || 0).toFixed(2)}</td><td>${r.notes || ''}</td>`;
    recordsTableBody.appendChild(row);
  });

  const total = records.reduce((acc, r) => ({ litres: acc.litres + Number(r.litre || 0), cost: acc.cost + Number(r.cost || 0) }), { litres: 0, cost: 0 });
  const avgpl = total.litres > 0 ? (total.cost / total.litres).toFixed(3) : '0';
  totalCountEl.textContent = records.length;
  avgPerLitreEl.textContent = avgpl;

  if (records.length > 0) {
    const report = `Total records: ${records.length}\nTotal litres: ${total.litres.toFixed(2)}\nTotal cost: RM ${total.cost.toFixed(2)}\nAverage RM/litre: ${avgpl}`;
    reportDetails.textContent = report;

    const perFuel = {};
    records.forEach((r) => {
      if (!perFuel[r.fuelType]) perFuel[r.fuelType] = { litres: 0, cost: 0, count: 0 };
      perFuel[r.fuelType].litres += Number(r.litre);
      perFuel[r.fuelType].cost += Number(r.cost);
      perFuel[r.fuelType].count += 1;
    });

    analyticDetails.textContent = JSON.stringify({ total, average_rp_litre: avgpl, byFuel: perFuel }, null, 2);
  } else {
    reportDetails.textContent = 'No report yet. Add records to generate.';
    analyticDetails.textContent = 'No analytics yet.';
  }
}

function appendRecord(record) {
  records.unshift(record);
  if (records.length > 100) records = records.slice(0, 100);
  saveRecords();
}

function showRecordInfo(msg, error=false) {
  recordInfo.textContent = msg;
  recordInfo.style.color = error ? '#b91c1c' : '#065f46';
}

document.getElementById('record-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const location = document.getElementById('location').value.trim();
  const fuelType = document.getElementById('fuel-type').value;
  const litre = Number(document.getElementById('litre').value);
  const notes = document.getElementById('notes').value.trim();

  if (!location || !fuelType || !litre || litre <= 0) {
    showRecordInfo('Please fill all required fields with valid values.', true);
    return;
  }

  try {
    showRecordInfo('Querying fuel price and analyzing ...');
    const response = await fetchWorker('/api/record', {
      method: 'POST',
      body: JSON.stringify({ location, fuelType, litre, notes, history: records }),
    });

    if (response && response.record) {
      appendRecord(response.record);
      showRecordInfo(`Added record at RM ${response.record.unitPrice.toFixed(2)} / litre, cost RM ${response.record.cost.toFixed(2)}.`);
      if (response.stats) {
        reportDetails.textContent = `Last operation:
- totalRecords: ${response.stats.count}\n- totalLitres: ${response.stats.totalLitres.toFixed(2)}\n- totalCost: RM ${response.stats.totalCost.toFixed(2)}\n- average RM/litre: ${response.stats.avgPerLitre}`;
        analyticDetails.textContent = JSON.stringify(response.stats, null, 2);
      }
    }
  } catch (err) {
    console.error(err);
    showRecordInfo('Failed to fetch worker or store record. Check console.', true);
  }

  event.target.reset();
});

saveSettingsBtn.addEventListener('click', saveSettings);

if (settings.workerEndpoint) {
  workerEndpointInput.value = settings.workerEndpoint;
}

renderUI();
