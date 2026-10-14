"use strict";

const SERIES = [
  { id: "chart-ph", key: "ph", label: "pH", color: "#4fc3f7" },
  { id: "chart-turbidity", key: "turbidity_ntu", label: "Turbidity (NTU)", color: "#ab47bc" },
  { id: "chart-tds", key: "tds_ppm", label: "TDS (ppm)", color: "#66bb6a" },
  { id: "chart-do", key: "dissolved_oxygen_mgL", label: "Dissolved Oxygen (mg/L)", color: "#29b6f6" },
  { id: "chart-temp", key: "temperature_c", label: "Temperature (°C)", color: "#ffa726" },
];

const charts = {};
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showError(message) {
  const box = $("error-msg");
  box.textContent = message;
  box.hidden = !message;
}

function logLine(text, cls) {
  const consoleEl = $("console");
  consoleEl.appendChild(el("div", `line ${cls}`, text));
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function statCard(label, value, suffix, cls) {
  const card = el("div", `stat-card ${cls || ""}`);
  card.appendChild(el("div", "label", label));
  const val = el("div", "value", String(value));
  if (suffix) val.appendChild(el("span", "stat-suffix", ` ${suffix}`));
  card.appendChild(val);
  return card;
}

function renderStats(summary) {
  const root = $("stat-cards");
  root.replaceChildren();
  const pct = (n) => (summary.total ? `${Math.round((n / summary.total) * 100)}%` : "0%");
  root.appendChild(statCard("Samples", summary.total));
  root.appendChild(statCard("Safe", summary.counts.SAFE, pct(summary.counts.SAFE), "safe"));
  root.appendChild(statCard("Warning", summary.counts.WARNING, pct(summary.counts.WARNING), "warning"));
  root.appendChild(statCard("Unsafe", summary.counts.UNSAFE, pct(summary.counts.UNSAFE), "unsafe"));
  root.appendChild(statCard("Avg pH", summary.avg_ph));
  root.appendChild(statCard("Avg Turbidity", summary.avg_turbidity, "NTU"));
}

function renderStrip(readings) {
  const strip = $("status-strip");
  const hover = $("strip-hover");
  strip.replaceChildren();
  readings.forEach((r) => {
    const seg = el("div", `seg ${r.status}`);
    seg.title = `${r.timestamp} — ${r.status}`;
    seg.addEventListener("mouseenter", () => {
      hover.textContent = `${r.timestamp} — pH ${r.ph}, Turbidity ${r.turbidity_ntu} NTU, TDS ${r.tds_ppm} ppm → ${r.status}`;
    });
    seg.addEventListener("mouseleave", () => {
      hover.textContent = "Hover a bar for details";
    });
    strip.appendChild(seg);
  });
}

function drawChart(series, readings, thresholds) {
  if (charts[series.id]) charts[series.id].destroy();
  const band = thresholds[series.key];
  charts[series.id] = new Chart($(series.id).getContext("2d"), {
    type: "line",
    data: {
      labels: readings.map((r) => r.timestamp.slice(11)),
      datasets: [{
        label: series.label,
        data: readings.map((r) => r[series.key]),
        borderColor: series.color,
        tension: 0.3,
        pointRadius: 2,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: series.label, color: "#e6edf7", font: { size: 13 } },
      },
      scales: {
        x: { ticks: { color: "#8fa0bd", maxTicksLimit: 6 }, grid: { color: "#22304a" } },
        y: { ticks: { color: "#8fa0bd" }, grid: { color: "#22304a" } },
      },
    },
    plugins: [{
      id: `band-${series.id}`,
      beforeDraw(chart) {
        const { chartArea, scales, ctx } = chart;
        if (!chartArea) return;
        const top = scales.y.getPixelForValue(band.max);
        const bottom = scales.y.getPixelForValue(band.min);
        ctx.save();
        ctx.fillStyle = "rgba(46,125,50,0.12)";
        ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top);
        ctx.restore();
      },
    }],
  });
}

function renderAlerts(alerts) {
  const list = $("alerts-list");
  list.replaceChildren();
  $("alert-count-label").textContent = `(${alerts.length} raised this session)`;
  if (!alerts.length) {
    list.appendChild(el("p", "muted", "No alerts raised."));
    return;
  }
  alerts.forEach((line) => {
    const match = /^\[(\w+)\]\s+(\S+\s\S+)\s+--\s+(.*)$/.exec(line);
    const row = el("div", "alert-row");
    if (match) {
      row.appendChild(el("span", `alert-badge ${match[1]}`, match[1]));
      row.appendChild(el("span", "alert-time", match[2]));
      row.appendChild(el("span", "", match[3]));
    } else {
      row.textContent = line;
    }
    list.appendChild(row);
  });
}

async function stream(result) {
  $("console-panel").hidden = false;
  $("results").hidden = true;
  $("console").replaceChildren();
  $("live-dot").classList.add("busy");
  $("session-label").textContent = "Processing…";

  const total = result.readings.length + result.rejected.length;
  logLine(`Pipeline started — ${total} readings received by server`, "hdr");
  const delay = Math.max(12, Math.min(60, 1800 / Math.max(total, 1)));

  result.rejected.forEach((r) => logLine(`REJECTED ${r.timestamp} — ${r.errors.join("; ")}`, "UNSAFE"));
  for (let i = 0; i < result.readings.length; i += 1) {
    const r = result.readings[i];
    const tail = r.status === "SAFE" ? "" : `  <-- ${r.status} (${r.breaches.join(", ")})`;
    logLine(
      `[${String(i + 1).padStart(2, "0")}/${result.readings.length}] ${r.timestamp} | pH ${r.ph.toFixed(2)} | Turb ${r.turbidity_ntu.toFixed(2)} | TDS ${r.tds_ppm.toFixed(1)} | DO ${r.dissolved_oxygen_mgL.toFixed(2)} | ${r.temperature_c.toFixed(1)}C | ${r.status}${tail}`,
      r.status,
    );
    await sleep(delay);
  }
  logLine(`Pipeline complete — ${result.readings.length} processed, ${result.alerts.length} alerts raised`, "hdr");

  $("live-dot").classList.remove("busy");
  $("results").hidden = false;
  const first = result.readings[0];
  $("session-label").textContent = first
    ? `Session of ${first.timestamp.slice(0, 10)} · ${result.readings.length} samples`
    : "No valid data";
  renderStats(result.summary);
  renderStrip(result.readings);
  SERIES.forEach((s) => drawChart(s, result.readings, result.thresholds));
  renderAlerts(result.alerts);
}

async function callApi(request) {
  showError("");
  try {
    const response = await request;
    const body = await response.json();
    if (!response.ok) {
      showError(body.error || `Request failed (${response.status})`);
      return;
    }
    await stream(body);
  } catch (err) {
    showError(`Could not reach the server: ${err.message}`);
  }
}

let pendingFile = null;

$("file-input").addEventListener("change", (event) => {
  pendingFile = event.target.files[0] || null;
  $("file-name").textContent = pendingFile ? pendingFile.name : "No file selected";
  $("process-btn").disabled = !pendingFile;
});

$("process-btn").addEventListener("click", () => {
  if (!pendingFile) return;
  const form = new FormData();
  form.append("file", pendingFile);
  callApi(fetch("/api/process", { method: "POST", body: form }));
});

$("simulate-btn").addEventListener("click", () => {
  callApi(fetch("/api/simulate?n=40"));
});
