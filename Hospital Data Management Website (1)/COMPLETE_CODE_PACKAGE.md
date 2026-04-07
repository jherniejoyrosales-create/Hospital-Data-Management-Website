# A. Zarate General Hospital - Patient Data Management System
## Complete Code Package

This is the **complete source code** for a hospital data management website built with:
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** v4 for styling
- **Supabase** for cloud database (optional - works with localStorage fallback)
- **React Router** for navigation
- **Recharts** for data visualization
- **Shadcn UI** components

---

## 📁 Project Structure

```
hospital-management/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn UI components
│   │   │   ├── charts/       # Chart components
│   │   │   ├── AddPatientDialog.tsx
│   │   │   ├── EditPatientDialog.tsx
│   │   │   ├── CloudStatusBanner.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── auth.tsx      # Authentication context
│   │   │   ├── database.ts   # Database service layer
│   │   │   ├── supabase.ts   # Supabase client
│   │   │   ├── types.ts      # TypeScript types
│   │   │   ├── icdRates.ts   # ICD-10 billing rates
│   │   │   └── mockData.ts   # Sample data
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── PatientDetail.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── AuditLogs.tsx
│   │   └── App.tsx           # Main app component
│   ├── styles/
│   │   ├── index.css
│   │   ├── theme.css
│   │   └── tailwind.css
│   └── index.html
├── package.json
├── vite.config.ts
├── postcss.config.mjs
└── README.md
```

---

## 🎨 Color Palette

The system uses a professional hospital-appropriate blue and white color scheme:

| Color Purpose | Hex Code | Usage |
|--------------|----------|-------|
| Light Blue Background | `#E3F2FD` | Card headers, backgrounds |
| Medium Blue Buttons | `#2196F3` | Primary buttons, links |
| Dark Blue Headers | `#0D47A1` | Headers, titles |
| White Contrast | `#FFFFFF` | Main backgrounds |
| Soft Gray Tables | `#F5F5F5` | Table rows, input backgrounds |
| Green (Paid) | `#4CAF50` | Status badge |
| Orange (In Process) | `#FF9800` | Status badge |
| Purple (Return) | `#9C27B0` | Status badge |
| Red (Denied) | `#F44336` | Status badge, alerts |
| Gray (Not Filed) | `#9E9E9E` | Status badge |

---

## ✨ Key Features

### 1. **Dashboard Analytics**
- Real-time patient statistics
- Revenue tracking
- Status distribution charts (Recharts)
- Time interval filtering (Weekly, Monthly, Yearly)
- Drill-down by week/month/year
- Top ICD-10 diagnosis categories
- Recent activity feed

### 2. **Patient Case Management**
- Comprehensive patient records table
- Add/Edit/Delete operations
- Advanced search and filtering:
  - By name, patient ID, PIN
  - By status, category (MM/DD)
  - By ICD-10 code
  - By confinement date range
- Export to CSV
- Print functionality
- Real-time validation

### 3. **Patient Details**
- Complete patient information view
- Billing breakdown:
  - Health Facility Fee
  - Professional Fee
  - Case Rate (automatic calculation from ICD-10)
- Status tracking (5 states)
- Days since filed/refiled tracking
- Overdue case alerts (>30 days)
- Print-optimized layout
- Address with structured fields:
  - Street, Barangay, City/Municipality, Province, ZIP Code

### 4. **Billing System**
- Automatic fee calculation based on ICD-10 codes
- Three separate fee components:
  - Health Facility Fee
  - Professional Fee
  - Total Case Rate
- Philippine Peso (₱) formatting
- Revenue aggregation

### 5. **Security & Access Control**
- Role-based access (Admin, Doctor, Staff)
- Login/logout system
- Audit logging for all actions
- Protected routes

### 6. **Cloud Database (Optional)**
- Supabase integration ready
- Real-time sync across devices
- localStorage fallback when offline
- One-click migration tool
- Connection status indicator

---

## 🚀 Installation & Setup

### Prerequisites
```bash
- Node.js 18+ and npm/pnpm
- Modern web browser
```

### Step 1: Install Dependencies
```bash
npm install
# or
pnpm install
```

