// Beispiel was die API liefern sollte:
/*
{
  "pressures": [
    {"timestamp": "2025-04-28T00:00:00Z", "pressure": 1012.5},
    {"timestamp": "2025-04-28T01:00:00Z", "pressure": 1012.7},
    ...
  ]
}
*/
  

// URL der API
const API_URL = 'testPressureData.json'; // Beispiel: Du musst ggf. den Pfad anpassen

let allPressureData = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let chartInstances = {}; // Speichert laufende Charts, um sie sauber zu verwalten

async function fetchPressureData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Daten');
        }
        const data = await response.json();
        allPressureData = data.pressures;
        renderList();
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Hilfsfunktion: Tages-Durchschnitt berechnen
function calculateDailyAverages(data) {
    const dailySums = {};
    const dailyCounts = {};

    data.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dateKey = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

        if (!dailySums[dateKey]) {
            dailySums[dateKey] = 0;
            dailyCounts[dateKey] = 0;
        }

        dailySums[dateKey] += entry.pressure;
        dailyCounts[dateKey]++;
    });

    const dailyAverages = [];

    for (const dateKey in dailySums) {
        dailyAverages.push({
            date: dateKey,
            averagePressure: dailySums[dateKey] / dailyCounts[dateKey]
        });
    }

    return dailyAverages;
}

function renderList() {
    const pressureList = document.getElementById('pressure-list');
    pressureList.innerHTML = '';

    const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date(currentYear, currentMonth));
    document.getElementById('current-month').textContent = `${monthName} ${currentYear}`;

    const dailyAverages = calculateDailyAverages(allPressureData);

    const filteredData = dailyAverages.filter(entry => {
        const date = new Date(entry.date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    if (filteredData.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Keine Daten für diesen Monat verfügbar.';
        pressureList.appendChild(li);
    } else {
        filteredData.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="day-entry">
                    <span>${new Date(entry.date).toLocaleDateString('de-DE')}: ${entry.averagePressure.toFixed(2)} hPa</span>
                </div>
                <div class="chart-container" id="chart-${entry.date}" style="display:none; margin-top: 1rem;">
                    <canvas id="canvas-${entry.date}"></canvas>
                </div>
            `;

            li.querySelector('.day-entry').addEventListener('click', () => toggleChart(entry.date));

            pressureList.appendChild(li);
        });
    }
}

function toggleChart(dateKey) {
    const container = document.getElementById(`chart-${dateKey}`);

    if (container.style.display === 'none') {
        container.style.display = 'block';
        container.classList.add('open'); // Füge die 'open'-Klasse hinzu
        if (!chartInstances[dateKey]) {
            drawChart(dateKey);
        }
    } else {
        container.style.display = 'none';
        container.classList.remove('open'); // Entferne die 'open'-Klasse
    }
}

function drawChart(dateKey) {
    const dayData = allPressureData.filter(entry => {
        return entry.timestamp.startsWith(dateKey);
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = dayData.map(entry => {
        const date = new Date(entry.timestamp);
        return date.getHours() + ":00";
    });

    const pressures = dayData.map(entry => entry.pressure);

    const ctx = document.getElementById(`canvas-${dateKey}`).getContext('2d');

    // Überprüfen, ob der Chart bereits existiert und ihn ggf. löschen 
    if (chartInstances[dateKey]) {
        chartInstances[dateKey].destroy();
        delete chartInstances[dateKey];
    }
    // Neuen Chart erstellen
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Luftdruck (hPa)',
                data: pressures,
                borderColor: 'blue',
                backgroundColor: 'lightblue',
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Uhrzeit' } },
                y: { title: { display: true, text: 'hPa' } }
            }
        }
        
    });

    chartInstances[dateKey] = chart;
}

document.getElementById('prev-month').addEventListener('click', () => {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
    } else {
        currentMonth--;
    }
    renderList();
});

document.getElementById('next-month').addEventListener('click', () => {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
    } else {
        currentMonth++;
    }
    renderList();
});

// Beim Laden der Website aufrufen
document.addEventListener('DOMContentLoaded', fetchPressureData);