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

# Konfiguracja kluczy
openai.api_key = os.getenv("OPENAI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def get_weather(city: str) -> str:
    """Pobiera i formatuje dane pogodowe z OpenWeatherMap po polsku"""
    try:
        city_encoded = quote(city)
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city_encoded}&appid={WEATHER_API_KEY}&units=metric&lang=pl"
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        weather_info = {
            'miasto': data['name'],
            'temp': data['main']['temp'],
            'opis': data['weather'][0]['description'].capitalize(),
            'wilgotnosc': data['main']['humidity'],
            'wiatr': data['wind']['speed']
        }
        
        return (
            f"Pogoda w {weather_info['miasto']}:\n"
            f"- Temperatura: {weather_info['temp']}°C\n"
            f"- Warunki: {weather_info['opis']}\n"
            f"- Wilgotność: {weather_info['wilgotnosc']}%\n"
            f"- Prędkość wiatru: {weather_info['wiatr']} m/s"
        )
        
    except requests.exceptions.HTTPError:
        return f"Nie znaleziono pogody dla miasta: {city}"
    except Exception as e:
        return f"Błąd pobierania pogody: {str(e)}"

def generate_response(user_input: str) -> str:
    # Wykrywanie zapytań o pogodę
    weather_match = re.search(r"(pogoda w|weather in) (.+)", user_input, re.IGNORECASE)
    if weather_match:
        city = weather_match.group(2).strip()
        return get_weather(city)

    # Obsługa specjalnych komend
    COMMAND_PROMPTS = {
        "żart": "Opowiedz krótki, zabawny dowcip po polsku",
        "historyczną": "Podaj ciekawostkę historyczną po polsku",
        "technologiczną": "Opowiedz ciekawostkę technologiczną po polsku"
    }
    
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
                return response.choices[0].message['content'].strip()
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
        return response.choices[0].message['content'].strip()
    except Exception as e:
        return f"Błąd systemu: {str(e)}"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_response", methods=["POST"])
def handle_message():
    data = request.get_json()
    user_message = data.get("message", "")
    response = generate_response(user_message)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)