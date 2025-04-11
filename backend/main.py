from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
import pandas as pd
import os
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mab import EpsilonGreedy

# Inicjalizacja bandyty
num_variants = 9
epsilon = 0.2
bandit = EpsilonGreedy(num_variants, epsilon)

# Model danych odbieranych z frontendu
class AlertData(BaseModel):
    user: str
    alertNumber: int
    alertTime: float

# Aplikacja FastAPI
app = FastAPI()

# Lista aktywnych połączeń WebSocket
active_connections = set()

# Konfiguracja aplikacji FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nazwa pliku gdzie zapisywane sa dane
FILE_PATH = os.path.abspath("data.xlsx")

# Tworzenie pliku jeśli nie istnieje
if not os.path.exists(FILE_PATH):
    df = pd.DataFrame(columns=["User", "alertNumber", "alertTime"])
    df.to_excel(FILE_PATH, index=False)

# Funkcja, która wysyła wiadomość na stronę serwera
@app.get("/")
def root():
    return {"message": "Backend działa poprawnie 🚀"}

# Endpoint do pobrania pliku
@app.get("/download")
async def download_file():
    if not os.path.exists(FILE_PATH):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(FILE_PATH, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename="data.xlsx")

# Funkcja, która otrzymuje i zapisuje dane z frontendu
@app.post("/save/")
async def save_choice(data: AlertData):
    print(f"🔍 Otrzymane dane: {data}")
    df = pd.read_excel(FILE_PATH)
    df.loc[len(df)] = [data.user, data.alertNumber, data.alertTime]
    df.to_excel(FILE_PATH, index=False)

    # Aktualizacja modelu bandyty
    # Po uzyskaniu nagrody (np. ujemnego czasu ekspozycji)
    reward = - float(data.alertTime)  # Im krótszy czas, tym wyższa nagroda
    selected_variant = int(data.alertNumber)
    bandit.update(selected_variant, reward)

    # Uruchomienie asynchronicznej funkcji do wysłania numeru dla nowego alertu przez WebSocket
    asyncio.create_task(send_new_alert_number())

    return {"message": "Saved"}

# Endpointy do łączenia się z frontendem
@app.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected to WebSocket")
    while True:
        try:
            data = await websocket.receive_text()
            await websocket.send_text(f"Server received: {data}")
        except WebSocketDisconnect:
            print("User has disconnected")

@app.websocket("/ws/newAlertNumber")
async def websocket_new_alert_number(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    print("🔌 Nowe połączenie WebSocket")

    try:
        while True:
            await websocket.receive_text()  # Czeka na dane
    except WebSocketDisconnect:
        print("❌ WebSocket rozłączony")
        active_connections.remove(websocket)

# Funkcja, która wysyła informacje o wybranych przez algorytm alertach
async def send_new_alert_number():
    if not active_connections:
        print("⚠️ Brak aktywnych połączeń WebSocket")
        return

    newAlertNumber = findNewAlertNumber()
    print(f"📤 Wysyłanie liczby: {newAlertNumber}")

    # Wysyłamy do wszystkich klientów
    for connection in active_connections:
        try:
            await connection.send_text(str(newAlertNumber))
        except Exception as e:
            print(f"⚠️ Błąd podczas wysyłania: {e}")

# Funkcja, która wybiera wariant alertu przez wielorękiego bandyte
def findNewAlertNumber():
    # Wybór wariantu alertu
    variant = bandit.select_variant()
    return variant + 1 # + 1 bo indeksujemy od 0