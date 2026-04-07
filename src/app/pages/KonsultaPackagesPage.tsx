import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Stethoscope } from 'lucide-react';
import { KonsultaPackage } from '../lib/types';
import { toast } from 'sonner';
import { konsultaPackages } from '../lib/konsultaPackages';

export default function KonsultaPackagesPage() {
  const [packages, setPackages] = useState<KonsultaPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<KonsultaPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    // Load from localStorage or use default data
    const stored = localStorage.getItem('hospitalKonsultaPackages');
    if (stored) {
      try {
        setPackages(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing Konsulta packages:', e);
        setPackages(konsultaPackages);
        localStorage.setItem('hospitalKonsultaPackages', JSON.stringify(konsultaPackages));
      }
    } else {
      // First load - use default packages
      setPackages(konsultaPackages);
      localStorage.setItem('hospitalKonsultaPackages', JSON.stringify(konsultaPackages));
      toast.success(`Successfully loaded ${konsultaPackages.length} Konsulta packages!`);
    }
    setLoading(false);
  };

  const handleAddPackage = () => {
    setSelectedPackage(null);
    setIsAddDialogOpen(true);
  };

  const handleEditPackage = (pkg: KonsultaPackage) => {
    setSelectedPackage(pkg);
    setIsEditDialogOpen(true);
  };

  const handleDeletePackage = async (pkg: KonsultaPackage) => {
    if (confirm(`Are you sure you want to delete Konsulta Package ${pkg.code}?`)) {
      const updatedPackages = packages.filter(p => p.code !== pkg.code);
      setPackages(updatedPackages);
      localStorage.setItem('hospitalKonsultaPackages', JSON.stringify(updatedPackages));
      toast.success(`Konsulta Package ${pkg.code} deleted successfully!`);
    }
  };

  const handleSavePackage = async (pkg: KonsultaPackage) => {
    let updatedPackages: KonsultaPackage[];
    
    if (selectedPackage) {
      // Update existing
      updatedPackages = packages.map(p => p.code === selectedPackage.code ? pkg : p);
      toast.success(`Konsulta Package ${pkg.code} updated successfully!`);
    } else {
      // Add new
      if (packages.some(p => p.code === pkg.code)) {
        toast.error(`Package code ${pkg.code} already exists!`);
        return;
      }
      updatedPackages = [...packages, pkg];
      toast.success(`Konsulta Package ${pkg.code} added successfully!`);
    }
    
    setPackages(updatedPackages);
    localStorage.setItem('hospitalKonsultaPackages', JSON.stringify(updatedPackages));
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#0D47A1] text-white p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">PhilHealth Konsulta Packages</h1>
              <p className="text-blue-100 mt-1">Primary Care Benefit (PCB) program packages for outpatient consultation</p>
            </div>
          </div>
        </div>

        {/* Search and Add Section */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by package code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddPackage}
              className="bg-[#2196F3] hover:bg-[#1976D2] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Package
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-b-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2196F3] mx-auto"></div>
              <p className="mt-4">Loading Konsulta packages...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No Konsulta packages found</p>
              <p className="text-sm mt-2">
                {searchQuery ? 'Try adjusting your search' : 'Click "Add Package" to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#E3F2FD] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#0D47A1]">Package Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#0D47A1]">Description</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-[#0D47A1]">Package Rate</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-[#0D47A1]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPackages.map((pkg) => (
                    <tr key={pkg.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{pkg.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{pkg.description}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-[#2196F3]">
                        ₱{pkg.packageRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditPackage(pkg)}
                            className="p-2 text-[#2196F3] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {filteredPackages.length} of {packages.length} Konsulta packages
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <PackageDialog
          pkg={null}
          onSave={handleSavePackage}
          onClose={() => setIsAddDialogOpen(false)}
        />
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && selectedPackage && (
        <PackageDialog
          pkg={selectedPackage}
          onSave={handleSavePackage}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </div>
  );
}

// Package Dialog Component
interface PackageDialogProps {
  pkg: KonsultaPackage | null;
  onSave: (pkg: KonsultaPackage) => void;
  onClose: () => void;
}

function PackageDialog({ pkg, onSave, onClose }: PackageDialogProps) {
  const [formData, setFormData] = useState<KonsultaPackage>({
    code: pkg?.code || '',
    description: pkg?.description || '',
    packageRate: pkg?.packageRate || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof KonsultaPackage, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Package code is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.packageRate <= 0) {
      newErrors.packageRate = 'Package rate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0D47A1] text-white p-6 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold">
            {pkg ? 'Edit Konsulta Package' : 'Add New Konsulta Package'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Package Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              disabled={!!pkg}
              placeholder="e.g., KONSULTA-01"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } ${pkg ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter detailed description of the Konsulta package"
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Package Rate */}
          <div className="bg-[#E3F2FD] border-2 border-[#2196F3] rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Rate <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.packageRate || ''}
                onChange={(e) => handleChange('packageRate', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                  errors.packageRate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.packageRate && <p className="text-red-500 text-sm mt-1">{errors.packageRate}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-lg transition-colors"
            >
              {pkg ? 'Update' : 'Add'} Package
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
