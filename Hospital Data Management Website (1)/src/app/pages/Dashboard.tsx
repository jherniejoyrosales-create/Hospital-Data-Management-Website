import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../lib/auth';
import { mockPatients } from '../lib/mockData';
import { initializeData } from '../lib/dataVersion';
import { PatientRecord } from '../lib/types';
import { fetchPatients, subscribeToPatients } from '../lib/database';
import { Users, Coins, Clock, CheckCircle, Activity, Calendar } from 'lucide-react';
import WelcomeBanner from '../components/WelcomeBanner';
import CloudStatusBanner from '../components/CloudStatusBanner';
import { RevenueChart } from '../components/charts/RevenueChart';
import { StatusPieChart } from '../components/charts/StatusPieChart';
import { AdmissionsBarChart } from '../components/charts/AdmissionsBarChart';
import { DiagnosisBarChart } from '../components/charts/DiagnosisBarChart';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const { logAction } = useAuth();
  const [timeInterval, setTimeInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  
  // Time selection states
  const now = new Date();
  const [selectedWeek, setSelectedWeek] = useState<number>(Math.ceil(now.getDate() / 7));
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Initialize data and load from Supabase
  useEffect(() => {
    const loadData = async () => {
      const patientsData = await fetchPatients();
      if (patientsData.length > 0) {
        setPatients(patientsData);
      }
    };

    loadData();
    initializeData();
  }, []);

  // Get patients from Supabase (initialize with empty array)
  const [patients, setPatients] = useState<PatientRecord[]>([]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToPatients((updatedPatients) => {
      setPatients(updatedPatients);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    logAction('VIEW', 'Dashboard', 'Accessed dashboard statistics');
  }, []);
  
  // Format currency as Philippine Peso
  const formatPeso = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₱0';
    }
    return `₱${amount.toLocaleString('en-PH')}`;
  };

  // Helper function to get week of month
  const getWeekOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay();
    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
  };

  // Filter patients based on time interval
  const filteredPatients = useMemo(() => {
    const currentYear = selectedYear;
    const currentMonth = selectedMonth;
    const currentWeek = selectedWeek;

    return patients.filter(patient => {
      const confinementDate = new Date(patient.confinementStart);
      const patientYear = confinementDate.getFullYear();
      const patientMonth = confinementDate.getMonth();
      const patientWeek = getWeekOfMonth(confinementDate);

      if (timeInterval === 'weekly') {
        return patientYear === currentYear && patientMonth === currentMonth && patientWeek === currentWeek;
      } else if (timeInterval === 'monthly') {
        return patientYear === currentYear && patientMonth === currentMonth;
      } else if (timeInterval === 'yearly') {
        return patientYear === currentYear;
      }
      return true;
    });
  }, [patients, timeInterval, selectedWeek, selectedMonth, selectedYear]);

  // Get time period label
  const getTimePeriodLabel = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (timeInterval === 'weekly') {
      const monthName = monthNames[selectedMonth];
      return `Week ${selectedWeek} of ${monthName} ${selectedYear}`;
    } else if (timeInterval === 'monthly') {
      return `${monthNames[selectedMonth]} ${selectedYear}`;
    } else {
      return selectedYear.toString();
    }
  };

  // Get number of weeks in current selected month
  const getWeeksInMonth = () => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Math.ceil(lastDay / 7);
  };

  // Generate available years (last 5 years and current year)
  const availableYears = useMemo(() => {
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push(now.getFullYear() - i);
    }
    return years;
  }, []);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Calculate statistics based on filtered patients
  const totalPatients = filteredPatients.length;
  const activePatients = filteredPatients.filter(p => {
    const endDate = new Date(p.confinementEnd);
    const today = new Date();
    return endDate >= today;
  }).length;

  const totalRevenue = filteredPatients
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.totalBilling || 0), 0);

  const pendingPayments = filteredPatients
    .filter(p => p.status === 'in process' || p.status === 'return to hospital')
    .reduce((sum, p) => sum + (p.totalBilling || 0), 0);

  const paidCount = filteredPatients.filter(p => p.status === 'paid').length;
  const inProcessCount = filteredPatients.filter(p => p.status === 'in process').length;
  const returnToHospitalCount = filteredPatients.filter(p => p.status === 'return to hospital').length;
  const deniedCount = filteredPatients.filter(p => p.status === 'denied').length;
  const notYetFiledCount = filteredPatients.filter(p => p.status === 'not yet filed').length;
  
  const memberCount = filteredPatients.filter(p => p.category === 'MM').length;
  const dependentCount = filteredPatients.filter(p => p.category === 'DD').length;

  // Data for charts - memoized for stability
  const statusData = useMemo(() => {
    return [
      { name: 'Paid', value: paidCount, color: '#4CAF50' },
      { name: 'In Process', value: inProcessCount, color: '#FF9800' },
      { name: 'Return to Hospital', value: returnToHospitalCount, color: '#9C27B0' },
      { name: 'Denied', value: deniedCount, color: '#F44336' },
      { name: 'Not Yet Filed', value: notYetFiledCount, color: '#9E9E9E' },
    ];
  }, [paidCount, inProcessCount, returnToHospitalCount, deniedCount, notYetFiledCount]);
  
  const categoryData = useMemo(() => {
    return [
      { name: 'Members (MM)', value: memberCount, color: '#2196F3' },
      { name: 'Dependents (DD)', value: dependentCount, color: '#0D47A1' },
    ];
  }, [memberCount, dependentCount]);

  const patientsByDiagnosis = useMemo(() => {
    return patients.reduce((acc, patient) => {
      const code = patient.icd10Code.substring(0, 3);
      const existing = acc.find(item => item.code === code);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ code, count: 1 });
      }
      return acc;
    }, [] as { code: string; count: number }[])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 diagnoses only
      .map((item, index) => ({ ...item, id: `diagnosis-${item.code}-${index}` })); // Add unique ID
  }, [patients]);

  const dailyAdmissions = useMemo(() => [
    { day: 'Mon', admissions: 3, id: 'day-1' },
    { day: 'Tue', admissions: 2, id: 'day-2' },
    { day: 'Wed', admissions: 4, id: 'day-3' },
    { day: 'Thu', admissions: 1, id: 'day-4' },
    { day: 'Fri', admissions: 5, id: 'day-5' },
    { day: 'Sat', admissions: 2, id: 'day-6' },
    { day: 'Sun', admissions: 3, id: 'day-7' },
  ], []);

  const revenueByMonthData = useMemo(() => [
    { month: 'Jan', revenue: 125000, id: 'month-1' },
    { month: 'Feb', revenue: totalRevenue, id: 'month-2' },
    { month: 'Mar', revenue: 135000, id: 'month-3' },
    { month: 'Apr', revenue: 145000, id: 'month-4' },
  ], [totalRevenue]);

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <CloudStatusBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of hospital operations and patient statistics
            <span className="ml-2 px-3 py-1 bg-[#E3F2FD] text-[#0D47A1] rounded-full text-sm font-medium">
              {getTimePeriodLabel()}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <Button
            size="sm"
            variant={timeInterval === 'weekly' ? 'default' : 'ghost'}
            onClick={() => setTimeInterval('weekly')}
            className={timeInterval === 'weekly' ? 'bg-[#2196F3] hover:bg-[#1976D2]' : 'hover:bg-gray-100'}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Weekly
          </Button>
          <Button
            size="sm"
            variant={timeInterval === 'monthly' ? 'default' : 'ghost'}
            onClick={() => setTimeInterval('monthly')}
            className={timeInterval === 'monthly' ? 'bg-[#2196F3] hover:bg-[#1976D2]' : 'hover:bg-gray-100'}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Monthly
          </Button>
          <Button
            size="sm"
            variant={timeInterval === 'yearly' ? 'default' : 'ghost'}
            onClick={() => setTimeInterval('yearly')}
            className={timeInterval === 'yearly' ? 'bg-[#2196F3] hover:bg-[#1976D2]' : 'hover:bg-gray-100'}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Yearly
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/icd-codes" className="block rounded-2xl border border-[#E3F2FD] bg-white p-5 shadow-sm hover:border-[#0D47A1] hover:shadow-md transition">
          <p className="text-sm font-semibold text-[#0D47A1]">ICD Codes</p>
          <p className="mt-2 text-sm text-gray-600">View and manage ICD-10 code rates, descriptions, and case mappings.</p>
        </Link>
        <Link to="/rvs-codes" className="block rounded-2xl border border-[#E3F2FD] bg-white p-5 shadow-sm hover:border-[#0D47A1] hover:shadow-md transition">
          <p className="text-sm font-semibold text-[#0D47A1]">RVS Codes</p>
          <p className="mt-2 text-sm text-gray-600">Browse official PhilHealth RVS procedure codes and manage procedure rates.</p>
        </Link>
        <Link to="/z-benefits" className="block rounded-2xl border border-[#E3F2FD] bg-white p-5 shadow-sm hover:border-[#0D47A1] hover:shadow-md transition">
          <p className="text-sm font-semibold text-[#0D47A1]">Z Benefits</p>
          <p className="mt-2 text-sm text-gray-600">Open the Z Benefits library and see the benefit packages available in the system.</p>
        </Link>
        <Link to="/konsulta-packages" className="block rounded-2xl border border-[#E3F2FD] bg-white p-5 shadow-sm hover:border-[#0D47A1] hover:shadow-md transition">
          <p className="text-sm font-semibold text-[#0D47A1]">Konsulta Packages</p>
          <p className="mt-2 text-sm text-gray-600">Access Konsulta package details and pricing right from the dashboard.</p>
        </Link>
      </div>

      {/* Drill-Down Selectors */}
      <Card className="border-[#2196F3] bg-gradient-to-br from-[#E3F2FD] to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#0D47A1]">
            {timeInterval === 'weekly' && 'Select Week to View'}
            {timeInterval === 'monthly' && 'Select Month to View'}
            {timeInterval === 'yearly' && 'Select Year to View'}
          </CardTitle>
          <CardDescription className="text-xs">
            Click on any {timeInterval === 'weekly' ? 'week' : timeInterval === 'monthly' ? 'month' : 'year'} to filter patient activity, billing, and case records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Weekly Selector */}
          {timeInterval === 'weekly' && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: getWeeksInMonth() }, (_, i) => i + 1).map((week) => (
                <Button
                  key={week}
                  size="sm"
                  variant={selectedWeek === week ? 'default' : 'outline'}
                  onClick={() => setSelectedWeek(week)}
                  className={selectedWeek === week 
                    ? 'bg-[#2196F3] hover:bg-[#1976D2] text-white' 
                    : 'border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD]'
                  }
                >
                  Week {week}
                </Button>
              ))}
            </div>
          )}

          {/* Monthly Selector */}
          {timeInterval === 'monthly' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {monthNames.map((month, index) => (
                <Button
                  key={month}
                  size="sm"
                  variant={selectedMonth === index ? 'default' : 'outline'}
                  onClick={() => setSelectedMonth(index)}
                  className={selectedMonth === index 
                    ? 'bg-[#2196F3] hover:bg-[#1976D2] text-white' 
                    : 'border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD]'
                  }
                >
                  {month.substring(0, 3)}
                </Button>
              ))}
            </div>
          )}

          {/* Yearly Selector */}
          {timeInterval === 'yearly' && (
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => (
                <Button
                  key={year}
                  size="sm"
                  variant={selectedYear === year ? 'default' : 'outline'}
                  onClick={() => setSelectedYear(year)}
                  className={selectedYear === year 
                    ? 'bg-[#2196F3] hover:bg-[#1976D2] text-white' 
                    : 'border-[#2196F3] text-[#2196F3] hover:bg-[#E3F2FD]'
                  }
                >
                  {year}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activePatients} currently admitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPeso(totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              From {paidCount} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPeso(pendingPayments)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {inProcessCount + returnToHospitalCount} invoices pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPatients > 0 ? Math.round((paidCount / totalPatients) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Invoices fully paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue comparison (PHP)</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByMonthData} formatPeso={formatPeso} />
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Billing Status Distribution</CardTitle>
            <CardDescription>Patient payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Admissions</CardTitle>
            <CardDescription>Patient admissions by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <AdmissionsBarChart data={dailyAdmissions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top ICD-10 Categories</CardTitle>
            <CardDescription>Most common diagnosis categories</CardDescription>
          </CardHeader>
          <CardContent>
            <DiagnosisBarChart data={patientsByDiagnosis} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest patient records and updates for {getTimePeriodLabel()}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPatients.length > 0 ? (
            <div className="space-y-4">
              {filteredPatients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-gray-500">
                      {patient.icd10Code} - {patient.icd10Description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPeso(patient.totalBilling)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      patient.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : patient.status === 'in process'
                        ? 'bg-orange-100 text-orange-700'
                        : patient.status === 'return to hospital'
                        ? 'bg-purple-100 text-purple-700'
                        : patient.status === 'denied'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {patient.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No patient records found for {getTimePeriodLabel()}</p>
              <p className="text-sm mt-2">Try selecting a different time period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}