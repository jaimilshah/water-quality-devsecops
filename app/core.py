"""Core water-quality pipeline: validate -> classify -> alert.

Mirrors the structured-design modules of the SEP micro project
(VALIDATE_DATA, CLASSIFY_WATER_QUALITY, GENERATE_ALERT).
"""
import csv
import io
import random
from datetime import datetime, timedelta

THRESHOLDS = {
    "ph": {"min": 6.5, "max": 8.5},
    "turbidity_ntu": {"min": 0, "max": 5},
    "tds_ppm": {"min": 0, "max": 500},
    "dissolved_oxygen_mgL": {"min": 5, "max": 14},
    "temperature_c": {"min": 10, "max": 32},
}

FIELDS = list(THRESHOLDS.keys())
MAX_ROWS = 5000


class DatasetError(ValueError):
    """Raised when an uploaded dataset is malformed."""


def validate_data(reading):
    errors = []
    if not 0 <= reading["ph"] <= 14:
        errors.append("pH out of physical range (sensor fault)")
    if reading["turbidity_ntu"] < 0:
        errors.append("Negative turbidity (sensor fault)")
    if reading["tds_ppm"] < 0:
        errors.append("Negative TDS (sensor fault)")
    if reading["dissolved_oxygen_mgL"] < 0:
        errors.append("Negative dissolved oxygen (sensor fault)")
    return len(errors) == 0, errors


def classify_water_quality(reading):
    breaches = [
        p for p, band in THRESHOLDS.items()
        if reading[p] < band["min"] or reading[p] > band["max"]
    ]
    if not breaches:
        status = "SAFE"
    elif len(breaches) == 1:
        status = "WARNING"
    else:
        status = "UNSAFE"
    return status, breaches


def generate_alert(reading, status, breaches):
    if status == "SAFE":
        return None
    return f"[{status}] {reading['timestamp']} -- parameter(s) out of range: {', '.join(breaches)}"


def process_readings(readings):
    """Run the full pipeline over a list of reading dicts."""
    processed, alerts, rejected = [], [], []
    for i, reading in enumerate(readings):
        ok, errors = validate_data(reading)
        if not ok:
            rejected.append({"index": i, "timestamp": reading["timestamp"], "errors": errors})
            continue
        status, breaches = classify_water_quality(reading)
        alert = generate_alert(reading, status, breaches)
        if alert:
            alerts.append(alert)
        processed.append({**reading, "status": status, "breaches": breaches})

    counts = {"SAFE": 0, "WARNING": 0, "UNSAFE": 0}
    for r in processed:
        counts[r["status"]] += 1
    n = len(processed)
    summary = {
        "total": n,
        "counts": counts,
        "avg_ph": round(sum(r["ph"] for r in processed) / n, 2) if n else 0,
        "avg_turbidity": round(sum(r["turbidity_ntu"] for r in processed) / n, 2) if n else 0,
    }
    return {"readings": processed, "alerts": alerts, "rejected": rejected,
            "summary": summary, "thresholds": THRESHOLDS}


def parse_csv(text):
    """Parse an uploaded CSV into reading dicts; raises DatasetError on bad input."""
    reader = csv.DictReader(io.StringIO(text))
    required = ["timestamp", *FIELDS]
    missing = [c for c in required if c not in (reader.fieldnames or [])]
    if missing:
        raise DatasetError(f"CSV is missing required column(s): {', '.join(missing)}")
    readings = []
    for line_no, row in enumerate(reader, start=2):
        if len(readings) >= MAX_ROWS:
            raise DatasetError(f"Dataset too large (max {MAX_ROWS} rows)")
        try:
            reading = {"timestamp": str(row["timestamp"]).strip()[:32]}
            for f in FIELDS:
                reading[f] = float(row[f])
        except (TypeError, ValueError) as exc:
            raise DatasetError(f"Row {line_no}: non-numeric value ({exc})") from exc
        readings.append(reading)
    if not readings:
        raise DatasetError("CSV contains no data rows")
    return readings


def simulate_session(num_samples=40, interval_minutes=15, seed=None):
    """Generate a synthetic sensor session with a contamination event in the last third."""
    rng = random.Random(seed)
    start = datetime(2026, 10, 1, 6, 0)
    onset = int(num_samples * 0.65)
    readings = []
    for i in range(num_samples):
        drift = min(1.6, (i - onset) * 0.18) if i >= onset else 0.0
        ts = (start + timedelta(minutes=i * interval_minutes)).strftime("%Y-%m-%d %H:%M")
        readings.append({
            "timestamp": ts,
            "ph": round(rng.gauss(7.2 + drift, 0.6), 2),
            "turbidity_ntu": round(abs(rng.gauss(3 + drift * 4, 2.2)), 2),
            "tds_ppm": round(abs(rng.gauss(320 + drift * 220, 80)), 1),
            "dissolved_oxygen_mgL": round(abs(rng.gauss(7.5 - drift * 2, 1.1)), 2),
            "temperature_c": round(rng.gauss(24 + drift * 3, 2.5), 1),
        })
    return readings
