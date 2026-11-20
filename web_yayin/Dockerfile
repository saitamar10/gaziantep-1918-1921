# Gaziantep 1918-1921 — Godot web sürümü + küçük Python sunucusu (Railway; depo kökünden derlenir)
FROM python:3.12-slim
WORKDIR /app
COPY web_yayin/ .
# büyük paket GitHub sınırı yüzünden parçalı gelir: birleştir
RUN cat index.pck.part* > index.pck && rm -f index.pck.part*
ENV PYTHONUNBUFFERED=1
CMD ["python", "serve.py"]
