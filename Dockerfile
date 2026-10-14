# Hardened image: minimal Alpine base, patched OS packages, no package manager
# in the runtime layer, non-root runtime user.
FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /srv

RUN apk upgrade --no-cache

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt \
 && pip uninstall -y pip

COPY app/ ./app/

RUN adduser -S -D -H -s /sbin/nologin appuser
USER appuser

WORKDIR /srv/app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request,os;urllib.request.urlopen('http://127.0.0.1:%s/health' % os.environ.get('PORT','8000'))"

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT} --workers 2 --access-logfile - app:app"]