### Step 2: Run Development Server
```bash
npm run build
# Then serve the dist folder
```

### Step 3 (Optional): Configure Supabase
1. Create a Supabase project at https://supabase.com
2. Create a `.env` file:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
3. Run SQL migration (see SUPABASE_SETUP.md)

Without Supabase, the system automatically uses localStorage.

---

## 🔐 Default Login Credentials

```
Admin Account:
Username: admin
Password: admin123

Doctor Account:
Username: dr.smith
Password: doctor123

Staff Account:
Username: nurse.jane
Password: staff123
```

---

## 📊 Patient Status Types

1. **Paid** (Green) - Invoice fully paid
2. **In Process** (Orange) - Claim being processed
3. **Return to Hospital** (Purple) - Additional documentation needed
4. **Denied** (Red) - Claim rejected
5. **Not Yet Filed** (Gray) - Claim not submitted

---

## 🏥 Patient Categories

- **MM (Member)** - Primary insurance holder
- **DD (Dependent)** - Family member/dependent

---

## 📝 ICD-10 Billing Rates

The system includes pre-configured rates for common ICD-10 codes:

| ICD-10 Code | Description | Health Facility Fee | Professional Fee | Case Rate |
|-------------|-------------|---------------------|------------------|-----------|
| J18.9 | Pneumonia | ₱16,000 | ₱4,000 | ₱20,000 |
| A09 | Gastroenteritis | ₱12,000 | ₱3,000 | ₱15,000 |
| I10 | Essential Hypertension | ₱10,000 | ₱2,500 | ₱12,500 |
| E11.9 | Type 2 Diabetes | ₱14,000 | ₱3,500 | ₱17,500 |
| O80 | Normal Delivery | ₱18,000 | ₱4,500 | ₱22,500 |

*See `/src/app/lib/icdRates.ts` for complete list*

---

## 🖨️ Print Features

### Dashboard
- Clean print layout
- Hospital header
- Statistics summary
- Chart visualizations

### Patient List
- Table format
- Filtered results
- Generation date
- Hospital branding

### Patient Detail
- Full patient information
- Billing breakdown
- Professional letterhead format
- Optimized for A4 paper

---

## 📦 Core Dependencies

```json
{
  "react": "18.3.1",
  "react-router": "7.13.0",
  "recharts": "2.15.2",
  "@supabase/supabase-js": "^2.100.0",
  "tailwindcss": "4.1.12",
  "lucide-react": "0.487.0",
  "sonner": "2.0.3",
  "date-fns": "3.6.0"
}
```

---

## 🗄️ Data Models

### PatientRecord Interface
```typescript
interface PatientRecord {
  id: string;
  patientId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  category: 'MM' | 'DD';
  confinementStart: string;
  confinementEnd: string;
  pin: string; // 12-digit PIN
  icd10Code: string;
  icd10Description: string;
  healthFacilityFee: number;
  professionalFee: number;
  totalCaseRate: number;
  dateFiled: string;
  dateRefiled?: string;
  daysSinceFiled: number;
  daysSinceRefiled?: number;
  status: 'paid' | 'in process' | 'return to hospital' | 'denied' | 'not yet filed';
  companionName: string;
  relationship: string;
  contactNumber: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
}
```

---

## 🌐 API Integration

### Database Service (`/src/app/lib/database.ts`)

#### Key Functions:
```typescript
// Fetch all patients
fetchPatients(): Promise<PatientRecord[]>

// Add new patient
addPatient(patient: Omit<PatientRecord, 'id'>): Promise<PatientRecord | null>

// Update patient
updatePatient(patient: PatientRecord): Promise<PatientRecord | null>

// Delete patient
deletePatient(id: string): Promise<boolean>

// Get by ID
getPatientById(id: string): Promise<PatientRecord | null>

// Subscribe to real-time changes
subscribeToPatients(callback: (patients: PatientRecord[]) => void)
```

---

## 🎯 Form Validation Rules

