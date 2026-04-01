# Bulk Import Guide

## How to Use the Bulk Import Feature

Your Hospital Data Management Website now has a **Bulk Import** button on the Patients page that allows you to import multiple patients at once from a CSV or TSV file.

### Step 1: Prepare Your CSV/TSV File

Your file should have tab-separated or comma-separated values with a header row. The required columns are:

**Minimum Required Columns:**
- `Name` - Patient name (format: "Last, First" or "First Middle Last")
- `PIN` - 12-digit patient identification number
- `ICD-10 Code` - ICD-10 diagnosis code

**Optional but Recommended Columns:**
- `Confinement Period` - Date range (e.g., "01/15/2026 - 01/17/2026")
- `HF` or `Health Facility Fee` - Numeric value
- `PF` or `Professional Fee` - Numeric value  
- `TOTAL` or `Total Case Rate` - Numeric value
- `Date Filed` - Date when case was filed (MM/DD/YYYY or YYYY-MM-DD)
- `Date Refiled` - Resubmission date (optional)
- `Status` - Case status (paid, in process, return to hospital, denied, not yet filed)
- `Companion Name` - Emergency contact/companion name
- `Relationship` - Relationship to patient
- `Contact Number` - Phone number
- `Home Address` - Patient address

### Step 2: Convert Your Existing Data

Your current patient-data.csv can be used! Here's how to prepare it:

1. Open your CSV file in Excel or a text editor
2. Make sure columns are in this order (or use the column names exactly):
   - Name
   - Confinement Period
   - PIN
   - ICD-10 Code
   - HF
   - PF
   - TOTAL
   - Date Filed
   - Date Refiled (optional)
   - Status
   - Companion Name (can be split from existing data)
   - Relationship
   - Contact Number
   - Home Address

3. Save as CSV (with comma or tab separation)

### Step 3: Import in the Application

1. Go to the **Patients** page
2. Click the green **"Bulk Import"** button (next to "Add New Patient")
3. Click the upload area or drag & drop your CSV/TSV file
4. Review the preview showing:
   - Number of valid records found
   - Any skipped rows (with reasons)
   - List of patients to be imported
5. Click **"Import [X] Patients"** to confirm

### Important Notes

- **PIN Validation**: PIN must be exactly 12 digits
- **Name Parsing**: Names are automatically parsed from "Last, First" or "First Middle Last" formats
- **Dates**: Automatically converted from MM/DD/YYYY to the required format
- **Missing Data**: If required fields (Name, PIN, ICD-10) are missing, that row will be skipped
- **Fees**: Currency symbols and commas are automatically removed during import
- **Status**: Automatically mapped (case-insensitive):
  - "paid" → Paid
  - "in process" → In Process
  - "return" → Return to Hospital
  - "denied" → Denied
  - other → Not Yet Filed

### Example CSV Format

```
Name	Confinement Period	PIN	ICD-10 Code	HF	PF	TOTAL	Date Filed	Status	Companion Name	Relationship	Contact Number	Home Address
Dela Cruz, Juan	01/15/2026 - 01/17/2026	10270735881	M47.89	11329.50	4855.50	16185.00	02/20/2026	In-process	Dela Cruz, Maria	Daughter	0951 896 5101	2667 Matapang St.
Santos, Maria	01/07/2026 - 01/18/2026	11751335778	J18.92	20475.00	8775.00	29250.00	02/23/2026	In-process	Santos, Juan	Son	0927 382 3005	#19 Narra St.
```

### Troubleshooting

**Q: My file won't upload**
A: Make sure your file is CSV or TSV format (.csv, .tsv, or .txt extension)

**Q: Some rows are being skipped**
A: Check that Name, PIN (12 digits), and ICD-10 Code are present in each row

**Q: Dates are not being imported correctly**
A: Use MM/DD/YYYY or YYYY-MM-DD format, e.g., "01/15/2026" or "2026-01-15"

**Q: Name parsing seems wrong**
A: Use either "Last, First Middle" (with comma) or "First Middle Last" format

### After Importing

- All imported patients will appear at the top of the Patients list
- They are immediately available for case management
- All imports are logged in the audit trail for compliance
- You can edit any patient record individually after import if needed
