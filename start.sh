#!/bin/bash
cd /opt/render/project/src/backend
exec gunicorn invest_backend.wsgi:application --bind 0.0.0.0:$PORT
