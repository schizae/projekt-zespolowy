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

	// Jeśli przełączamy na historię, pokaż aktualną historię
	if (tabId === 'history') showHistory();
}

// Historia rozmów przechowywana lokalnie
let messageHistory = JSON.parse(localStorage.getItem('messageHistory')) || [];

/**
 * Funkcja, która dodaje nowy komunikat do okna czatu oraz zapisuje go w localStorage.
 * @param {string} message - Treść wiadomości
 * @param {string} type - Typ wiadomości: 'user' lub 'bot'
 */
function appendMessage(message, type) {
	const chatWindow = document.getElementById('chat-window');

	// Ikona obok wiadomości w zależności od typu
	let iconHTML = '';
	if (type === 'bot') {
		// Ikona bota (taka sama jak w navbarze)
		iconHTML = '<div class="message-icon"><i class="bx bxs-bot"></i></div>';
	} else {
		// Dla użytkownika można dodać inną ikonę lub puste
		iconHTML = '<div class="message-icon"><i class="bx bxs-user"></i></div>';
	}

	const messageDiv = document.createElement('div');
	messageDiv.className = `${type}-message`;
	messageDiv.innerHTML = `
	  ${iconHTML}
	  <div class="message-content">
		${message}
		<div class="message-time">
		  ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
		</div>
	  </div>
	`;

	chatWindow.appendChild(messageDiv);
	chatWindow.scrollTo({
		top: chatWindow.scrollHeight,
		behavior: 'smooth',
	});

	// Zapisywanie wiadomości w pamięci lokalnej
	messageHistory.push({ content: message, type });
	localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
}

/**
 * Funkcja wysyłająca wiadomość do serwera (Flask) i odbierająca odpowiedź.
 */
async function sendMessage() {
	const userInput = document.getElementById('user-input');

	if (userInput.value.trim()) {
		const message = userInput.value.trim();

		// Dodaj wiadomość użytkownika
		appendMessage(message, 'user');

		try {
			// Wysłanie żądania POST do /get_response
			const response = await fetch('/get_response', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: message }),
			});

			if (!response.ok) throw new Error('Błąd sieci');

			const data = await response.json();
			// Dodaj wiadomość bota
			appendMessage(data.response, 'bot');
		} catch (error) {
			appendMessage(`Błąd połączenia: ${error.message}`, 'bot');
		}

		userInput.value = '';
	}
}

// Funkcja wysyłająca predefiniowaną wiadomość np. "Opowiedz mi żart"
function sendPresetMessage(message) {
	const input = document.getElementById('user-input');
	input.value = message;
	sendMessage();
}

// Wyświetlenie historii w zakładce "Historia"
function showHistory() {
	const historyContent = document.getElementById('history-content');
	if (!historyContent) return;

	// Generujemy HTML z zapamiętanych wiadomości
	historyContent.innerHTML = messageHistory
		.map((msg) => {
			return `
		  <div class="${msg.type}-message">
			<div class="message-content">
			  ${msg.content}
			</div>
		  </div>
		`;
		})
		.join('');
}

// Wyczyść historię
function clearHistory() {
	messageHistory = [];
	localStorage.removeItem('messageHistory');
	showHistory();
}

// Inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
	// Obsługa domyślnej zakładki (np. #chat, #home itp.)
	const hash = window.location.hash.substring(1);
	if (hash) {
		switchTab(hash);
	} else {
		switchTab('home');
	}

	// Załaduj poprzednie wiadomości do okna czatu
	const chatWindow = document.getElementById('chat-window');
	if (chatWindow) {
		messageHistory.forEach((msg) => {
			appendMessage(msg.content, msg.type);
		});
	}

	// Obsługa przycisku Enter w polu tekstowym
	document.getElementById('user-input').addEventListener('keypress', (e) => {
		if (e.key === 'Enter') sendMessage();
	});
});
