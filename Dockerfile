# Small Alpine base image with Python
FROM python:3.12-alpine

# Install OS security patches
RUN apk upgrade --no-cache

WORKDIR /srv

# Install the libraries first (this layer is cached when only code changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
 && pip uninstall -y pip setuptools
# (pip is removed after installing: it is not needed at runtime and Trivy flags its bundled libraries)

# Copy the application code
COPY app/ ./app/

# Run as a normal user instead of root
RUN adduser -S -D -H appuser
USER appuser

WORKDIR /srv/app
ENV PORT=8000
EXPOSE 8000

# Start the web server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "app:app"]
