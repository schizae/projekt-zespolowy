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
 * Dodaje nowy komunikat do okna czatu oraz zapisuje go w localStorage.
 * @param {string} message - treść wiadomości
 * @param {string} type - 'user' | 'bot' | 'error'
 */
function appendMessage(message, type) {
	const chatWindow = document.getElementById('chat-window');

	// Ikona obok wiadomości
	let iconHTML = '';
	if (type === 'bot') {
		iconHTML = '<div class="message-icon"><i class="bx bxs-bot"></i></div>';
	} else if (type === 'user') {
		iconHTML = '<div class="message-icon"><i class="bx bxs-user"></i></div>';
	} else {
		iconHTML = '<div class="message-icon"><i class="bx bxs-error"></i></div>';
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

	// Zapisz w localStorage (jeśli nie jest typem 'error')
	if (type === 'user' || type === 'bot') {
		messageHistory.push({ content: message, type });
		localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
	}
}

/**
 * Wysyła wiadomość do /get_response (rozmowa z GPT)
 */
async function sendMessage() {
	const userInput = document.getElementById('user-input');

	if (userInput.value.trim()) {
		const message = userInput.value.trim();

		appendMessage(message, 'user');

		try {
			const response = await fetch('/get_response', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: message }),
			});
			if (!response.ok) throw new Error('Błąd sieci');

			const data = await response.json();
			appendMessage(data.response, 'bot');
		} catch (err) {
			appendMessage(`Błąd połączenia: ${err.message}`, 'error');
		}

		userInput.value = '';
	}
}

/**
 * Predefiniowana wiadomość (np. "Opowiedz mi żart"),
 * wysyłana automatycznie do GPT.
 */
function sendPresetMessage(message) {
	const input = document.getElementById('user-input');
	input.value = message;
	sendMessage(); // automatyczne wysłanie
}

/* ---------- Pogoda ---------- */

/**
 * Pogoda w obecnej lokalizacji => POST /get_weather { lat, lon }
 */
async function handleWeatherLocalRequest() {
	appendMessage('Proszę o pogodę w mojej lokalizacji...', 'user');

	if (!navigator.geolocation) {
		appendMessage(
			'Geolokalizacja nie jest wspierana w tej przeglądarce.',
			'error'
		);
		return;
	}

	navigator.geolocation.getCurrentPosition(
		async (pos) => {
			try {
				const response = await fetch('/get_weather', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						lat: pos.coords.latitude,
						lon: pos.coords.longitude,
					}),
				});
				if (!response.ok) throw new Error('Błąd sieci (pogoda lokalna)');

				const data = await response.json();
				appendMessage(data.response, 'bot');
			} catch (error) {
				appendMessage(`Błąd: ${error.message}`, 'error');
			}
		},
		(err) => {
			appendMessage(`Błąd geolokalizacji: ${err.message}`, 'error');
		},
		{ enableHighAccuracy: true, timeout: 5000 }
	);
}

/**
 * Pogoda w wybranym mieście => POST /get_weather { message: "Pogoda w X" }
 */
async function handleWeatherCityRequest() {
	const city = prompt(
		'Podaj nazwę miasta, dla którego chcesz sprawdzić pogodę:'
	);
	if (city && city.trim()) {
		const userMsg = `Pogoda w ${city.trim()}`;
		appendMessage(userMsg, 'user');

		try {
			const response = await fetch('/get_weather', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: userMsg }),
			});
			if (!response.ok) throw new Error('Błąd sieci (pogoda w mieście)');

			const data = await response.json();
			appendMessage(data.response, 'bot');
		} catch (err) {
			appendMessage(`Błąd: ${err.message}`, 'error');
		}
	}
}

/* ---------- Czat - czyszczenie i historia ---------- */

// Wyczyść historię (z localStorage)
function clearHistory() {
	messageHistory = [];
	localStorage.removeItem('messageHistory');
	showHistory();
}

// Wyczyść aktualne okno czatu (bez usuwania historii!)
function clearChat() {
	if (
		confirm(
			'Czy na pewno chcesz wyczyścić bieżący czat (bez usuwania historii)?'
		)
	) {
		document.getElementById('chat-window').innerHTML = '';
	}
}

// Pokazanie historii w zakładce "Historia"
function showHistory() {
	const historyContent = document.getElementById('history-content');
	if (!historyContent) return;

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

/* ---------- Inicjalizacja ---------- */
document.addEventListener('DOMContentLoaded', () => {
	// Obsługa domyślnej zakładki
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
