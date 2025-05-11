const express = require('express');
const sqlite3 = require('better-sqlite3');
const path = require('path');
const { Bus } = require('async-i2c-bus');
const { BMP280 } = require('async-bmp280');
const cors = require('cors'); // Import the cors package

const app = express();
const port = 3000;

let db; // Declare the database variable outside the try-catch
let server;
let isShuttingDown = false; // Add a flag to indicate shutdown

try {
  // Connect to the SQLite database
  db = new sqlite3(path.join(__dirname, 'weather_and_migraine.db'));
  console.log('Connected to the database.');


} catch (err) {
  console.error('Error opening database:', err.message);
  process.exit(1);
}

// Enable CORS for all routes, including preflight requests
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Function to insert pressure readings into the database
function insertPressureReading(pressure_hpa) {
  const now = new Date().toISOString();
  if (isShuttingDown) {
    console.warn('Database write prevented due to shutdown: Pressure =', pressure_hpa);
    return; // Don't write if shutting down
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO pressure_readings (timestamp, pressure_hpa)
      VALUES (?, ?)
    `);
    stmt.run(now, pressure_hpa);
    console.log(`Inserted pressure reading: ${pressure_hpa} hPa at ${now}`);
  } catch (error) {
    console.error('Error inserting pressure reading:', error.message);
  }
}

// Define API endpoints
app.get('/api/pressure/history', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT timestamp, pressure_hpa as pressure
      FROM pressure_readings
      ORDER BY timestamp ASC
    `).all();
    res.json({ pressures: rows });
  } catch (err) {
    console.error('Error getting pressure history:', err.message);
    res.status(500).json({ error: 'Internal server error' });
    // Important: Send a proper error response to the client
    res.status(500).json({ error: 'Failed to retrieve pressure history' });
  }
});

app.post('/api/pressure', (req, res) => {
  const { pressure_hpa } = req.body;

  if (pressure_hpa === undefined || typeof pressure_hpa !== 'number') {
    res.status(400).json({ error: 'Pressure reading is required and must be a number.' });
    return;
  }

  insertPressureReading(pressure_hpa); // Use the function
  res.status(201).json({ message: 'Pressure reading added successfully', timestamp: new Date().toISOString(), pressure_hpa });
});

// Neuer Endpunkt zum Speichern von Notizen und Slider-Werten
app.post('/api/pressure/history', (req, res) => {
  const { date, note, sliderValue } = req.body;

  if (!date || note === undefined || sliderValue === undefined) {
    res.status(400).json({ error: 'Date, note, and sliderValue are required.' });
    return;
  }

  try {
    // **Database Insert Change (Part 2):**
    // Save the sliderValue to the severity column.
    const stmt = db.prepare(`
      INSERT INTO migraine_events (timestamp, severity, note)
      VALUES (?, ?, ?)
    `);
    stmt.run(date, sliderValue, note); // Changed order to match new insert
    console.log(`Inserted migraine data: date=${date}, severity=${sliderValue}, note=${note}`);
    res.status(201).json({ message: 'Data saved successfully', date, severity: sliderValue, note }); //changed response
  } catch (error) {
    console.error('Error saving data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
    // Important: Send a proper error response to the client
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.get('/api/migraine', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT timestamp, severity, note
      FROM migraine_events
      ORDER BY timestamp ASC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching migraine events:', err.message);
    res.status(500).json({ error: 'Internal server error' });
    // Important: Send a proper error response to the client
    res.status(500).json({ error: 'Failed to retrieve migraine events' });
  }
});

// Start the server
server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// I2C and Sensor setup
const main = async () => {
  const busNumber = 1;
  const bus = new Bus({ busNumber });
  try {
    await bus.open();

    const bmp280 = BMP280({ bus: bus, address: 0x76 });
    await bmp280.init();

    /** Read pressure every hour and store it */
    setInterval(async () => {
      try {
        const pressure = await bmp280.readPressure();
        console.log(`Pressure: ${pressure} Pa`);
        // Convert Pascal to HectoPascal
        const pressure_hpa = pressure / 100;
        insertPressureReading(pressure_hpa); // Store in database
      } catch (error) {
        console.error("Error reading sensor data:", error);
      }
    }, 3600000); // 1 hour (60 minutes * 60 seconds * 1000 milliseconds)

  } catch (error) {
    console.error("I2C or Sensor error", error);
    process.exit(1); // Exit on error
  }
};

// Initialize sensor reading
main().catch(err => {
  console.error("Error in main:", err);
  process.exit(1);
});

// Handle process termination (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT received. Starting graceful shutdown...');
  isShuttingDown = true; // Set the shutdown flag
  let serverClosed = false;
  let dbClosed = false;

  const attemptExit = () => {
    if (serverClosed && dbClosed) {
      console.log('Exiting process.');
      process.exit();
    }
  };

  // Timeout fallback to force exit after 5 seconds
  const shutdownTimeout = setTimeout(() => {
    console.error('Shutdown taking too long. Forcing exit.');
    process.exit(1);
  }, 5000); // 5 seconds

  if (server) {
    server.close((err) => {
      if (err) {
        console.error('Error stopping server:', err.message);
      } else {
        console.log('Server stopped.');
      }
      serverClosed = true;
      attemptExit();
    });
  } else {
    serverClosed = true;
    attemptExit();
  }

  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Closed the database connection.');
      }
      dbClosed = true;
      attemptExit();
    });
  } else {
    dbClosed = true;
    attemptExit();
  }

  // Clear the timeout if shutdown completes successfully
  process.on('exit', () => clearTimeout(shutdownTimeout));
});
