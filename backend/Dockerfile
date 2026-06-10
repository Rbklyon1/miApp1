FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN cat requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt
RUN python -m pip show uvicorn

COPY . .

CMD python -m uvicorn main:app --host 0.0.0.0 --port $PORT