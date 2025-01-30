from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import openai
import requests
import os
import re
from dotenv import load_dotenv
from urllib.parse import quote

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Klucze środowiskowe
openai.api_key = os.getenv("OPENAI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def format_weather_response(data):
    """Formatowanie danych z OpenWeatherMap na czytelną odpowiedź."""
    return (
        f"🌤️ Pogoda w {data.get('name', 'nieznanej lokalizacji')}:\n"
        f"• Temperatura: {data['main']['temp']}°C\n"
        f"• Warunki: {data['weather'][0]['description'].capitalize()}\n"
        f"• Wilgotność: {data['main']['humidity']}%\n"
        f"• Wiatr: {data['wind']['speed']} m/s\n"
        f"• Ciśnienie: {data['main']['pressure']} hPa"
    )

@app.route("/get_weather", methods=["POST"])
def handle_weather():
    """
    Obsługuje żądania pogodowe:
    - Jeśli body JSON zawiera {'lat': ..., 'lon': ...}, pobiera pogodę wg współrzędnych.
    - Jeśli body JSON zawiera {'message': 'Pogoda w <miasto>'}, pobiera pogodę wg nazwy miasta.
    """
    data = request.get_json() or {}

    try:
        # Pogoda wg geolokalizacji:
        if "lat" in data and "lon" in data:
            url = (
                f"http://api.openweathermap.org/data/2.5/weather?"
                f"lat={data['lat']}&lon={data['lon']}"
                f"&appid={WEATHER_API_KEY}&units=metric&lang=pl"
            )

        # Pogoda wg nazwy miasta (np. "Pogoda w Warszawa")
        elif "message" in data and "Pogoda w " in data["message"]:
            city = data["message"].split("Pogoda w ")[1].strip()
            url = (
                f"http://api.openweathermap.org/data/2.5/weather?"
                f"q={quote(city)}&appid={WEATHER_API_KEY}&units=metric&lang=pl"
            )
        else:
            return jsonify({"response": "Nieprawidłowe żądanie"}), 400

        resp = requests.get(url)
        resp.raise_for_status()
        weather_data = resp.json()

        return jsonify({"response": format_weather_response(weather_data)})

    except requests.exceptions.HTTPError as e:
        return jsonify({"response": f"Błąd API pogodowego: {e.response.text}"}), 500
    except Exception as e:
        return jsonify({"response": f"Błąd systemowy: {str(e)}"}), 500


def generate_response(user_input: str) -> str:
    """
    Obsługuje rozmowę z GPT. 
    (Pogoda przeniesiona do /get_weather, więc tutaj nie wykrywamy "pogoda w ...")
    """

    # Specjalne komendy
    COMMAND_PROMPTS = {
        "żart": "Opowiedz krótki, zabawny dowcip po polsku",
        "historyczną": "Podaj ciekawostkę historyczną po polsku",
        "technologiczną": "Opowiedz ciekawostkę technologiczną po polsku"
    }

    # Jeśli user_input zawiera słowo kluczowe, GPT używa innego "system prompt"
    for keyword, prompt in COMMAND_PROMPTS.items():
        if keyword in user_input.lower():
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_input}
                    ]
                )
                return response.choices[0].message["content"].strip()
            except Exception as e:
                return f"Błąd API: {str(e)}"

    # Domyślna odpowiedź GPT
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Jesteś pomocnym polskojęzycznym asystentem"},
                {"role": "user", "content": user_input}
            ]
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        return f"Błąd systemu: {str(e)}"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_response", methods=["POST"])
def handle_message():
    """Endpoint do rozmowy z GPT."""
    data = request.get_json() or {}
    user_message = data.get("message", "")

    response_text = generate_response(user_message)
    return jsonify({"response": response_text})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
