const STORAGE_KEY = "fuel-verify-records";
const AI_ENDPOINT_KEY = "fuel-verify-ai-endpoint";

const fuelForm = document.getElementById("fuel-form");
const recordBody = document.getElementById("record-body");
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");
const clearAllBtn = document.getElementById("clear-all");

const totalRecordsEl = document.getElementById("total-records");
const totalLitreEl = document.getElementById("total-litre");
const totalPriceEl = document.getElementById("total-price");
const avgPriceEl = document.getElementById("avg-price");
const aiEndpointInput = document.getElementById("ai-endpoint");
const generateAiBtn = document.getElementById("generate-ai");
const aiStatusEl = document.getElementById("ai-status");
const aiOutputEl = document.getElementById("ai-output");

let records = loadRecords();

function supportsStorage() {
  try {
    const key = "__fuel_verify_test__";
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadRecords() {
  if (!supportsStorage()) return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  if (!supportsStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadAiEndpoint() {
  if (!supportsStorage()) return "";
  return localStorage.getItem(AI_ENDPOINT_KEY) || "";
}

function saveAiEndpoint(value) {
  if (!supportsStorage()) return;
  localStorage.setItem(AI_ENDPOINT_KEY, value);
}

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderOverview() {
  const totalRecords = records.length;
  const totalLitre = records.reduce((sum, item) => sum + Number(item.litre), 0);
  const totalPrice = records.reduce((sum, item) => sum + Number(item.price), 0);
  const avgPrice = totalLitre > 0 ? totalPrice / totalLitre : 0;

  totalRecordsEl.textContent = String(totalRecords);
  totalLitreEl.textContent = formatNumber(totalLitre);
  totalPriceEl.textContent = formatNumber(totalPrice);
  avgPriceEl.textContent = formatNumber(avgPrice);
}

function renderRecords() {
  if (records.length === 0) {
    recordBody.innerHTML = '<tr><td colspan="7" class="empty-state">No records yet. Add your first one above.</td></tr>';
    return;
  }

  recordBody.innerHTML = records
    .map((record) => {
      const pricePerLitre = Number(record.litre) > 0 ? Number(record.price) / Number(record.litre) : 0;

      return `
        <tr>
          <td>${formatDate(record.date)}</td>
          <td>${escapeHtml(record.location)}</td>
          <td>${escapeHtml(record.fuelType)}</td>
          <td>${formatNumber(record.litre)}</td>
          <td>${formatNumber(record.price)}</td>
          <td>${formatNumber(pricePerLitre)}</td>
          <td><button class="remove-btn" data-id="${record.id}" type="button">Remove</button></td>
        </tr>
      `;
    })
    .join("");
}

function renderApp() {
  renderOverview();
  renderRecords();
}

function getRecordsForAi() {
  return records.slice(0, 50).map((item) => ({
    date: item.date,
    location: item.location,
    fuelType: item.fuelType,
    litre: Number(item.litre),
    price: Number(item.price),
  }));
}

async function generateAiInsights() {
  if (!aiEndpointInput || !aiStatusEl || !aiOutputEl || !generateAiBtn) return;

  const endpoint = aiEndpointInput.value.trim();
  if (!endpoint) {
    aiStatusEl.textContent = "Please enter your Cloudflare Worker API URL first.";
    return;
  }

  if (records.length === 0) {
    aiStatusEl.textContent = "Add at least one record before generating AI insights.";
    return;
  }

  saveAiEndpoint(endpoint);
  generateAiBtn.disabled = true;
  aiStatusEl.textContent = "Generating insights with Cloudflare AI...";
  aiOutputEl.textContent = "";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: getRecordsForAi(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const output = typeof data.insights === "string" ? data.insights : JSON.stringify(data, null, 2);
    aiStatusEl.textContent = "Insights ready.";
    aiOutputEl.textContent = output;
  } catch (error) {
    aiStatusEl.textContent = "Failed to get AI insights. Check Worker URL and deployment.";
    aiOutputEl.textContent = error instanceof Error ? error.message : "Unknown error";
  } finally {
    generateAiBtn.disabled = false;
  }
}

function resetForm() {
  fuelForm.reset();
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

if (fuelForm) {
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

if (aiEndpointInput) {
  aiEndpointInput.value = loadAiEndpoint();
}

fuelForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newRecord = {
    id: generateId(),
    date: document.getElementById("date").value,
    location: document.getElementById("location").value.trim(),
    fuelType: document.getElementById("fuelType").value,
    litre: Number(document.getElementById("litre").value),
    price: Number(document.getElementById("price").value),
  };

  if (!newRecord.date || !newRecord.location || !newRecord.fuelType) {
    window.alert("Please fill in date, location and fuel type.");
    return;
  }

  if (newRecord.litre <= 0 || newRecord.price < 0) {
    window.alert("Please enter valid litre and price values.");
    return;
  }

  records.unshift(newRecord);
  saveRecords();
  renderApp();
  resetForm();
});

recordBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const id = target.dataset.id;
  if (!id) return;

  records = records.filter((record) => record.id !== id);
  saveRecords();
  renderApp();
});

clearAllBtn.addEventListener("click", () => {
  if (records.length === 0) return;

  const confirmed = window.confirm("Clear all refueling records?");
  if (!confirmed) return;

  records = [];
  saveRecords();
  renderApp();
});

if (generateAiBtn) {
  generateAiBtn.addEventListener("click", () => {
    generateAiInsights();
  });
}

for (const button of tabButtons) {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    const activePanel = document.getElementById(button.dataset.tab);
    if (!activePanel) return;
    activePanel.classList.add("active");
  });
}

if (
  fuelForm &&
  recordBody &&
  clearAllBtn &&
  totalRecordsEl &&
  totalLitreEl &&
  totalPriceEl &&
  avgPriceEl &&
  aiStatusEl &&
  aiOutputEl
) {
  renderApp();
} else {
  console.error("Fuel Verify initialization failed: missing required DOM elements.");
}
