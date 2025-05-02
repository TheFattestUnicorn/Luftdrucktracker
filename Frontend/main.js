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
// http://151.248.132.26:3000/api/pressure/history
const API_URL = 'testPressureData.json'; // Ersetze dies mit der tatsächlichen URL der API

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
    pressureList.innerHTML = ''; // Leere die Liste

    const template = document.getElementById('pressure-list-item-template'); // Hole das Template
    const templateContent = template.content; // Hole den Inhalt des Templates

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
            const li = document.importNode(templateContent, true); // Klone das Template

            const formattedDate = new Date(entry.date).toLocaleDateString('de-DE');

            // Ersetze die Platzhalter im geklonten Template
            const pressureText = li.querySelector('.pressure-value');
            if (pressureText) {
                pressureText.textContent = `${formattedDate}: ${entry.averagePressure.toFixed(2)} hPa`;
            }

            // Damit bei Klick auf Padding der Chart auch getoggelt wird
            const dayEntry = li.querySelector('.day-entry');
            if (dayEntry) {
                dayEntry.addEventListener('click', (event) => {
                    if (!event.target.classList.contains('pressure-slider') &&
                        !event.target.classList.contains('slider-value')) {
                        toggleChart(entry.date);
                    }
                });
            }

            // Füge den Slider und den Chart-Container hinzu
            const slider = li.querySelector('.pressure-slider');
            if (slider) {
                slider.id = `slider-${entry.date}`;
                slider.addEventListener('input', (event) => {
                    event.stopPropagation();
                    const sliderValue = document.getElementById(`slider-value-${entry.date}`);
                    if (sliderValue) {
                        sliderValue.textContent = event.target.value;
                    }
                
                    const dayEntry = slider.closest('.day-entry'); // Finde das zugehörige day-entry Element
                
                    // Farbe basierend auf dem Slider-Wert berechnen (5 Stufen)
                    let color;
                    if (slider.value <= 2) {                        
                        color = 'green';
                    } else if (slider.value <= 4) {
                        color = 'yellowgreen';
                    } else if (slider.value <= 6) {
                        color = 'orange';
                    } else if (slider.value <= 8) {
                        color = 'orangered';
                    } else {
                        color = 'red';
                    }
                
                    // CSS-Variable auf dem day-entry Element aktualisieren
                    if (dayEntry) {
                        dayEntry.style.setProperty('--day-entry-bg', color);
                    }
                
                    console.log(`Slider value for ${entry.date}: ${slider.value}`);
                });
            }

            const sliderValueSpan = li.querySelector('.slider-value');
            if (sliderValueSpan) {
                sliderValueSpan.id = `slider-value-${entry.date}`;
                sliderValueSpan.textContent = '1'; // Startwert des Sliders
            }

            const chartContainer = li.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.id = `chart-${entry.date}`;
            }

            const canvas = li.querySelector('canvas');
            if (canvas) {
                canvas.id = `canvas-${entry.date}`;
                const ctx = canvas.getContext('2d');
                if (ctx && chartInstances[entry.date]) {
                    chartInstances[entry.date].destroy();
                    delete chartInstances[entry.date];
                }
            }

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

    const canvas = document.getElementById(`canvas-${dateKey}`);
    if (canvas) {
        const ctx = canvas.getContext('2d');

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
                    className: 'chart-line' // CSS-Klasse für die Linien-Stile
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Uhrzeit', className: 'chart-scales' } }, // CSS-Klasse für die X-Achse
                    y: { title: { display: true, text: 'hPa', className: 'chart-scales' } }  // CSS-Klasse für die Y-Achse
                }
            }

        });

        chartInstances[dateKey] = chart;
    }
}


window.onload = function() {
    fetchPressureData();    // Daten abrufen und Liste rendern

    // Event-Listener für die Navigation zwischen Monaten
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
};