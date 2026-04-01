import json

# Read all the patient data
with open('patients-import.json', 'r', encoding='utf-8') as f:
    patients_data = json.load(f)

# Create the browser console script
script = """// PASTE THIS INTO BROWSER CONSOLE (F12) TO ADD ALL PATIENTS
// This script adds 219 patients directly to your database

(function() {
  console.log('Starting automatic patient import...');
  
  const patientsToAdd = """ + json.dumps(patients_data) + """;
  
  // Get existing patients from localStorage
  const existing = JSON.parse(localStorage.getItem('hospitalPatients') || '[]');
  const existingIds = new Set(existing.map(p => p.patientId));
  
  console.log('Found ' + existing.length + ' existing patients');
  
  // Add only new patients
  let addedCount = 0;
  for (const patient of patientsToAdd) {
    if (!existingIds.has(patient.patientId)) {
      existing.push(patient);
      addedCount++;
    }
  }
  
  // Save to localStorage
  localStorage.setItem('hospitalPatients', JSON.stringify(existing));
  
  console.log('Successfully added ' + addedCount + ' new patients');
  console.log('Total patients in database: ' + existing.length);
  console.log('Refreshing page in 2 seconds...');
  
  // Refresh the page to see the new patients
  setTimeout(() => {
    window.location.reload();
  }, 2000);
})();"""

with open('console_import.js', 'w', encoding='utf-8') as f:
    f.write(script)

print('Created console_import.js')
print('This script will add all 219 patients when pasted into the browser console')