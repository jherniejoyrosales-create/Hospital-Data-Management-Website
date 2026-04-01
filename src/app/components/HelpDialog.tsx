import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { HelpCircle, Users, Search, BarChart3, Shield, Settings } from 'lucide-react';

export default function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hospital Data Management System - Quick Guide</DialogTitle>
          <DialogDescription>
            Learn how to use the system effectively
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Dashboard Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Dashboard</h3>
            </div>
            <p className="text-sm text-gray-600">
              View key statistics, charts, and recent activity. The dashboard provides an overview of:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>Total patients and currently admitted patients</li>
              <li>Revenue from paid invoices</li>
              <li>Pending payments breakdown</li>
              <li>Payment status distribution chart</li>
              <li>Revenue trends and admission patterns</li>
            </ul>
          </div>

          {/* Patient Records Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Patient Records</h3>
            </div>
            <p className="text-sm text-gray-600">
              Search, filter, and manage patient records with advanced filtering options:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li><strong>Name/ID Search:</strong> Find patients by name or patient ID</li>
              <li><strong>PIN:</strong> Search by patient identification number</li>
              <li><strong>ICD-10:</strong> Filter by diagnosis code or description</li>
              <li><strong>Billing Status:</strong> Filter by paid, unpaid, or partial payment status</li>
              <li><strong>Confinement Period:</strong> Filter by admission date range</li>
            </ul>
          </div>

          {/* Search Tips Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Search Tips</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Use multiple filters together for precise results</li>
              <li>Click "Clear Filters" to reset all search criteria</li>
              <li>Click "View" on any record to see complete details</li>
              <li>Use "Export CSV" to download filtered results</li>
              <li>Use "Print" to create a printable report</li>
            </ul>
          </div>

          {/* Patient Details Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Patient Details</h3>
            </div>
            <p className="text-sm text-gray-600">
              Each patient record includes comprehensive information:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>Personal information and PIN</li>
              <li>Medical diagnosis (ICD-10 code and description)</li>
              <li>Confinement period and duration</li>
              <li>Detailed billing breakdown</li>
              <li>Companion/emergency contact details</li>
              <li>Complete contact information and address</li>
            </ul>
          </div>

          {/* Audit Logs Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Audit Logs (Admin Only)</h3>
            </div>
            <p className="text-sm text-gray-600">
              Track all system activities for security and compliance:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>View who accessed what data and when</li>
              <li>Track logins, views, edits, exports, and prints</li>
              <li>Search through audit logs by user, action, or resource</li>
              <li>Monitor system security and user activity</li>
            </ul>
          </div>

          {/* Settings Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Settings</h3>
            </div>
            <p className="text-sm text-gray-600">
              Manage your profile, security, and notification preferences:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>Update your profile information</li>
              <li>Change password and security settings</li>
              <li>Configure notification preferences</li>
              <li>View system information (Admin only)</li>
            </ul>
          </div>

          {/* User Roles Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">User Roles & Permissions</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong className="text-blue-700">Admin:</strong> Full access to all features including audit logs and system settings</p>
              <p><strong className="text-blue-700">Doctor:</strong> Access to patient records, dashboard, and can edit records</p>
              <p><strong className="text-blue-700">Staff:</strong> View-only access to patient records and dashboard</p>
            </div>
          </div>

          {/* Demo Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Demo System Notice</h3>
            <p className="text-sm text-green-800">
              This is a demonstration system with simulated data. For production use with real patient data, 
              ensure proper HIPAA compliance, security certifications, and data protection measures are in place.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
