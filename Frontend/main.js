/* // für das Lokale Testen
// testSaveData.json
[{"timestamp":"2025-05-01","severity":5,"note":"asdfasdf"},
    {"timestamp":"2025-05-03","severity":2,"note":"badgfgh"},
    {"timestamp":"2025-05-07","severity":4,"note":"wertwer"}
]
*/

document.addEventListener('DOMContentLoaded', () => {
    const pressureList = document.querySelector('#pressure-list');
    const listItemTemplate = document.querySelector('#pressure-list-item-template').content;
    const currentMonthSpan = document.querySelector('#current-month');
    const prevMonthButton = document.querySelector('#prev-month');
    const nextMonthButton = document.querySelector('#next-month');

    const API_URL = 'https://migr-api.fatunicorn.ch/api';
    const CLICK = 'click';
    const DISPLAY_NONE = 'none';
    const DISPLAY_FLEX = 'flex';
    const OPEN_CLASS = 'open';

    let currentMonth = new Date();
    let allPressureData = [];
    let allStoredData = [];
    let chartInstances = {};

    // Funktion zum Abrufen der Luftdruck-Druckdaten
    async function fetchPressureData() {
        try {
            const response = await fetch(API_URL + '/pressure/history');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allPressureData = data.pressures;
            renderList();
            await loadSavedData(); // Lade die gespeicherten Daten nach dem Rendern der Liste
        } catch (error) {
            console.error('Fehler beim Laden der Druckdaten:', error);
            pressureList.innerHTML = '<li>Fehler beim Laden der Daten.</li>';
        }
    }

    async function loadSavedData() {
        try {
            const response = await fetch('testSaveData.json'); // Oder deine API_URL + '/api/migraine'
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allStoredData = data;
            //console.log('Gespeicherte Daten geladen:', allStoredData); // Debugging-Info

            // Daten verwenden, um die UI zu aktualisieren
            for (const date in allStoredData) {
                const entry = allStoredData[date];
                const slider = document.getElementById(`slider-${entry.timestamp}`);
                const sliderValue = document.getElementById(`slider-value-${entry.timestamp}`);
                const notesTextarea = document.getElementById(`notes-${entry.timestamp}`);
                if (slider && sliderValue) {
                    slider.value = entry.severity;
                    sliderValue.textContent = entry.severity;
                    const color = getSliderColor(entry.severity);
                    slider.parentElement.parentElement.style.setProperty('--day-entry-bg', color);
                }
                if (notesTextarea) {
                    notesTextarea.value = entry.note;
                }
            }


        } catch (error) {
            console.error('Fehler beim Laden der gespeicherten Daten:', error);
            allStoredData = {}; // Stelle sicher, dass allStoredData immer ein Objekt ist
        }
    }

    async function saveNoteAndSliderValue(date, note, sliderValue) {
        try {
            const response = await fetch(API_URL + '/pressure/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: date,
                    note: note,
                    sliderValue: sliderValue
                })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const responseData = await response.json();
            console.log('Daten erfolgreich gesendet:', responseData);
            // Hier kannst du dem Benutzer eine Rückmeldung geben (z.B. "Gespeichert!")
    
        } catch (error) {
            console.error('Fehler beim Senden der Daten:', error);
            // Hier kannst du dem Benutzer eine Fehlermeldung anzeigen
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

    // Funktion zum Anzeigen des Monatsnamens
    function displayMonth() {
        const options = { month: 'long', year: 'numeric' };
        currentMonthSpan.textContent = currentMonth.toLocaleDateString('de-DE', options);
    }

    // Funktion zum Rendern der Liste der Tage mit Slidern und Charts
    function handleSliderInput(event, dayEntry) {
        event.stopPropagation();
        const sliderValue = event.target.value;
        event.target.nextElementSibling.textContent = sliderValue;
        const color = getSliderColor(sliderValue);
        dayEntry.style.setProperty('--day-entry-bg', color);
    }

    function getSliderColor(value) {
        const colors = [
            'green',
            'lightgreen',
            'yellowgreen',
            'lightyellow',
            'yellow',
            'lightorange',
            'orange',
            'lightcoral',
            'orangered',
            'red'
        ];
        return colors[value - 1] || colors[0]; // value ist 1-basiert, Array ist 0-basiert
    }

    function handleDayEntryClick(event, date, toggleChart) {
        if (!event.target.classList.contains('pressure-slider') &&
            !event.target.classList.contains('slider-value')) {
            toggleChart(date);
        }
    }

    function toggleChart(dateKey) {
        const container = document.getElementById(`convertible-${dateKey}`);
        container.classList.toggle(OPEN_CLASS);
        container.style.display = container.classList.contains(OPEN_CLASS) ? DISPLAY_FLEX : DISPLAY_NONE;

        if (container.classList.contains(OPEN_CLASS) && !chartInstances[dateKey]) {
            drawChart(dateKey);
        } else if (!container.classList.contains(OPEN_CLASS) && chartInstances[dateKey]) {
            chartInstances[dateKey].destroy();
            delete chartInstances[dateKey];
        }
    }

    function renderList() {
        pressureList.innerHTML = '';
        const templateContent = listItemTemplate;
        const currentYear = currentMonth.getFullYear();
        const currentMonthIndex = currentMonth.getMonth();
        displayMonth();

        const dailyAverages = calculateDailyAverages(allPressureData);

        const filteredData = dailyAverages.filter(entry => {
            const date = new Date(entry.date);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonthIndex;
        });

        if (filteredData.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Keine Daten für diesen Monat verfügbar.';
            pressureList.appendChild(li);
            return;
        }

        filteredData.forEach(entry => {
            const listItem = document.importNode(templateContent, true);
            const formattedDate = new Date(entry.date).toLocaleDateString('de-DE');
            const dayEntry = listItem.querySelector('.day-entry');
            const slider = listItem.querySelector('.pressure-slider');
            const sliderValue = listItem.querySelector('.slider-value');
            const convertible = listItem.querySelector('.convertible');
            const chartContainer = listItem.querySelector('canvas');
            const notesTextarea = listItem.querySelector('textarea');
            const saveNoteButton = listItem.querySelector('.save-note-button');

            listItem.querySelector('.pressure-value').textContent = `${formattedDate}: ⌀${entry.averagePressure.toFixed(2)} hPa`;

            saveNoteButton.addEventListener(CLICK, () => {
                const noteText = notesTextarea.value;
                const date = entry.date // Format: YYYY-MM-DD;
                const sliderValue = slider.value;
                saveNoteAndSliderValue(date, noteText, sliderValue);
            });

            slider.id = `slider-${entry.date}`;
            sliderValue.id = `slider-value-${entry.date}`;
            convertible.id = `convertible-${entry.date}`;
            chartContainer.id = `chart-${entry.date}`;
            notesTextarea.id = `notes-${entry.date}`;
            convertible.style.display = DISPLAY_NONE;

            slider.addEventListener('input', (event) => handleSliderInput(event, dayEntry));
            dayEntry.addEventListener(CLICK, (event) => handleDayEntryClick(event, entry.date, toggleChart));

            sliderValue.textContent = '1';

            pressureList.appendChild(listItem);
        });
    }

    function drawChart(dateKey) {
        const dayData = allPressureData.filter(entry => entry.timestamp.startsWith(dateKey))
                                     .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const labels = dayData.map(entry => new Date(entry.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
        const pressures = dayData.map(entry => entry.pressure);
        const chartContainer = document.getElementById(`chart-${dateKey}`);

        if (chartContainer) {
            const ctx = chartContainer.getContext('2d');
            if (chartInstances[dateKey]) {
                chartInstances[dateKey].destroy();
                delete chartInstances[dateKey];
            }
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
                        pointRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Uhrzeit'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'hPa'
                            },
                            beginAtZero: false
                        }
                    }
                }
            });
            chartInstances[dateKey] = chart;
        }
    }

    // Event-Listener für die Schaltflächen zum Wechseln des Monats
    prevMonthButton.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderList();
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderList();
    });

    // Initialisierung: Daten abrufen und die Liste initial rendern
    fetchPressureData();
});