// Simple browser console script to import patients
// Copy and paste this entire script into your browser console

(async function() {
  console.log('Starting patient import...');

  // Patient data array (first 5 patients for testing)
  const patientsData = [
    {
      "Name": "Quilatan, Jaiden Beato",
      "Confinement Period": "07/08/2025 - 07/09/2025",
      "PIN": "190901927387",
      "ICD-10 Code": "R56.0",
      "HF": "9555.0",
      "PF": "4095",
      "TOTAL": "13650.0",
      "Date Filed": "09/05/2025",
      "Date Refiled": "",
      "Status": "paid",
      "Companion Name": "",
      "Relationship": "",
      "Contact Number": "",
      "Home Address": ""
    },
    {
      "Name": "Soriano, Lester Cristobal",
      "Confinement Period": "07/11/2025 - 07/13/2025",
      "PIN": "50259675550",
      "ICD-10 Code": "E29.1 / 54520",
      "HF": "10725.0",
      "PF": "9828",
      "TOTAL": "20553.0",
      "Date Filed": "09/10/2025",
      "Date Refiled": "",
      "Status": "paid",
      "Companion Name": "",
      "Relationship": "",
      "Contact Number": "",
      "Home Address": ""
    },
    {
      "Name": "Dulnuan, Kiersten Joy Maugao",
      "Confinement Period": "07/28/2025 - 07/30/2025",
      "PIN": "10253621198",
      "ICD-10 Code": "A01.0",
      "HF": "13650.0",
      "PF": "5850",
      "TOTAL": "19500.0",
      "Date Filed": "09/11/2025",
      "Date Refiled": "",
      "Status": "paid",
      "Companion Name": "",
      "Relationship": "",
      "Contact Number": "",
      "Home Address": ""
    }
  ];

  // Convert to patient records format
  const patients = [];
  for (let i = 0; i < patientsData.length; i++) {
    const data = patientsData[i];

    // Parse name
    const fullName = data.Name || '';
    let lastName = '', firstName = '';
    if (fullName.includes(',')) {
      const parts = fullName.split(',');
      lastName = parts[0].trim();
      firstName = parts[1].trim();
    } else {
      const nameParts = fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Parse confinement
    const confinement = data['Confinement Period'] || '';
    let startDate = '', endDate = '';
    if (confinement.includes(' - ')) {
      const dates = confinement.split(' - ');
      startDate = dates[0].trim();
      endDate = dates[1] ? dates[1].trim() : startDate;
    }

    // Clean PIN
    const pin = (data.PIN || '').replace(/\s+/g, '');

    // Parse fees
    const hf = parseFloat((data.HF || '0').replace(/,/g, '')) || 0;
    const pf = parseFloat((data.PF || '0').replace(/,/g, '')) || 0;
    const total = parseFloat((data.TOTAL || '0').replace(/,/g, '')) || 0;

    // Parse status
    const statusStr = (data.Status || '').toLowerCase();
    let status = 'not yet filed';
    if (statusStr === 'paid') status = 'paid';
    else if (statusStr.includes('in process')) status = 'in process';
    else if (statusStr.includes('return')) status = 'return to hospital';
    else if (statusStr.includes('denied')) status = 'denied';

    patients.push({
      patientId: `PT-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
      lastName,
      firstName,
      middleName: '',
      category: 'MM',
      confinementStart: startDate,
      confinementEnd: endDate,
      pin,
      icd10Code: data['ICD-10 Code'] || '',
      icd10Description: '',
      healthFacilityFee: hf,
      professionalFee: pf,
      totalCaseRate: total,
      totalBilling: total,
      dateFiled: data['Date Filed'] || '',
      dateRefiled: data['Date Refiled'] || '',
      status,
      companionName: data['Companion Name'] || '',
      relationship: data.Relationship || '',
      contactNumber: data['Contact Number'] || '',
      homeAddress: data['Home Address'] || '',
      street: '',
      barangay: '',
      city: '',
      province: '',
      zipCode: ''
    });
  }

  console.log('Prepared', patients.length, 'patients for import');

  // Try to find the React app and call the bulk import function
  // This assumes the app is loaded and the function is available
  try {
    // Look for the bulk import function in the window or React components
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
      console.log('Found React root, attempting to trigger bulk import...');

      // Create a custom event to trigger the bulk import
      const event = new CustomEvent('bulkImportPatients', { detail: patients });
      document.dispatchEvent(event);

      console.log('Bulk import event dispatched. Check if patients were added.');
    } else {
      console.log('Could not find React root. Make sure you are on the Patients page.');
    }
  } catch (error) {
    console.error('Error during import:', error);
  }

})();