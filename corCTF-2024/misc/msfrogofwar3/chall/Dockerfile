FROM python:bookworm

RUN apt-get update && apt-get install curl unzip -y && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

RUN curl -L https://github.com/official-stockfish/Stockfish/releases/download/sf_16/stockfish-ubuntu-x86-64-avx2.tar --output stockfish-ubuntu-x86-64-avx2.tar

RUN tar xvf stockfish-ubuntu-x86-64-avx2.tar

COPY . .

CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:8080", "app:app"]