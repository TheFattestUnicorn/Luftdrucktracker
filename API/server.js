import express from 'express';
import sqlite3 from 'better-sqlite3';
import { Bus } from 'async-i2c-bus';
import { BMP280 } from 'async-bmp280';

// Gemeni helped, for the change from request to import.
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

const allowedOrigins = [
  'https://migr-api.fatunicorn.ch',
  'https://migrane.fatunicorn.ch'
];

let db;
let server;
// Gemini help because of Shutdown
let isShuttingDown = false; // Add a flag to indicate shutdown

try {
  // Connect to the SQLite database
  db = new sqlite3(path.join(__dirname, 'weather_and_migraine.db'));
  console.log('Connected to the database.');
} catch (err) {
  console.error('Error opening database:', err.message);
  process.exit(1);
}

// Some help from Gemini, because documentation was a bit complicated.
// CORS Middleware to allow cross site origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedMethods = ['GET', 'POST', 'OPTIONS'];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
  }
  next();
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Function to insert pressure readings into the database
function insertPressureReading(pressure_hpa) {
  const now = new Date().toISOString();
  // Gemini help because of Shutdown
  if (isShuttingDown) {
    console.warn('Database write prevented due to shutdown: Pressure =', pressure_hpa);
    return; // Don't write if shutting down
  }
  try {
    const dbwrite = db.prepare(`
      INSERT INTO pressure_readings (timestamp, pressure_hpa)
      VALUES (?, ?)
    `);
    dbwrite.run(now, pressure_hpa);
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
    res.status(500).json({ error: 'Internal server error, failed to retrieve pressure history' });
  }
});

// Endpoint to save migraine data into migrane_events
app.post('/api/migraine', (req, res) => {
  const { date, note, sliderValue } = req.body;

  // Help from Gemini to check the right post
  if (!date || note === undefined || sliderValue === undefined) {
    res.status(400).json({ error: 'Date, note, and sliderValue are required.' });
    return;
  }

  try {
    // Check if a record with the given date already exists.
    const existingRecord = db.prepare(`
      SELECT timestamp FROM migraine_events WHERE timestamp = ?
    `).get(date);

    if (existingRecord) {
      // Update the existing record.
      const updateStmt = db.prepare(`
        UPDATE migraine_events SET severity = ?, note = ? WHERE timestamp = ?
      `);
      updateStmt.run(sliderValue, note, date);
      console.log(`Updated migraine data: date=${date}, severity=${sliderValue}, note=${note}`);
      res.status(200).json({ message: 'Data updated successfully', date, severity: sliderValue, note });
    } else {
      // Insert a new record.
      const dbwrite = db.prepare(`
        INSERT INTO migraine_events (timestamp, severity, note)
        VALUES (?, ?, ?)
      `);
      dbwrite.run(date, sliderValue, note);
      console.log(`Inserted migraine data: date=${date}, severity=${sliderValue}, note=${note}`);
      res.status(201).json({ message: 'Data saved successfully', date, severity: sliderValue, note });
    }


  } catch (error) {
    console.error('Error saving/updating data:', error.message);
    res.status(500).json({ error: 'Internal server error, failed to put in data' });
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
    res.status(500).json({ error: 'Internal server error, failed to retrieve migraine data' });
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
        insertPressureReading(pressure_hpa);
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


// Gemini helped a lot with the termination
// Handle process termination (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT received. Starting graceful shutdown...');
  isShuttingDown = true; // Set the shutdown flag
  let serverClosed = false;
  let dbClosed = false;

  const attemptExit = () => {
    console.log('Attempt Exit serverClosed:', serverClosed, 'dbClosed:', dbClosed);

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
    try {
      console.log('Closing database connection...');
      db.close();
      console.log('Closed the database connection.');
    } catch (err) {
      console.error('Error closing database:', err.message);
    }
    dbClosed = true;
    attemptExit();
  } else {
    dbClosed = true;
    attemptExit();
  }

  // Clear the timeout if shutdown completes successfully
  process.on('exit', () => clearTimeout(shutdownTimeout));
});