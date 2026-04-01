import React from 'react';
import { Shield, Lock, Eye } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export default function SecurityBanner() {
  return (
    <Card className="bg-blue-50 border-blue-200 mt-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Security & Compliance</h3>
            <p className="text-sm text-blue-800">
              This is a demonstration system with simulated authentication. For production use with real patient data:
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-blue-700 ml-8">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Implement HIPAA-compliant infrastructure and security protocols</p>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Use proper encryption for data at rest and in transit</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Obtain necessary security certifications and conduct regular audits</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
