// Przełączanie zakładek
function switchTab(tabId) {
	// Znajdź wszystkie zakładki i usuń klasę "active"
	const tabs = document.querySelectorAll('.tab');
	const links = document.querySelectorAll('.nav-link');
	tabs.forEach((tab) => tab.classList.remove('active'));
	links.forEach((link) => link.classList.remove('active'));

	// Ustaw wybraną zakładkę jako aktywną
	document.getElementById(tabId).classList.add('active');

	// Oznacz odpowiedni link nawigacyjny jako aktywny
	const activeLink = document.querySelector(`[href="#${tabId}"]`);
	if (activeLink) {
		activeLink.classList.add('active');
	}

	// Wyświetl historię, jeśli wybrano zakładkę "history"
	if (tabId === 'history') {
		showHistory();
	}
}

let messageHistory = [];

// Dodanie wiadomości do historii
function addToMessageHistory(text, type) {
	messageHistory.push({ text, type });
	localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
}

// Ładowanie historii wiadomości z localStorage
function loadMessageHistoryFromStorage() {
	const storedHistory = localStorage.getItem('messageHistory');
	if (storedHistory) {
		messageHistory = JSON.parse(storedHistory);
	}
}

// Funkcja wysyłania predefiniowanych wiadomości
function sendPresetMessage(message) {
	const userInput = document.getElementById('user-input');
	userInput.value = message; // Ustaw wiadomość w polu tekstowym
	sendMessage(); // Wyślij wiadomość do bota
}

// Funkcja wysyłania wiadomości
function sendMessage() {
	const userInput = document.getElementById('user-input');
	const chatWindow = document.getElementById('chat-window');

	if (userInput.value.trim() !== '') {
		const userMessage = userInput.value;

		// Dodanie wiadomości użytkownika do historii i czatu
		addToMessageHistory(userMessage, 'user');
		appendMessageToChat(userMessage, 'user');

		// Wysłanie wiadomości do backendu Flask
		fetch('/get_response', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message: userInput.value }),
		})
			.then((response) => response.json())
			.then((data) => {
				const botMessage = data.response;

				// Dodanie odpowiedzi bota do historii i czatu
				addToMessageHistory(botMessage, 'bot');
				appendMessageToChat(botMessage, 'bot');
			})
			.catch((error) => {
				console.error('Error:', error);
				const errorMessage =
					'Przepraszam, wystąpił błąd. Spróbuj ponownie później.';
				addToMessageHistory(errorMessage, 'bot');
				appendMessageToChat(errorMessage, 'bot');
			});

		// Wyczyść pole tekstowe
		userInput.value = '';
	}
}

// Funkcja dodająca wiadomość do okna czatu
function appendMessageToChat(message, type) {
	const chatWindow = document.getElementById('chat-window');
	const messageElement = document.createElement('div');
	messageElement.textContent = message;
	messageElement.classList.add(
		type === 'user' ? 'user-message' : 'bot-message'
	);
	chatWindow.appendChild(messageElement);

	// Automatyczne przewijanie do dołu
	chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Funkcja wyświetlania historii wiadomości
function showHistory() {
	const historyContent = document.getElementById('history-content');
	historyContent.innerHTML = ''; // Wyczyść zawartość

	messageHistory.forEach((message) => {
		const messageElement = document.createElement('div');
		messageElement.textContent = message.text;
		messageElement.classList.add(
			message.type === 'user' ? 'user-message' : 'bot-message'
		);
		historyContent.appendChild(messageElement);
	});
}

// Funkcja czyszczenia historii
function clearHistory() {
	messageHistory = [];
	localStorage.removeItem('messageHistory');
	showHistory();
}

// Ładowanie historii wiadomości przy starcie aplikacji
window.addEventListener('load', () => {
	loadMessageHistoryFromStorage();
});

// Automatyczne przewijanie do aktywnej zakładki
window.addEventListener('hashchange', () => {
	const hash = window.location.hash.slice(1); // Usuń "#" z początku
	switchTab(hash);
});
