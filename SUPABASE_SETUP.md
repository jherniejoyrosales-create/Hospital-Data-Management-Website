# Hospital Data Management System - Supabase Setup Guide

## Overview
Your hospital management system now uses Supabase as a cloud database, allowing patient data to be synchronized across all devices in real-time.

## Setting Up Supabase

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: "A. Zarate General Hospital"
   - Database Password: (create a strong password)
   - Region: Choose closest to your location

### 2. Get Your API Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public** API key (under "Project API keys")

### 3. Configure Environment Variables
Add these to your `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Create Database Table
Run this SQL command in Supabase SQL Editor (found in the left sidebar):

```sql
-- Create patients table
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MM', 'DD')),
  "confinementStart" TEXT NOT NULL,
  "confinementEnd" TEXT NOT NULL,
  pin TEXT NOT NULL,
  "icd10Code" TEXT NOT NULL,
  "icd10Description" TEXT NOT NULL,
  "healthFacilityFee" NUMERIC DEFAULT 0,
  "professionalFee" NUMERIC DEFAULT 0,
  "totalCaseRate" NUMERIC DEFAULT 0,
  "dateFiled" TEXT NOT NULL,
  "dateRefiled" TEXT,
  "daysSinceFiled" INTEGER DEFAULT 0,
  "daysSinceRefiled" INTEGER,
  status TEXT NOT NULL CHECK (status IN ('paid', 'in process', 'return to hospital', 'denied', 'not yet filed')),
  "companionName" TEXT NOT NULL,
  relationship TEXT NOT NULL,
  "contactNumber" TEXT NOT NULL,
  "homeAddress" TEXT,
  street TEXT,
  barangay TEXT,
  city TEXT,
  province TEXT,
  "zipCode" TEXT,
  "totalBilling" NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_patients_patientId ON patients("patientId");
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_category ON patients(category);
CREATE INDEX idx_patients_confinementStart ON patients("confinementStart");

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now - adjust based on your security needs)
CREATE POLICY "Allow all operations" ON patients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for patients table
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
```

## Features Enabled

### ✅ Cross-Device Synchronization
- Add a patient on one device → Instantly appears on all other devices
- Edit or delete records → Changes sync immediately

### ✅ Automatic Data Migration
- On first load, your existing localStorage data will automatically migrate to Supabase
- You'll see a success message when migration completes

### ✅ Real-Time Updates
- Multiple users can access the system simultaneously
- Changes are reflected instantly across all devices

### ✅ Data Persistence
- Patient records are stored securely in the cloud
- No data loss even if browser cache is cleared
- Automatic backups by Supabase

## How It Works

1. **First Visit**: System automatically migrates localStorage data to Supabase
2. **Subsequent Visits**: Data loads from Supabase cloud database
3. **Real-Time Sync**: Any changes sync instantly to all connected devices
4. **Offline Fallback**: If connection is lost, system gracefully handles errors

## Testing the Setup

1. Add a test patient on one device
2. Open the system on another device (different browser/computer)
3. The new patient should appear automatically
4. Try editing the patient on one device
5. Watch it update in real-time on the other device

## Security Considerations

⚠️ **Important**: The current setup uses permissive Row Level Security policies for ease of setup. For production use with real patient data:

1. Implement proper authentication
2. Add user-based access controls
3. Enable audit logging
4. Consider HIPAA compliance requirements
5. Review Supabase security best practices

## Troubleshooting

### Data not syncing?
- Check that environment variables are set correctly
- Verify the Supabase table was created
- Check browser console for error messages
- Ensure RLS policies are properly configured

### Migration not working?
- Clear localStorage: `localStorage.clear()`
- Refresh the page
- Check Supabase table for existing data

## Support

For issues with:
- **Supabase**: Visit [Supabase Documentation](https://supabase.com/docs)
- **Application**: Check browser console for error messages

---

**Status**: ✅ Supabase integration is ready to use once environment variables are configured!
