from flask import Flask, render_template, request, jsonify
import openai
import requests
from urllib.parse import quote
from langdetect import detect

# Konfiguracja OpenAI API
openai.api_key = "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"

app = Flask(__name__, static_folder="static", template_folder="templates")


def get_weather(city, language="en"):
    """
    Pobiera dane pogodowe dla danego miasta za pomocą API OpenWeatherMap.
    """
    api_key = "0e784ad302e0fcf97a26292b99971040"  # Twój klucz API OpenWeatherMap
    city_encoded = quote(city)  # Kodowanie polskich znaków
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city_encoded}&appid={api_key}&units=metric&lang={language}"
    try:
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            temp = data['main']['temp']
            description = data['weather'][0]['description']
            humidity = data['main']['humidity']
            wind_speed = data['wind']['speed']

            if language == "pl":
                return f"Obecna pogoda w {city.title()} to {temp}°C z {description}. Wilgotność: {humidity}%, Prędkość wiatru: {wind_speed} m/s."
            else:
                return f"The current weather in {city.title()} is {temp}°C with {description}. Humidity: {humidity}%, Wind Speed: {wind_speed} m/s."
        elif response.status_code == 404:
            if language == "pl":
                return f"Miasto '{city}' nie zostało znalezione. Proszę sprawdzić nazwę i spróbować ponownie."
            else:
                return f"City '{city}' not found. Please check the name and try again."
        else:
            if language == "pl":
                return "Nie udało się pobrać danych o pogodzie. Spróbuj ponownie później."
            else:
                return "I couldn't fetch the weather data at the moment. Please try again later."
    except Exception as e:
        return f"Error while fetching weather data: {e}"


def chatbot_response(message):
    """
    Generowanie odpowiedzi z OpenAI ChatGPT oraz obsługa pogody i specjalnych przycisków.
    """
    try:
        # Rozpoznanie języka wiadomości
        language = detect(message)

        # Obsługa specjalnych poleceń
        if message.lower() == "Opowiedz żart":
            system_message = "You are a helpful assistant. Tell a random funny joke."
        elif message.lower() == "opowiedz mi ciekawostkę historyczną":
            system_message = "You are a knowledgeable assistant. Share an interesting historical fact."
        elif message.lower() == "opowiedz mi ciekawostkę dla Geeków":
            system_message = "You are a technical expert. Provide an interesting technical fact."
        elif "weather in" in message.lower() or "pogoda w" in message.lower():
            if "weather in" in message.lower():
                city = message.lower().split("weather in")[-1].strip()
            elif "pogoda w" in message.lower():
                city = message.lower().split("pogoda w")[-1].strip()
            else:
                city = None

            if not city:
                if language == "pl":
                    return "Podaj nazwę miasta, aby uzyskać informacje o pogodzie."
                else:
                    return "Please provide a city name to get the weather."

            return get_weather(city, language)
        else:
            # Domyślny kontekst
            system_message = "You are a helpful assistant."

        # Wywołanie API OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ]
        )
        return response['choices'][0]['message']['content'].strip()

    except Exception as e:
        return f"Error during communication with the model: {e}"


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
