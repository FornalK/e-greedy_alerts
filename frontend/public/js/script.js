const backendHost = window.location.hostname === "localhost"
    ? "ws://127.0.0.1:8000"
    : "wss://egreedy-backend.onrender.com";

const backendHttp = window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://egreedy-backend.onrender.com";

let wsConnect = new WebSocket(`${backendHost}/ws/connect`);
wsConnect.onmessage = event => document.getElementById("serverMessage").innerText = event.data;

const wsNewAlertNumber = new WebSocket(`${backendHost}/ws/newAlertNumber`);
wsNewAlertNumber.onmessage = (event) => {
    // Kiedy otrzymam informacje z ewaluacja od algorytmu, który teraz alery wyświetlić to trzeba to zaplanować
    console.log("Numer alert do wyświetlenia:", event.data);
    // Losujemy za ile ma sie pojawić następny alert
    let delay = Math.random() * 7000 + 8000; // wyswietlenie kolejnego alertu miedzy 8 a 15 sekund
    setTimeout(() => showAlert(parseInt(event.data)), delay);
};

const colorsRGB = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff", "#ffff00", "#000000", "#ffffff"];
const colorsInWords = ["CZERWONY", "ZIELONY", "NIEBIESKI", "FIOLETOWY", "CYJAN", "ŻÓŁTY", "CZARNY", "BIAŁY"];
const questions = ["Jakiego koloru jest napis?", "Na jaki kolor wskazuje napis?"];
let currentQuestionType;
let currentText;
let currentColor;
let userName;
let currentUserAnswer;
let alertStartTime;
let alertNumber;

function sendAlertData(alertNumber, alertTime) {
    fetch(`${backendHttp}/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userName, alertNumber: alertNumber, alertTime: alertTime })
    }).then(response => response.json())
      .then(data => console.log(data));
}

// Podpięcie funkcji anonimowej, uruchamiajacej eksperyment i usuwajacej elemnty startowe
document.getElementById('startBtn').addEventListener('click', function() {
    // Dobranie sie do pola tekstowego z ekranu startowego
    let textField = document.getElementById("user");
    
    // Pobranie wartości wpisanej przez użytkownika
    userName = textField.value;
	
	// Usuwamy przycisk oraz instrukcje startowa i pole tekstowe po kliknięciu
	this.remove();
	document.getElementById('instruction').remove();
    textField.remove();

    // Ustawiamy styl display na 'block', aby pokazać ukryty kontener
    let answers = document.getElementsByClassName('answers');
    answers[0].style.display = 'flex';
    answers[1].style.display = 'flex';
    let elements = document.querySelectorAll(".answer");
    for(let i = 0; i < elements.length; i++)
        elements[i].style.backgroundColor = colorsRGB[i];

    document.getElementById('container').style.display = 'block';

    // pokazujemy pierwsze zadanie
    showNextTask();
    
    // losujemy za ile ma pojawic sie pierwszy alert (domyślnie jest to alert z numerem 1)
    let delay = Math.random() * 7000 + 8000; // wyswietlenie alertu z opoznieniem od 8 do 15 sekund
    setTimeout(() => showAlert(1), delay);
});

// Pokazuje zadanie
function showNextTask() {
    document.getElementById('result').style.display = 'none';
    let task = document.getElementById('task');
    let question = document.getElementById('question');
    let colorText = document.getElementById('colorText');
    currentQuestionType = Math.floor(Math.random() * 2);
    currentText = colorsInWords[Math.floor(Math.random() * 8)];
    currentColorIndex = Math.floor(Math.random() * 8);
    currentColor = colorsInWords[currentColorIndex];

    question.textContent = questions[currentQuestionType];
    colorText.textContent = currentText;
    colorText.style.color = colorsRGB[currentColorIndex];
    task.style.display = 'inline';
}


// Uruchamia sie kiedy uzytkownik odpowie na pytanie przez klikniecie kafelka
function selectAnswer(answer) {
    // zapisanie wybranej odpowiedzi
    currentUserAnswer = answer;
    let result = document.getElementById('result');
    // Wyswietlenie uzytkownikowi informacji o tym czy dobrze odpowiedzial
    if (currentQuestionType == 0) {
        if (answer == currentColor) {
            result.src = `images/game/good.png`;
        } else {
            result.src = `images/game/bad.png`;
        }
    } else {
        if (answer == currentText) {
            result.src = `images/game/good.png`;
        } else {
            result.src = `images/game/bad.png`;
        }
    }
    result.style.display = 'block';
    // Odpalenie kolejnego pytania
    setTimeout(() => {
        showNextTask();
    }, 1500);  
}

// Pokazuje alerty
function showAlert(newAlertNumber) {
    alertNumber = newAlertNumber;
    document.getElementById('alertImage').src = `images/alerts/${String(alertNumber)}.png`;

    // Ustawiamy styl display na 'block', aby pokazać ukryty kontener
    document.getElementById('alert').style.display = 'block';

    // Start pomiaru czasu od pojawienia sie alertu
    alertStartTime = performance.now();
}

// Podpięcie funkcji anonimowej, zamykajacej alert
document.getElementById('exitAlertBtn').addEventListener('click', function() {
    // Pomiar czasu od wyswietlenia alertu do jego zamkniecia
    let alertEndTime = performance.now();
    let elapsedTime = (alertEndTime - alertStartTime).toFixed(2);
    console.log(elapsedTime);

    // Wyslanie do backendu informacji o czasie zamkniecia oraz informacji o tym ktory byl to alert
    sendAlertData(alertNumber, elapsedTime);

    // Usuwamy alert
	document.getElementById('alert').style.display = 'none';
});