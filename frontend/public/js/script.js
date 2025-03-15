let ws = new WebSocket("ws://127.0.0.1:8000/ws");
ws.onmessage = event => document.getElementById("serverMessage").innerText = event.data;

let availableQuestions = Array.from({ length: 160 }, (_, i) => i + 1);
let userName;
let currentUserAnswer;

function sendChoice(choice) {
    fetch("http://127.0.0.1:8000/save/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userName, choice })
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

    showNextQuestion();
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

function selectAnswer(answer) {
    // zapisanie wybranej odpowiedzi
    currentUserAnswer = answer;
    // ukrycie odpowiedzi
    document.getElementById('answers').style.display = 'none';

    // musimy tez ukryc obecne zdjecie z pytaniem
    document.getElementById('questionImage').style.display = 'none';

    // wysłanie informacji do serwera
    sendChoice(answer)

    // Odpalenie kolejnego pytania
    showNextQuestion();
}