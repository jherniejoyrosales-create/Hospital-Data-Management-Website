import csv
import json
from datetime import datetime
import uuid

# Read the CSV file
patients_list = []
with open('phic-patients-clean.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for idx, row in enumerate(reader):
        try:
            # Parse name
            full_name = row.get('Name', '').strip()
            if ',' in full_name:
                parts = full_name.split(',', 1)
                last_name = parts[0].strip()
                first_name = parts[1].strip()
            else:
                name_parts = full_name.split()
                first_name = name_parts[0] if name_parts else ''
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            # Parse confinement period
            confinement = row.get('Confinement Period', '').strip()
            start_date = ''
            end_date = ''
            if ' - ' in confinement:
                dates = confinement.split(' - ')
                start_date = dates[0].strip()
                end_date = dates[1].strip() if len(dates) > 1 else start_date
            
            # Clean PIN
            pin = row.get('PIN', '').strip().replace(' ', '')
            
            # Pad PIN to 12 digits if it's shorter (add leading zeros)
            if pin and pin.isdigit():
                if len(pin) < 12:
                    pin = pin.zfill(12)  # Pad with leading zeros
                elif len(pin) > 12:
                    # If longer, take only first 12 digits
                    pin = pin[:12]
            
            # Validate PIN
            if len(pin) != 12 or not pin.isdigit():
                continue
            
            # Parse fees
            try:
                hf = float(row.get('HF', '0').replace(',', '')) if row.get('HF') else 0
            except:
                hf = 0
            
            try:
                pf = float(row.get('PF', '0').replace(',', '')) if row.get('PF') else 0
            except:
                pf = 0
            
            try:
                total = float(row.get('TOTAL', '0').replace(',', '')) if row.get('TOTAL') else 0
            except:
                total = 0
            
            # Parse dates
            date_filed = row.get('Date Filed', '').strip()
            date_refiled = row.get('Date Refiled', '').strip()
            
            # Parse status
            status_str = row.get('Status', '').strip().lower()
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
            companion_name = row.get('Companion Name', '').strip()
            relationship = row.get('Relationship', '').strip()
            contact = row.get('Contact Number', '').strip()
            address = row.get('Home Address', '').strip()
            
            # Calculate days since filed
            def calculate_days_since(date_str):
                if not date_str:
                    return 0
                try:
                    # Parse MM/DD/YYYY format
                    parts = date_str.split('/')
                    if len(parts) == 3:
                        date_obj = datetime(int(parts[2]), int(parts[0]), int(parts[1]))
                        today = datetime(2026, 3, 26)  # Current date in context
                        delta = today - date_obj
                        return max(0, delta.days)
                except:
                    return 0
                return 0
            
            days_since_filed = calculate_days_since(date_filed)
            days_since_refiled = calculate_days_since(date_refiled) if date_refiled else None
            
            # Create patient record
            patient = {
                'id': str(uuid.uuid4()),
                'patientId': f'PT-{2026}-{str(idx + 1).zfill(3)}',
                'lastName': last_name,
                'firstName': first_name,
                'middleName': '',
                'category': 'MM',
                'confinementStart': start_date,
                'confinementEnd': end_date,
                'pin': pin,
                'icd10Code': row.get('ICD-10 Code', '').strip(),
                'icd10Description': '',
                'healthFacilityFee': hf,
                'professionalFee': pf,
                'totalCaseRate': total,
                'dateFiled': date_filed,
                'dateRefiled': date_refiled if date_refiled else None,
                'daysSinceFiled': days_since_filed,
                'daysSinceRefiled': days_since_refiled,
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
            
            patients_list.append(patient)
            
        except Exception as e:
            print(f'Error processing row {idx + 1}: {e}')
            continue

print(f'Processed {len(patients_list)} valid patients')

# Save to JSON file
with open('patients-import.json', 'w', encoding='utf-8') as f:
    json.dump(patients_list, f, indent=2)

print('✅ Created patients-import.json with all patient data')
print(f'Ready to import {len(patients_list)} patients')