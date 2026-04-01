import pandas as pd
import sys
import os

# Add the src directory to Python path to import our modules
sys.path.insert(0, 'src')

try:
    # Import our database functions
    from app.lib.database import addPatient as addPatientToDB
    from app.lib.types import PatientRecord
    from app.lib.icdRates import calculateDaysSince

    # Read the cleaned CSV
    df = pd.read_csv('phic-patients-clean.csv')

    print(f'Found {len(df)} patients to import')

    # Convert DataFrame to patient records
    patients_to_import = []

    for idx, row in df.iterrows():
        try:
            # Parse name
            full_name = str(row['Name']).strip()
            if ',' in full_name:
                parts = full_name.split(',', 1)
                last_name = parts[0].strip()
                first_name = parts[1].strip()
            else:
                # Handle names without comma
                name_parts = full_name.split()
                first_name = name_parts[0] if name_parts else ''
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

            # Parse confinement period
            confinement = str(row['Confinement Period']).strip()
            start_date = ''
            end_date = ''
            if ' - ' in confinement:
                dates = confinement.split(' - ')
                start_date = dates[0].strip()
                end_date = dates[1].strip() if len(dates) > 1 else start_date

            # Clean PIN
            pin = str(row['PIN']).strip().replace(' ', '')

            # Validate PIN is 12 digits
            if len(pin) != 12 or not pin.isdigit():
                print(f'Skipping row {idx+1}: Invalid PIN {pin}')
                continue

            # Parse fees
            hf = float(str(row['HF']).replace(',', '')) if pd.notna(row['HF']) else 0
            pf = float(str(row['PF']).replace(',', '')) if pd.notna(row['PF']) else 0
            total = float(str(row['TOTAL']).replace(',', '')) if pd.notna(row['TOTAL']) else 0

            # Parse dates
            date_filed = str(row['Date Filed']).strip() if pd.notna(row['Date Filed']) else ''
            date_refiled = str(row['Date Refiled']).strip() if pd.notna(row['Date Refiled']) else ''

            # Parse status
            status_str = str(row['Status']).strip().lower()
            if status_str == 'paid':
                status = 'paid'
            elif 'in process' in status_str:
                status = 'in process'
            elif 'return' in status_str:
                status = 'return to hospital'
            elif 'denied' in status_str:
                status = 'denied'
            else:
                status = 'not yet filed'

            # Companion info
            companion_name = str(row['Companion Name']).strip() if pd.notna(row['Companion Name']) else ''
            relationship = str(row['Relationship']).strip() if pd.notna(row['Relationship']) else ''
            contact = str(row['Contact Number']).strip() if pd.notna(row['Contact Number']) else ''
            address = str(row['Home Address']).strip() if pd.notna(row['Home Address']) else ''

            # Create patient record
            patient = {
                'id': '',  # Will be set by database
                'patientId': f'PT-{pd.Timestamp.now().year}-{str(idx+1).zfill(3)}',
                'lastName': last_name,
                'firstName': first_name,
                'middleName': '',
                'category': 'MM',
                'confinementStart': start_date,
                'confinementEnd': end_date,
                'pin': pin,
                'icd10Code': str(row['ICD-10 Code']).strip(),
                'icd10Description': '',
                'healthFacilityFee': hf,
                'professionalFee': pf,
                'totalCaseRate': total,
                'totalBilling': total,
                'dateFiled': date_filed,
                'dateRefiled': date_refiled,
                'daysSinceFiled': calculateDaysSince(date_filed) if date_filed else 0,
                'daysSinceRefiled': calculateDaysSince(date_refiled) if date_refiled else None,
                'status': status,
                'companionName': companion_name,
                'relationship': relationship,
                'contactNumber': contact,
                'homeAddress': address,
                'street': '',
                'barangay': '',
                'city': '',
                'province': '',
                'zipCode': ''
            }

            patients_to_import.append(patient)

        except Exception as e:
            print(f'Error processing row {idx+1}: {e}')
            continue

    print(f'Successfully prepared {len(patients_to_import)} patients for import')

    # Import patients
    imported_count = 0
    for patient in patients_to_import:
        try:
            result = addPatientToDB(patient)
            if result:
                imported_count += 1
                if imported_count % 50 == 0:
                    print(f'Imported {imported_count} patients...')
            else:
                print(f'Failed to import patient: {patient["firstName"]} {patient["lastName"]}')
        except Exception as e:
            print(f'Import error for {patient["firstName"]} {patient["lastName"]}: {e}')

    print(f'\n✅ Successfully imported {imported_count} patients!')

except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()