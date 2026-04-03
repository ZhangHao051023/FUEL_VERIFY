const STORAGE_KEY = "fuel-verify-records";

const fuelForm = document.getElementById("fuel-form");
const recordBody = document.getElementById("record-body");
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");
const clearAllBtn = document.getElementById("clear-all");
const generateAiBtn = document.getElementById("generate-ai");
const aiOutputEl = document.getElementById("ai-output");

const totalRecordsEl = document.getElementById("total-records");
const totalLitreEl = document.getElementById("total-litre");
const totalPriceEl = document.getElementById("total-price");
const avgPriceEl = document.getElementById("avg-price");

const AI_ENDPOINT = window.FUEL_VERIFY_AI_ENDPOINT || "";

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

function getOverviewSnapshot() {
  const totalRecords = records.length;
  const totalLitre = records.reduce((sum, item) => sum + Number(item.litre), 0);
  const totalPrice = records.reduce((sum, item) => sum + Number(item.price), 0);
  const avgPrice = totalLitre > 0 ? totalPrice / totalLitre : 0;

  return {
    totalRecords,
    totalLitre: Number(formatNumber(totalLitre)),
    totalPrice: Number(formatNumber(totalPrice)),
    avgPricePerLitre: Number(formatNumber(avgPrice)),
  };
}

async function requestAiInsight() {
  if (!aiOutputEl) return;

  if (!AI_ENDPOINT) {
    aiOutputEl.textContent =
      "Cloudflare AI is not configured yet. Set window.FUEL_VERIFY_AI_ENDPOINT in index.html or deploy the Worker and connect its URL.";
    return;
  }

  if (records.length === 0) {
    aiOutputEl.textContent = "Add at least one record before generating AI insight.";
    return;
  }

  const payload = {
    overview: getOverviewSnapshot(),
    records: records.slice(0, 30),
  };

  aiOutputEl.textContent = "Generating insight from Cloudflare AI...";
  if (generateAiBtn) generateAiBtn.disabled = true;

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.insight || data.result || data.response || "No insight returned.";
    aiOutputEl.textContent = String(aiText);
  } catch (error) {
    aiOutputEl.textContent = `Failed to get AI insight: ${error.message}`;
  } finally {
    if (generateAiBtn) generateAiBtn.disabled = false;
  }
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
    requestAiInsight();
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
  aiOutputEl
) {
  renderApp();
} else {
  console.error("Fuel Verify initialization failed: missing required DOM elements.");
}
