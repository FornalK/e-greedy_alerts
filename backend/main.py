from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import pandas as pd
import os
import random
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class AlertData(BaseModel):
    user: str
    alertNumber: int
    alertTime: float

app = FastAPI()

# Lista aktywnych połączeń WebSocket
active_connections = set()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_PATH = "data.xlsx"

# Tworzenie pliku jeśli nie istnieje
if not os.path.exists(FILE_PATH):
    df = pd.DataFrame(columns=["User", "alertNumber", "alertTime"])
    df.to_excel(FILE_PATH, index=False)

@app.post("/save/")
async def save_choice(data: AlertData):
    print(f"🔍 Otrzymane dane: {data}")
    df = pd.read_excel(FILE_PATH)
    df.loc[len(df)] = [data.user, data.alertNumber, data.alertTime]
    df.to_excel(FILE_PATH, index=False)

    # Uruchomienie asynchronicznej funkcji do wysłania numeru dla nowego alertu przez WebSocket
    asyncio.create_task(send_new_alert_number())

    return {"message": "Saved"}

@app.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected to WebSocket")
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Server received: {data}")

@app.websocket("/ws/newAlertNumber")
async def websocket_new_alert_number(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    print("🔌 Nowe połączenie WebSocket")

    try:
        while True:
            await websocket.receive_text()  # Czeka na dane (możesz to usunąć, jeśli nie potrzebujesz)
    except WebSocketDisconnect:
        print("❌ WebSocket rozłączony")
        active_connections.remove(websocket)

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

def findNewAlertNumber():
    return random.randint(1, 4)