"""Water Quality Monitoring & Alert System - Flask web application."""
import os

from flask import Flask, jsonify, render_template, request

from core import DatasetError, parse_csv, process_readings, simulate_session

MAX_UPLOAD_BYTES = 1 * 1024 * 1024  # 1 MB

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://cdn.jsdelivr.net; "
        "style-src 'self'; img-src 'self' data:; frame-ancestors 'none'"
    )
    return response


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify(status="ok")


@app.get("/api/simulate")
def api_simulate():
    try:
        n = int(request.args.get("n", 40))
    except ValueError:
        return jsonify(error="n must be an integer"), 400
    if not 5 <= n <= 500:
        return jsonify(error="n must be between 5 and 500"), 400
    seed = request.args.get("seed")
    try:
        seed = int(seed) if seed is not None else None
    except ValueError:
        return jsonify(error="seed must be an integer"), 400
    return jsonify(process_readings(simulate_session(n, seed=seed)))


@app.post("/api/process")
def api_process():
    upload = request.files.get("file")
    if upload is None:
        return jsonify(error="No file uploaded (expected form field 'file')"), 400
    if not (upload.filename or "").lower().endswith(".csv"):
        return jsonify(error="Only .csv files are accepted"), 400
    try:
        text = upload.read().decode("utf-8")
    except UnicodeDecodeError:
        return jsonify(error="File must be UTF-8 text"), 400
    try:
        readings = parse_csv(text)
    except DatasetError as exc:
        return jsonify(error=str(exc)), 400
    return jsonify(process_readings(readings))


@app.errorhandler(413)
def too_large(_):
    return jsonify(error="File too large (max 1 MB)"), 413


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")))
