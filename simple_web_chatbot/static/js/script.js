// Przełączanie zakładek
function switchTab(tabId) {
	// Ukryj wszystkie zakładki
	document.querySelectorAll('.tab').forEach((tab) => {
		tab.classList.remove('active');
	});

	// Usuń aktywną klasę z linków
	document.querySelectorAll('.nav-link').forEach((link) => {
		link.classList.remove('active');
	});

	// Pokaż wybraną zakładkę
	const activeTab = document.getElementById(tabId);
	activeTab.classList.add('active');

	// Oznacz aktywny link
	const activeLink = document.querySelector(`[href="#${tabId}"]`);
	if (activeLink) {
		activeLink.classList.add('active');
	}

	// Obsługa historii
	if (tabId === 'history') showHistory();
}

// Obsługa czatu
let messageHistory = JSON.parse(localStorage.getItem('messageHistory')) || [];

function appendMessage(text, type) {
	const chatWindow = document.getElementById('chat-window');
	const messageDiv = document.createElement('div');

	messageDiv.className = `${type}-message`;
	messageDiv.innerHTML = `
        <div class="message-content">${text}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;

	chatWindow.appendChild(messageDiv);
	chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
	const userInput = document.getElementById('user-input');
	const chatWindow = document.getElementById('chat-window');

	if (userInput.value.trim()) {
		const message = userInput.value.trim();

		// Dodaj wiadomość użytkownika
		appendMessage(message, 'user');

		try {
			const response = await fetch('/get_response', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: message }),
			});

			if (!response.ok) throw new Error('Błąd sieci');

			const data = await response.json();
			appendMessage(data.response, 'bot');
		} catch (error) {
			appendMessage(`Błąd połączenia: ${error.message}`, 'bot');
		}

		userInput.value = '';
	}
}

function appendMessage(message, type) {
	const chatWindow = document.getElementById('chat-window');
	const messageDiv = document.createElement('div');

	messageDiv.className = `${type}-message`;
	messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;

	chatWindow.appendChild(messageDiv);
	chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Funkcja pomocnicza do symulacji odpowiedzi
async function getBotResponse(message) {
	// Tutaj integracja z prawdziwym API
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return `Odpowiedź na: "${message}"`;
}

// Predefiniowane wiadomości
function sendPresetMessage(message) {
	const input = document.getElementById('user-input');
	input.value = message;
	sendMessage();
}

// Historia czatu
function showHistory() {
	const historyContent = document.getElementById('history-content');
	historyContent.innerHTML = messageHistory
		.map((msg) => `<div class="${msg.type}-message">${msg.content}</div>`)
		.join('');
}

function clearHistory() {
	messageHistory = [];
	localStorage.removeItem('messageHistory');
	showHistory();
}

// Inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
	// Obsługa domyślnej zakładki
	const hash = window.location.hash.substring(1);
	if (hash) switchTab(hash);
	else switchTab('home');

	// Obsługa przycisku Enter
	document.getElementById('user-input').addEventListener('keypress', (e) => {
		if (e.key === 'Enter') sendMessage();
	});
});
