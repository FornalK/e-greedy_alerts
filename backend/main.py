from idlelib.query import Query

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
import pandas as pd
import os
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from urllib.parse import parse_qs

from mab import EpsilonGreedy

# Inicjalizacja bandyty
num_variants = 9
epsilon = 0.2

# Model danych odbieranych z frontendu
class AlertData(BaseModel):
    user: str
    alertNumber: int
    alertTime: float

# Aplikacja FastAPI
app = FastAPI()

# Lista aktywnych połączeń WebSocket
active_connections = {} # user -> websocket


bandits = {}              # user -> instancja EpsilonGreedy
bandit_ids = {}      # user -> instance number
bandit_counter = 0        # aby zapisywać unikalne id bandytów

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
async def save_data(data: AlertData):
    print(f"🔍 Otrzymane dane: {data}")
    df = pd.read_excel(FILE_PATH)
    df.loc[len(df)] = [data.user, data.alertNumber, data.alertTime]
    df.to_excel(FILE_PATH, index=False)

    # Aktualizacja modelu bandyty konkretnego użytkownika
    # Po uzyskaniu nagrody (np. ujemnego czasu ekspozycji)
    user = data.user
    reward = -float(data.alertTime) # Im krótszy czas, tym wyższa nagroda
    selected_variant = int(data.alertNumber)

    bandit = bandits.get(user)
    if bandit:
        bandit.update(selected_variant - 1, reward)
    else:
        print(f"⚠️ Brak instancji MAB dla użytkownika: {user}")

    # Uruchomienie asynchronicznej funkcji do wysłania numeru dla nowego alertu przez WebSocket
    asyncio.create_task(send_new_alert_number(data.user))

    return {"message": "Zapisano"}

# Endpointy do łączenia się z frontendem
@app.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    global bandit_counter

    # Parsowanie query string
    query_params = parse_qs(websocket.url.query)
    user = query_params.get("user", [None])[0]

    if not user:
        await websocket.send_text("❌ Nie podano użytkownika w URL")
        await websocket.close()
        return

    # Tworzenie osobnej instancji bandyty dla danego użytkownika (jeśli nie istnieje)
    if user not in bandits:
        bandits[user] = EpsilonGreedy(num_variants, epsilon)
        bandit_counter += 1
        bandit_ids[user] = f"MAB{bandit_counter}"

    # Informacja o przypisanym MAB
    mab_id = bandit_ids[user]
    await websocket.send_text(f"Połączono z instancją: {mab_id}")

    while True:
        try:
            data = await websocket.receive_text()
            await websocket.send_text(f"Serwer otrzymał: {data}")
        except WebSocketDisconnect:
            print(f"❌ Użytkownik {user} rozłączył się z /ws/connect")

@app.websocket("/ws/newAlertNumber")
async def websocket_new_alert_number(websocket: WebSocket):
    await websocket.accept()

    # Parsowanie query string
    query_params = parse_qs(websocket.url.query)
    user = query_params.get("user", [None])[0]

    if not user:
        await websocket.send_text("❌ Nie podano użytkownika w URL")
        await websocket.close()
        return

    active_connections[user] = websocket
    print(f"🔌 Nowe połączenie WebSocket od użytkownika: {user}")

    try:
        while True:
            await websocket.receive_text()  # Czeka na dane
    except WebSocketDisconnect:
        print(f"❌ WebSocket rozłączony: {user}")
        del active_connections[user]

# Funkcja, która wysyła informacje o wybranych przez algorytm alertach
async def send_new_alert_number(user: str):
    websocket = active_connections.get(user)

    if not active_connections:
        print("⚠️ Brak aktywnych połączeń WebSocket")
        return

    newAlertNumber = findNewAlertNumber(user)
    print(f"📤 Wysyłanie liczby {newAlertNumber} dla użytkownika {user}")

    # Wysyłamy do konkretnego użytkownika
    try:
        await websocket.send_text(str(newAlertNumber))
    except Exception as e:
        print(f"⚠️ Błąd podczas wysyłania do {user}: {e}")

# Funkcja, która wybiera wariant alertu przez wielorękiego bandyte
def findNewAlertNumber(user: str):
    bandit = bandits.get(user)
    if bandit:
        # Wybór wariantu alertu dla konkretnego użytkownika
        variant = bandit.select_variant()
        return variant + 1 # + 1 bo indeksujemy od 0
    else:
        print(f"⚠️ Brak bandyty dla użytkownika {user}")
        return -1  # domyślnie