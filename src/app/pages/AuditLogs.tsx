import React, { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Shield, Search } from 'lucide-react';
import { useState } from 'react';

export default function AuditLogs() {
  const { auditLogs, logAction, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    logAction('VIEW', 'Audit Logs', 'Accessed audit trail page');
  }, []);

  // Only admins can view audit logs
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You do not have permission to view audit logs. This feature is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'VIEW':
        return 'bg-blue-100 text-blue-700';
      case 'CREATE':
      case 'EDIT':
        return 'bg-green-100 text-green-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'EXPORT':
      case 'PRINT':
        return 'bg-purple-100 text-purple-700';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Audit Trail
        </h1>
        <p className="text-gray-500 mt-1">Track all system activities and user actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>Complete history of all user actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.userName}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.resource}</TableCell>
                      <TableCell className="text-sm text-gray-600">{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredLogs.length} of {auditLogs.length} log entries
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {auditLogs.filter(l => l.action === 'VIEW').length}
            </div>
            <p className="text-sm text-gray-600">View Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {auditLogs.filter(l => l.action === 'CREATE' || l.action === 'EDIT').length}
            </div>
            <p className="text-sm text-gray-600">Modifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {auditLogs.filter(l => l.action === 'EXPORT' || l.action === 'PRINT').length}
            </div>
            <p className="text-sm text-gray-600">Exports/Prints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {auditLogs.filter(l => l.action === 'LOGIN').length}
            </div>
            <p className="text-sm text-gray-600">Login Events</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
