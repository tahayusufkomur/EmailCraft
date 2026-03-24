FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ARG DJANGO_SECRET_KEY=build-only-dummy-key
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
ENV DJANGO_DEBUG=False
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "emailBuilder.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
