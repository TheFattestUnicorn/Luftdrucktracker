document.addEventListener('DOMContentLoaded', () => {
    const pressureList = document.getElementById('pressure-list');
    const listItemTemplate = document.getElementById('pressure-list-item-template').content;
    const currentMonthSpan = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    let currentMonth = new Date(); // Startdatum ist der aktuelle Monat
    let allPressureData = [];
    let chartInstances = {}; // Speichert laufende Charts

    // URL der API (wird jetzt aus der Konstante verwendet)
    const API_URL = 'testPressureData.json';

    // Funktion zum Abrufen der Druckdaten
    async function fetchPressureData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allPressureData = data.pressures;
            renderList();
        } catch (error) {
            console.error('Fehler beim Laden der Druckdaten:', error);
            pressureList.innerHTML = '<li>Fehler beim Laden der Daten.</li>';
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
    
            listItem.querySelector('.pressure-value').textContent = `${formattedDate}: ${entry.averagePressure.toFixed(2)} hPa`;
    
            const dayEntry = listItem.querySelector('.day-entry');
            const slider = listItem.querySelector('.pressure-slider');
            const sliderValue = listItem.querySelector('.slider-value');
            const chartContainer = listItem.querySelector('.chart-container');
            const canvas = listItem.querySelector('canvas');
            const notesTextarea = listItem.querySelector('textarea');
            const saveNoteButton = listItem.querySelector('.save-note-button');
    
            saveNoteButton.addEventListener('click', () => {
                const noteText = notesTextarea.value;
                const date = saveNoteButton.getAttribute('data-date');
                console.log(`Notiz für ${date}: ${noteText}`);
                // Hier würdest du die Notiz tatsächlich speichern (z.B. an einen Server senden)
                // In diesem Beispiel geben wir sie nur in der Konsole aus.
            });
    
            slider.id = `slider-${entry.date}`;
            sliderValue.id = `slider-value-${entry.date}`;
            chartContainer.id = `chart-${entry.date}`;
            canvas.id = `canvas-${entry.date}`;
            notesTextarea.id = `notes-${entry.date}`; // ID für das Textfeld
            chartContainer.style.display = 'none';
    
            slider.addEventListener('input', function(event) {
                event.stopPropagation();
                sliderValue.textContent = this.value;
                let color;
                if (this.value <= 2) {
                    color = 'green';
                } else if (this.value <= 4) {
                    color = 'yellowgreen';
                } else if (this.value <= 6) {
                    color = 'orange';
                } else if (this.value <= 8) {
                    color = 'orangered';
                } else {
                    color = 'red';
                }
                dayEntry.style.setProperty('--day-entry-bg', color);
                console.log(`Slider value for ${entry.date}: ${this.value}`);   // Debugging-Ausgabe
            });
    
            sliderValue.textContent = '1';
    
            dayEntry.addEventListener('click', (event) => {
                if (!event.target.classList.contains('pressure-slider') &&
                    !event.target.classList.contains('slider-value')) {
                    toggleChart(entry.date);
                }
            });
    
            pressureList.appendChild(listItem);
        });
    }

    function toggleChart(dateKey) {
        const container = document.getElementById(`chart-${dateKey}`);
        if (container.style.display === 'none') {
            container.style.display = 'flex';
            container.classList.add('open');
            if (!chartInstances[dateKey]) {
                drawChart(dateKey);
            }
        } else {
            container.style.display = 'none';
            container.classList.remove('open');
            if (chartInstances[dateKey]) {
                chartInstances[dateKey].destroy();
                delete chartInstances[dateKey];
            }
        }
    }

    function drawChart(dateKey) {
        const dayData = allPressureData.filter(entry => entry.timestamp.startsWith(dateKey))
                                     .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const labels = dayData.map(entry => new Date(entry.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
        const pressures = dayData.map(entry => entry.pressure);
        const canvas = document.getElementById(`canvas-${dateKey}`);

        if (canvas) {
            const ctx = canvas.getContext('2d');
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