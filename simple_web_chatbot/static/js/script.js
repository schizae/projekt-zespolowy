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
}

// Funkcja wysyłania wiadomości
function sendMessage() {
	const userInput = document.getElementById('user-input');
	const chatWindow = document.getElementById('chat-window');

	if (userInput.value.trim() !== '') {
		// Dodanie wiadomości użytkownika do okna czatu
		const userMessage = document.createElement('div');
		userMessage.textContent = `You: ${userInput.value}`;
		userMessage.classList.add('user-message');
		chatWindow.appendChild(userMessage);

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
