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
	if (tabId === 'history') {
		showHistory();
	}
}



let messageHistory = [];

		function addToMessageHistory(text, type) {
			messageHistory.push({ text, type });
			localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
		}

		function loadMessageHistoryFromStorage() {
			const storedHistory = localStorage.getItem('messageHistory');
			if (storedHistory) {
				messageHistory = JSON.parse(storedHistory);
			}
		}

// Funkcja wysyłania wiadomości
function sendMessage() {
	const userInput = document.getElementById('user-input');
	const chatWindow = document.getElementById('chat-window');

	if (userInput.value.trim() !== '') {
		
		const userMessage = `You: ${userInput.value}`;
		addToMessageHistory(userMessage, 'user');
		// Dodanie wiadomości użytkownika do okna czatu
		const userMessageElement = document.createElement('div');
		userMessageElement.textContent = userMessage;
		userMessageElement.classList.add('user-message');
		chatWindow.appendChild(userMessageElement);

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
				
				// Dodanie odpowiedzi bota do okna czatu
				const botMessage = document.createElement('div');
				botMessage.textContent = data.response;
				botMessage.classList.add('bot-message');
				chatWindow.appendChild(botMessage);

				// Automatyczne przewijanie do dołu
				chatWindow.scrollTop = chatWindow.scrollHeight;
			})
			.catch((error) => console.error('Error:', error));

		// Wyczyść pole wejściowe
		userInput.value = '';
	}	
}


function showHistory() {
	const historyContent = document.getElementById('history-content');
	historyContent.innerHTML = ''; // 

	messageHistory.forEach((message) => {
		const messageElement = document.createElement('div');
		messageElement.textContent = message.text;
		messageElement.classList.add(message.type === 'user' ? 'user-message' : 'bot-message');
		historyContent.appendChild(messageElement);
	});
}

function clearHistory() {
    messageHistory = [];
    localStorage.removeItem('messageHistory');
    showHistory();
}

// ładowanie historii localStorage
window.addEventListener('load', () => {
	loadMessageHistoryFromStorage();
});
