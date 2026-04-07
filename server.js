import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'patients-data.json');

app.use(cors());
app.use(express.json());

// Initialize data file
function initializeDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
  }
}

// Get all patients
app.get('/api/patients', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const patients = JSON.parse(data);
    res.json(patients);
  } catch (error) {
    console.error('Error reading patients:', error);
    res.json([]);
  }
});

// Add patient
app.post('/api/patients', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const patients = JSON.parse(data);
    const newPatient = req.body;
    patients.unshift(newPatient);
    fs.writeFileSync(DATA_FILE, JSON.stringify(patients, null, 2), 'utf-8');
    res.json(newPatient);
  } catch (error) {
    console.error('Error adding patient:', error);
    res.status(500).json({ error: 'Failed to add patient' });
  }
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const patients = JSON.parse(data);
    const index = patients.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    patients[index] = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(patients, null, 2), 'utf-8');
    res.json(patients[index]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    let patients = JSON.parse(data);
    patients = patients.filter(p => p.id !== req.params.id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(patients, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

initializeDataFile();
app.listen(PORT, () => {
  console.log(`\n✅ Patient Data Server running on http://localhost:${PORT}`);
  console.log(`📊 Data file: ${DATA_FILE}\n`);
});
