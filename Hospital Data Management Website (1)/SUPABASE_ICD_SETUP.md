# Supabase Database Setup - ICD Codes Table

## Table: `icd_codes`

To enable cloud storage for ICD codes, create the following table in your Supabase project:

### SQL Command:

```sql
-- Create ICD codes table
CREATE TABLE IF NOT EXISTS icd_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  "healthFacilityFee" NUMERIC(10, 2) NOT NULL,
  "professionalFee" NUMERIC(10, 2) NOT NULL,
  "totalCaseRate" NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_icd_codes_description ON icd_codes USING gin(to_tsvector('english', description));

-- Enable Row Level Security (RLS)
ALTER TABLE icd_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON icd_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Column Details:

| Column | Type | Description |
|--------|------|-------------|
| `code` | TEXT (PRIMARY KEY) | ICD-10 code (e.g., "A00.0", "J18.9") |
| `description` | TEXT | Full description of the medical condition |
| `healthFacilityFee` | NUMERIC(10, 2) | Health facility fee component |
| `professionalFee` | NUMERIC(10, 2) | Professional fee component |
| `totalCaseRate` | NUMERIC(10, 2) | Total case rate (sum of all fees) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Record last update timestamp |

### Setup Instructions:

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor" from the left sidebar

2. **Run the SQL Command:**
   - Copy the SQL command above
   - Paste it into the SQL editor
   - Click "Run" to create the table

3. **Verify Table Creation:**
   - Go to "Table Editor" in the left sidebar
   - You should see the `icd_codes` table listed
   - The system will automatically seed 200+ ICD codes on first visit to the ICD Codes page

### Features:

✅ **Automatic Seeding:** On first visit to the ICD Codes page, the system will automatically load 200+ pre-configured ICD codes  
✅ **Full CRUD Operations:** Add, Edit, Delete ICD codes through the web interface  
✅ **Fast Search:** Full-text search on code and description  
✅ **Cloud Sync:** All changes are stored in Supabase for multi-user access  
✅ **localStorage Fallback:** Works offline if Supabase is not configured  

### LocalStorage Alternative:

If you're not using Supabase, the ICD codes will be stored in localStorage under the key `hospitalICDCodes`.
