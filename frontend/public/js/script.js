function sendChoice(choice) {
    fetch("http://127.0.0.1:8000/save/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "TestUser", choice })
    }).then(response => response.json())
      .then(data => console.log(data));
}

let ws = new WebSocket("ws://127.0.0.1:8000/ws");
ws.onmessage = event => document.getElementById("serverMessage").innerText = event.data;