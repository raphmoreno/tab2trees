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
    const defaultBgColor = "#F1F1F2";  // Neutral gray for default background color
    const bgColor: WeatherBackground[] = [
        { type: "Clouds", color: "#A3B1C6" },  // Soft blue-gray
        { type: "Clouds", color: "#B0C4DE" },  // Light steel blue
        { type: "Thunderstorm", color: "#505B67" },  // Dark slate gray
        { type: "Thunderstorm", color: "#404E5A" },  // Deeper gray for intense storms
        { type: "Rain", color: "#738290" },  // Cool medium gray
        { type: "Rain", color: "#9FAFBF" },  // Light blue-gray
        { type: "Rain", color: "#6E7F8D" },  // Dusty blue
        { type: "Clear", color: "#F7D1BA" },  // Warm peach
        { type: "Clear", color: "#FFF5EE" },  // Very pale orange
        { type: "Clear", color: "#FFE5B4" },  // Mellow apricot
        { type: "Drizzle", color: "#CDD6DD" },  // Light gray-blue
        { type: "Drizzle", color: "#D3DDE4" },  // Very soft blue
        { type: "Snow", color: "#E6ECEF" },  // Very pale blue
        { type: "Snow", color: "#F0F8FF" }   // Alice blue, mimicking snowy brightness
    ];

    let matchingTypes = bgColor.filter(item => item.type === type);
    let randomItem = matchingTypes[Math.floor(Math.random() * matchingTypes.length)];
    let newBg = randomItem ? randomItem.color : defaultBgColor;

    document.body.style.backgroundColor = newBg;
}