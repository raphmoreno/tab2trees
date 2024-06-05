// Define interfaces for TypeScript type checking
interface WeatherData {
    weather: Array<{ main: string }>;
}

interface Position {
    coords: {
        latitude: number;
        longitude: number;
    };
}

interface WeatherBackground {
    type: string;
    color: string;
}

export function getLocation(): void {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

export function showPosition(position: Position): void {
    const { latitude, longitude } = position.coords;
    const url: string = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=74a3227a31a8d6836732c84f29a6f015&units=metric`;
    fetchWeather(url);
}

export function fetchWeather(url: string): void {
    fetch(url)
        .then(response => response.json())
        .then((data: WeatherData) => {
            displayWeather(data);
            changeBackground(data.weather[0].main);
        })
        .catch(error => console.error('Error fetching weather data:', error));
}

export function displayWeather(data: WeatherData): void {
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        weatherInfo.innerHTML = `<p>What's the weather like? ${data.weather[0].main}</p>`;
    }
}

function showError(error: GeolocationPositionError): void {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
    }
}

export function changeBackground(type: string): void {
    const defaultBgColor = "#FFFFFF";  // Default background color
    const bgColor: WeatherBackground[] = [
        { type: "Clouds", color: "#71C4C2" },
        { type: "Thunderstorm", color: "#E3BCB5" },
        { type: "Rain", color: "#c4dfdd" },
        { type: "Rain", color: "#E8D8D1" },
        { type: "Clear", color: "#62788d" },
        { type: "Clear", color: "#E1D8D1" },
        { type: "Drizzle", color: "#F7F7F7" },
        { type: "Snow", color: "#E8D8D2" }
    ];

    let matchingTypes = bgColor.filter(item => item.type === type);
    let randomItem = matchingTypes[Math.floor(Math.random() * matchingTypes.length)];
    let newBg = randomItem ? randomItem.color : defaultBgColor;

    document.body.style.backgroundColor = newBg;
}
