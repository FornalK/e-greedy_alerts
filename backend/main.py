from fastapi import FastAPI, WebSocket
import pandas as pd
from openpyxl import load_workbook
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class ClickData(BaseModel):
    user: str
    alertNumber: int
    alertTime: float

app = FastAPI()

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
async def save_choice(data: ClickData):
    print(f"🔍 Otrzymane dane: {data}")
    df = pd.read_excel(FILE_PATH)
    df.loc[len(df)] = [data.user, data.alertNumber, data.alertTime]
    df.to_excel(FILE_PATH, index=False)
    return {"message": "Saved"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected to WebSocket")
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Server received: {data}")