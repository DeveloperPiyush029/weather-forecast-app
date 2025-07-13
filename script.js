const API_KEY = "9bc2f3cc3f2d650b4dd251c54a1a650c"; //API Key

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const getLocationBtn = document.getElementById("getLocationBtn");
const recentSearches = document.getElementById("recentSearches");
const weatherDisplay = document.getElementById("weatherDisplay");
const errorDisplay = document.getElementById("error");
const toggleTheme = document.getElementById("toggleTheme");

function showError(message) {
  errorDisplay.textContent = message;
  errorDisplay.classList.remove("hidden");
  weatherDisplay.classList.add("hidden");
}

function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  cities = [city, ...cities.filter(c => c !== city)].slice(0, 5);
  localStorage.setItem("recentCities", JSON.stringify(cities));
  loadRecentCities();
}

function loadRecentCities() {
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  recentSearches.innerHTML = '<option disabled selected>Recent Searches</option>';
  cities.forEach(city => {
    const opt = document.createElement("option");
    opt.textContent = city;
    opt.value = city;
    recentSearches.appendChild(opt);
  });
  recentSearches.classList.toggle("hidden", cities.length === 0);
}

async function fetchWeather(city) {
  try {
    const cleanCity = encodeURIComponent(city.trim());
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cleanCity}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();
    displayCurrentWeather(data);
    fetchForecast(data.coord.lat, data.coord.lon);
    saveRecentCity(city);
  } catch (err) {
    showError(err.message);
  }
}

function displayCurrentWeather(data) {
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  document.getElementById("weatherDescription").textContent = data.weather[0].description;
  document.getElementById("temperature").textContent = Math.round(data.main.temp);
  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("windSpeed").textContent = data.wind.speed;

  errorDisplay.classList.add("hidden");
  weatherDisplay.classList.remove("hidden");
}

async function fetchForecast(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    const forecastEl = document.getElementById("forecast");
    forecastEl.innerHTML = "";

    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    daily.slice(0, 5).forEach(day => {
      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded shadow text-center dark:bg-gray-800";
      card.innerHTML = `
        <p class="font-semibold">${new Date(day.dt_txt).toDateString().slice(0, 10)}</p>
        <img class="mx-auto" src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" />
        <p>${day.weather[0].description}</p>
        <p>🌡️ ${Math.round(day.main.temp)}°C</p>
        <p>💧 ${day.main.humidity}%</p>
        <p>🌬️ ${day.wind.speed} km/h</p>
      `;
      forecastEl.appendChild(card);
    });
  } catch (error) {
    console.error("Forecast error:", error);
    showError("Could not fetch forecast data.");
  }
}

// Event listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return showError("Please enter a city name.");
  fetchWeather(city);
});

getLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return showError("Geolocation not supported.");
  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude } = position.coords;
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    fetchWeather(data.name);
  }, () => showError("Failed to get location."));
});

recentSearches.addEventListener("change", (e) => {
  fetchWeather(e.target.value);
});

// Theme toggle
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Init
(function init() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
  loadRecentCities();
})();
