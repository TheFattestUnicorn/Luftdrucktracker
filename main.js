/* main.js erstellt mit Hilfe von ChatGPT */
/* Optimiert mit Hilfe von Gemini AI */
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente abrufen
    const pressureList = document.querySelector('#pressure-list');
    const listItemTemplate = document.querySelector('#pressure-list-item-template').content;
    const currentMonthSpan = document.querySelector('#current-month');
    const prevMonthButton = document.querySelector('#prev-month');
    const nextMonthButton = document.querySelector('#next-month');

    // Konstanten & CSS-Elemente definieren
    const API_URL = 'http://fatunicorn.ch:3000/api';
    const CLICK = 'click';
    const DISPLAY_NONE = 'none';
    const PRESSURE_SLIDER_CLASS = 'pressure-slider';
    const SLIDER_VALUE_CLASS = 'slider-value';
    const OPEN_CLASS = 'open';
    const DAY_ENTRY_CLASS = 'day-entry';
    const DISPLAY_FLEX = 'flex';

    // Globale Variablen
    let currentMonth = new Date();
    let allPressureData = [];
    let allStoredData = [];
    let chartInstances = {};

    // Funktion zum Initalisieren der Website
    // und zum Abrufen der Luftdruckdaten
    async function onInit() {
        try {
            const data = await fetchData(API_URL + '/pressure/history');
            allPressureData = data.pressures;
            renderList();
            await loadSavedData();
        } catch (error) {
            pressureList.innerHTML = '<li>Fehler beim Laden der Daten.</li>';
        }
    }

    // Funktion zum Abrufen der Luftdruck-Druckdaten
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Abrufen von Daten:', error);
            throw error; // Reiche den Fehler weiter, damit der Aufrufer spezifisch reagieren kann
        }
    }

    // Funktion zum Abrufen der gespeicherten Daten
    async function loadSavedData() {
        try {
            const data = await fetchData(API_URL + '/migraine');  // 'testSaveData.json');
            allStoredData = data;

            // Daten verwenden, um die UI zu aktualisieren
            for (const date in allStoredData) {
                const entry = allStoredData[date];
                const slider = document.getElementById(`slider-${entry.timestamp}`);
                const sliderValueElement = document.getElementById(`slider-value-${entry.timestamp}`);
                const notesTextarea = document.getElementById(`notes-${entry.timestamp}`);
                if (slider && sliderValueElement) {
                    slider.value = entry.severity;
                    sliderValueElement.textContent = entry.severity;
                    const color = getSliderColor(entry.severity);
                    slider.style.setProperty('--thumb-color', color);
                    slider.parentElement.parentElement.style.setProperty('--day-entry-bg', color);
                }
                if (notesTextarea) {
                    notesTextarea.value = entry.note;
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der gespeicherten Daten:', error);
        }
    }

    // Funktion zum Speichern der Notiz und des Schiebereglers
    // und zum Senden der Daten an den Server
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

            // Button-Animation für Erfolg
            const saveButton = document.querySelector(`.save-note-button`);
            saveButton.classList.add('saved');

            setTimeout(() => {
                saveButton.classList.remove('saved');
            }, 500); // 500 Millisekunden
    
        } catch (error) {
            console.error('Fehler beim Senden der Daten:', error);

            // Button-Animation für Fehler
            const saveButton = document.querySelector(`.save-note-button`);
            saveButton.classList.add('error');

            setTimeout(() => {
                saveButton.classList.remove('error');
            }, 500); // Animation für 0.5 Sekunden anzeigen
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

    // Funktion zum Handhaben des Schiebereglers
    function handleSliderInput(event) {
        event.stopPropagation();    // Verhindert das Auslösen des Klicks auf den Tageseintrag
        const sliderValue = event.target.value;
        event.target.nextElementSibling.textContent = sliderValue;
        const color = getSliderColor(sliderValue);
        event.target.style.setProperty('--thumb-color', color);
    }

    // Funktion zum Berechnen der Farbe des Schiebereglers
    // basierend auf dem Wert (1 bis 10)
    function getSliderColor(value) {
        const colors = ['#008000', '#FFFF00', '#FFA500', '#FF0000']; // Hex-Werte verwenden
        const numColors = colors.length;

        // Stelle sicher, dass der Wert im gültigen Bereich liegt (1 bis 10)
        const normalizedValue = Math.max(1, Math.min(10, value));

        // Berechne den Index der Farben, die zu mischen sind
        const colorIndex = (normalizedValue - 1) / (10 - 1) * (numColors - 1);
        const lowerIndex = Math.floor(colorIndex);
        const upperIndex = Math.ceil(colorIndex);
        const ratio = colorIndex - lowerIndex;

        // Wenn der Index genau auf einer Farbe liegt, gib diese zurück
        if (lowerIndex === upperIndex) {
            return colors[lowerIndex];
        }

        // Mische die Farben linear
        const startColor = hexToRgb(colors[lowerIndex]);
        const endColor = hexToRgb(colors[upperIndex]);

        const r = Math.round(startColor.r * (1 - ratio) + endColor.r * ratio);
        const g = Math.round(startColor.g * (1 - ratio) + endColor.g * ratio);
        const b = Math.round(startColor.b * (1 - ratio) + endColor.b * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Hilfsfunktion, um Hex-Farben in RGB umzuwandeln
        function hexToRgb(hex) {
        // Entferne das führende '#' falls vorhanden
        hex = hex.startsWith('#') ? hex.slice(1) : hex;

        // Konvertiere den Hex-Wert in eine Zahl
        const bigint = parseInt(hex, 16);

        // Extrahiere die RGB-Komponenten
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;

        return { r, g, b };
    }

    
    // Registriere den Klick-Event-Listener für die Tages-Einträge
    function handleDayEntryClick(event, date, toggleChart) {
        // Verhindere das Auslösen durch Klicks auf den Schieberegler
        if (!event.target.classList.contains('pressure-slider')) {
            toggleChart(date);
        }
    }

    // Funktion zum Aufklappen des Diagramms
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

    // Funktion zum Zeichnen des Diagramms
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
                        borderColor: 'black',
                        backgroundColor: 'blue',
                        tension: 0.3,
                        pointRadius: 3,
                        pointBorderWidth: 0.5,
                        pointHoverRadius: 5,
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

    // Funktion zum Erstellen der Tageseinträge
    function renderList() {
        pressureList.innerHTML = '';
        const templateContent = listItemTemplate;
        const currentYear = currentMonth.getFullYear();
        const currentMonthIndex = currentMonth.getMonth();
        displayMonth();

        const dailyAverages = calculateDailyAverages(allPressureData);

        // Filtere die Daten für den aktuellen Monat
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

        // Erstelle die Tageseinträge
        filteredData.forEach(entry => {
            const listItem = document.importNode(templateContent, true);
            const formattedDate = new Date(entry.date).toLocaleDateString('de-DE');
            const dayEntry = listItem.querySelector(`.${DAY_ENTRY_CLASS}`);
            const slider = listItem.querySelector(`.${PRESSURE_SLIDER_CLASS}`);
            const sliderValueElement = listItem.querySelector(`.${SLIDER_VALUE_CLASS}`);
            const convertible = listItem.querySelector('.convertible');
            const chartContainer = listItem.querySelector('canvas');
            const notesTextarea = listItem.querySelector('textarea');
            const saveNoteButton = listItem.querySelector('.save-note-button');

            listItem.querySelector('.pressure-value').textContent = `${formattedDate}: ⌀${entry.averagePressure.toFixed(2)} hPa`;

            saveNoteButton.addEventListener(CLICK, () => {
                const noteText = notesTextarea.value;
                const date = entry.date;
                const sliderValue = slider.value;
                saveNoteAndSliderValue(date, noteText, sliderValue);
            });

            slider.id = `slider-${entry.date}`;
            sliderValueElement.id = `slider-value-${entry.date}`;
            convertible.id = `convertible-${entry.date}`;
            chartContainer.id = `chart-${entry.date}`;
            notesTextarea.id = `notes-${entry.date}`;
            convertible.style.display = DISPLAY_NONE;

            slider.addEventListener('input', (event) => handleSliderInput(event, dayEntry));
            dayEntry.addEventListener(CLICK, (event) => handleDayEntryClick(event, entry.date, toggleChart));

            sliderValueElement.textContent = '1';

            pressureList.appendChild(listItem);
        });
    }

    // Event-Listener für die Schaltflächen zum Wechseln des Monats
    prevMonthButton.addEventListener('click', async () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderList();
        await loadSavedData(); // Gespeicherte Daten nach dem Rendern laden
    });

    nextMonthButton.addEventListener('click', async () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderList();
        await loadSavedData(); // Gespeicherte Daten nach dem Rendern laden
    });

    // Initialisierung: Daten abrufen und die Liste initial rendern
    onInit();
});