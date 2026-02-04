FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app

ENV DJANGO_SETTINGS_MODULE=invest_backend.settings
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "invest_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