### Add/Edit Patient Dialog:
- **Patient ID**: Required, alphanumeric
- **Names**: Required, alphabetic characters
- **PIN**: Required, exactly 12 digits
- **ICD-10 Code**: Required, auto-fills fees
- **Confinement Dates**: Required, end ≥ start
- **Contact Number**: Required, Philippine format
- **Address**: All fields required (Street, Barangay, City, Province, ZIP)
- **Date Filed**: Conditional - only visible when status ≠ "Not Yet Filed"

---

## 📱 Responsive Design

The system is fully responsive across:
- **Desktop**: Full feature set with multi-column layouts
- **Tablet**: Adaptive grids, collapsible filters
- **Mobile**: Stacked cards, touch-optimized buttons

### Breakpoints (Tailwind CSS):
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

---

## 🔧 Customization Guide

### Change Colors:
Edit `/src/styles/theme.css` or update Tailwind classes:
```css
/* Example: Change primary blue */
.bg-[#2196F3] → .bg-[#YOUR_COLOR]
.text-[#2196F3] → .text-[#YOUR_COLOR]
```

### Add New ICD-10 Codes:
Edit `/src/app/lib/icdRates.ts`:
```typescript
export const icdRates: ICDCodeRate[] = [
  {
    code: 'YOUR_CODE',
    description: 'Your Description',
    healthFacilityFee: 10000,
    professionalFee: 2500,
    totalCaseRate: 12500,
  },
  // ...
];
```

### Modify Dashboard Charts:
Edit chart components in `/src/app/components/charts/`:
- `RevenueChart.tsx`
- `StatusPieChart.tsx`
- `AdmissionsBarChart.tsx`
- `DiagnosisBarChart.tsx`

---

## 🐛 Troubleshooting

### Issue: Charts not rendering
**Solution**: Recharts warnings are suppressed. Check browser console for errors.

### Issue: Supabase not connecting
**Solution**: Verify `.env` variables and run SQL migration. System will fallback to localStorage.

### Issue: Print layout broken
**Solution**: Check `@media print` CSS rules in components. Use "Print Preview" to test.

### Issue: Data not persisting
**Solution**: Check browser localStorage or Supabase connection. Enable CloudStatusBanner to see status.

---

## 📄 File Export Format

### CSV Export Columns:
1. Patient ID
2. Last Name
3. First Name
4. Middle Name
5. Category (MM/DD)
6. Confinement Period
7. PIN
8. ICD-10 Code & Description
9. Health Facility Fee
10. Professional Fee
11. Case Rate
12. Status
13. Days Since Filed

---

## 🚦 Next Steps After Installation

1. ✅ **Login** with default credentials
2. ✅ **Add sample patients** via "Add Patient" button
3. ✅ **Explore dashboard** analytics and filters
4. ✅ **Test search/filter** on Patients page
5. ✅ **View patient details** and print functionality
6. ✅ **Export data** to CSV
7. ✅ **(Optional) Connect Supabase** for cloud sync

---

## 📚 Additional Documentation

- `/SUPABASE_SETUP.md` - Detailed Supabase configuration
- `/ATTRIBUTIONS.md` - Open source licenses
- `/guidelines/Guidelines.md` - Development guidelines

---

## 🙏 Credits

Built with:
- React + TypeScript
- Tailwind CSS v4
- Shadcn UI
- Recharts
- Supabase
- Lucide Icons

---

## 📞 Support

For questions or issues:
1. Check console logs in browser DevTools
2. Review CloudStatusBanner for connection status
3. Verify all dependencies are installed
4. Test with default credentials first

---

## ⚠️ Important Notes

1. **Security**: This is a demo system. Do not use for real patient data without proper security hardening.
2. **HIPAA Compliance**: Not HIPAA-compliant out of the box. Requires additional security measures.
3. **Data Privacy**: LocalStorage is NOT encrypted. Use Supabase with Row Level Security for production.
4. **PII Warning**: Figma Make is not meant for collecting PII or securing sensitive data.

---

## 🎉 You're Ready!

Your complete hospital management system includes:
- ✅ Full source code
- ✅ All components and pages
- ✅ Styling and themes
- ✅ Database integration
- ✅ Charts and visualizations
- ✅ Print functionality
- ✅ Export capabilities
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Role-based access

**Enjoy your hospital data management system!** 🏥
