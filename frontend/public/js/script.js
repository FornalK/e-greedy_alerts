let ws = new WebSocket("ws://127.0.0.1:8000/ws");
ws.onmessage = event => document.getElementById("serverMessage").innerText = event.data;

let availableQuestions = Array.from({ length: 160 }, (_, i) => i + 1);
let userName;
let currentUserAnswer;
let alertStartTime;
let alertNumber;

function sendChoice(alertNumber, alertTime) {
    fetch("http://127.0.0.1:8000/save/", {
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
    document.getElementById('container').style.display = 'block';

    // pokazujemy pierwsze zadanie
    showNextQuestion();
    
    // losujemy za ile ma pojawic sie pierwszy alert
    // Losujemy za ile ma sie pojawić następny alert
    let delay = Math.random() * 7000 + 8000; // wyswietlenie alertu z opoznieniem od 8 do 15 sekund
    setTimeout(showAlert, delay);
});

// Funkcja losowania pytania
function getRandomQuestion() {
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const questionNumber = availableQuestions[randomIndex];
    currentQuestionNumber = questionNumber;
    availableQuestions.splice(randomIndex, 1); // Usuń użyte pytanie
    return questionNumber + 1 // + 1 bo indeksujemy od zera a numery pytań w plikach są od 1;
}

// Pokazuje pytania
function showNextQuestion() {
    if (availableQuestions == 0) {
        // Ukyrwamy kontener z pytaniami
        document.getElementById('container').style.display = 'none';

        return
    }

    const questionNumber = getRandomQuestion();
    let questionImg = document.getElementById('questionImage');
    questionImg.style.display = 'inline';
    questionImg.src = `images/game/ciekawostka_${String(questionNumber).padStart(3, '0')}.png`;
    displayAnswers(questionNumber);
}

// Wyswietla odpowiedzi odekwatne do pytania
function displayAnswers(questionNumber) {
    document.getElementById('answers').style.display = 'flex';
    document.getElementById('answerA').src = `images/game/ciekawostka_${String(questionNumber).padStart(3, '0')}_A.png`;
    document.getElementById('answerB').src = `images/game/ciekawostka_${String(questionNumber).padStart(3, '0')}_B.png`;
    document.getElementById('answerC').src = `images/game/ciekawostka_${String(questionNumber).padStart(3, '0')}_C.png`;
    document.getElementById('answerD').src = `images/game/ciekawostka_${String(questionNumber).padStart(3, '0')}_D.png`;
}

// Uruchamia sie kiedy uzytkownik odpowie na pytanie przez klkniecie kafelka
function selectAnswer(answer) {
    // zapisanie wybranej odpowiedzi
    currentUserAnswer = answer;
    // ukrycie odpowiedzi
    document.getElementById('answers').style.display = 'none';

    // musimy tez ukryc obecne zdjecie z pytaniem
    document.getElementById('questionImage').style.display = 'none';

    // Odpalenie kolejnego pytania
    showNextQuestion();
}

// Pokazuje alerty
function showAlert() {
    // TO-DO (na razie losowe wybieranie alertu)
    alertNumber = Math.floor(Math.random() * 4) + 1;
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
    sendChoice(alertNumber, elapsedTime);

    // Usuwamy alert
	document.getElementById('alert').style.display = 'none';
    // Losujemy za ile ma sie pojawić następny alert
    let delay = Math.random() * 7000 + 8000; // wyswietlenie kolejnego alertu miedzy 8 a 15 sekund
    setTimeout(showAlert, delay);
});