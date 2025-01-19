from flask import Flask, render_template, request, jsonify
from transformers import pipeline

app = Flask(__name__, static_folder="static", template_folder="templates")

# Ładowanie modelu GPT-Neo 1.3B
chat_model = pipeline("text-generation", model="EleutherAI/gpt-neo-1.3B")

def validate_response(response):
    """
    Prosty filtr do walidacji odpowiedzi.
    """
    response = response.split("A:")[-1].strip()  # Zachowaj tylko ostatnią część odpowiedzi
    if len(response.split()) < 3:  # Jeśli odpowiedź jest zbyt krótka
        return "Przepraszam, nie zrozumiałem Twojego pytania. Czy możesz je powtórzyć?"
    return response

def chatbot_response(message):
    """
    Generowanie odpowiedzi z logiką dla podstawowych pytań i ustalonym kontekstem.
    """
    try:
        # Proste odpowiedzi na popularne pytania
        predefined_answers = {
            "where is barcelona": "Barcelona is in Spain.",
            "where is warsaw": "Warsaw is the capital of Poland.",
            "how much is 100 usd + 15 usd": "100 USD + 15 USD = 115 USD.",
            "where can i find fish": "You can find fish in the fish store or near water bodies.",
            "what is africa": "Africa is the second-largest continent in the world, known for its diverse cultures and wildlife.",
            "where i can buy jacket": "You can buy a jacket in clothing stores, online shops, or shopping malls.",
            "where is tokyo": "Tokyo is in Japan.",
            "where is manchester": "Manchester is in England, United Kingdom.",
            "where i can buy new tv": "You can buy a new TV in electronics stores, online marketplaces, or retail stores."
        }

        # Sprawdzanie predefiniowanych odpowiedzi
        message_lower = message.lower().strip()
        if message_lower in predefined_answers:
            return predefined_answers[message_lower]

        # Ustalony kontekst dla modelu
        prompt = (
            "You are a helpful assistant. Answer the following question accurately and concisely:\n"
            f"Q: {message}\nA:"
        )

        # Generowanie odpowiedzi przez model GPT-Neo
        response = chat_model(
            prompt,
            max_length=50,  # Ogranicz długość odpowiedzi
            num_return_sequences=1,  # Jedna odpowiedź
            do_sample=True,  # Losowe generowanie (próbkowanie)
            temperature=0.5,  # Niższa temperatura -> bardziej przewidywalne odpowiedzi
            top_k=40,  # Rozważaj tylko 40 najbardziej prawdopodobnych tokenów
            top_p=0.8  # Użyj nucleus sampling (próg prawdopodobieństwa)
        )
        generated_text = response[0]['generated_text']
        return validate_response(generated_text)
    except Exception as e:
        return f"Błąd podczas komunikacji z modelem: {e}"

@app.route("/")
def index():
    """
    Strona główna - serwuje plik index.html.
    """
    return render_template("index.html")

@app.route("/get_response", methods=["POST"])
def get_response():
    """
    API do obsługi wiadomości użytkownika.
    """
    user_message = request.json.get("message")
    response = chatbot_response(user_message)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
