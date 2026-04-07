# Supabase Database Setup - RVS Codes Table

## Table: `rvs_codes`

To enable cloud storage for RVS (Relative Value Scale) codes, create the following table in your Supabase project:

### SQL Command:

```sql
-- Create RVS codes table
CREATE TABLE IF NOT EXISTS rvs_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  "healthFacilityFee" NUMERIC(10, 2) NOT NULL,
  "professionalFee" NUMERIC(10, 2) NOT NULL,
  "totalCaseRate" NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_rvs_codes_description ON rvs_codes USING gin(to_tsvector('english', description));

-- Enable Row Level Security (RLS)
ALTER TABLE rvs_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON rvs_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Column Details:

| Column | Type | Description |
|--------|------|-------------|
| `code` | TEXT (PRIMARY KEY) | RVS code (e.g., "99213", "47562") |
| `description` | TEXT | Full description of the procedure |
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
   - You should see the `rvs_codes` table listed

### Features:

✅ **Full CRUD Operations:** Add, Edit, Delete RVS codes through the web interface  
✅ **Fast Search:** Full-text search on code and description  
✅ **Cloud Sync:** All changes are stored in Supabase for multi-user access  
✅ **localStorage Fallback:** Works offline if Supabase is not configured  

### LocalStorage Alternative:

If you're not using Supabase, the RVS codes will be stored in localStorage under the key `hospitalRVSCodes`.

---

## Complete Database Setup

To set up both ICD and RVS codes tables, run this combined script:

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

-- Create RVS codes table
CREATE TABLE IF NOT EXISTS rvs_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  "healthFacilityFee" NUMERIC(10, 2) NOT NULL,
  "professionalFee" NUMERIC(10, 2) NOT NULL,
  "totalCaseRate" NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_icd_codes_description ON icd_codes USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_rvs_codes_description ON rvs_codes USING gin(to_tsvector('english', description));

-- Enable Row Level Security
ALTER TABLE icd_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvs_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users on icd_codes"
  ON icd_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on rvs_codes"
  ON rvs_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
