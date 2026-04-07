import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { fetchICDCodes, addICDCode, updateICDCode, deleteICDCode, deleteAllICDCodes } from '../lib/database';
import { ICDCodeRate } from '../lib/types';
import { seedICDCodes, areICDCodesSeeded, markICDCodesAsSeeded, clearICDCodesSeeded } from '../lib/seedICDCodes';
import { toast } from 'sonner';

export default function ICDCodesPage() {
  const [icdCodes, setICDCodes] = useState<ICDCodeRate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ICDCodeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    initializeICDCodes();
  }, []);

  const initializeICDCodes = async () => {
    setLoading(true);

    let codes = await fetchICDCodes();

    if (codes.length === 0) {
      setIsSeeding(true);
      toast.info('Restoring default ICD codes...');
      const result = await seedICDCodes();
      if (result.successCount > 0) {
        toast.success(`Successfully restored ${result.successCount} ICD codes!`);
        markICDCodesAsSeeded();
      }
      setIsSeeding(false);
      codes = await fetchICDCodes();
    }

    setICDCodes(codes);
    setLoading(false);
  };

  const loadICDCodes = async () => {
    setLoading(true);
    const codes = await fetchICDCodes();
    setICDCodes(codes);
    setLoading(false);
  };

  const handleAddCode = () => {
    setSelectedCode(null);
    setIsAddDialogOpen(true);
  };

  const handleRestoreICDCodes = async () => {
    if (!confirm('Restore the full default ICD-10 code catalog? This will replace any existing ICD codes.')) {
      return;
    }

    setLoading(true);
    setIsSeeding(true);

    const cleared = await deleteAllICDCodes();
    if (!cleared) {
      toast.error('Failed to clear existing ICD codes.');
      setIsSeeding(false);
      setLoading(false);
      return;
    }

    toast.info('Restoring full ICD-10 code catalog...');
    clearICDCodesSeeded();
    const result = await seedICDCodes();

    if (result.successCount > 0) {
      toast.success(`Restored ${result.successCount} ICD codes.`);
      markICDCodesAsSeeded();
      setSearchQuery('');
    } else {
      toast.error(`Failed to restore ICD codes. ${result.errorCount} errors occurred.`);
    }

    await loadICDCodes();
    setIsSeeding(false);
    setLoading(false);
  };

  const handleEditCode = (code: ICDCodeRate) => {
    setSelectedCode(code);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCode = async (code: ICDCodeRate) => {
    if (confirm(`Are you sure you want to delete ICD Code ${code.code}?`)) {
      const success = await deleteICDCode(code.code);
      if (success) {
        toast.success(`ICD Code ${code.code} deleted successfully!`);
      } else {
        toast.error('Failed to delete ICD code');
      }
      await loadICDCodes();
    }
  };

  const handleSaveCode = async (code: ICDCodeRate) => {
    if (selectedCode) {
      // Update existing
      const result = await updateICDCode(code);
      if (result) {
        toast.success(`ICD Code ${code.code} updated successfully!`);
      } else {
        toast.error('Failed to update ICD code');
      }
    } else {
      // Add new
      const result = await addICDCode(code);
      if (result) {
        toast.success(`ICD Code ${code.code} added successfully!`);
      } else {
        toast.error('Failed to add ICD code');
      }
    }
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    await loadICDCodes();
  };

  const filteredCodes = icdCodes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#0D47A1] text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">ICD-10 Code Management</h1>
          <p className="text-blue-100 mt-1">Manage medical case rates and ICD codes</p>
        </div>

        {/* Search and Add Section */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ICD code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent"
              />
            </div>
            <button
              onClick={handleRestoreICDCodes}
              disabled={isSeeding}
              className="bg-[#4CAF50] disabled:bg-[#A5D6A7] hover:bg-[#43A047] text-white px-4 py-2 rounded-lg transition-colors"
              title="Restore all default ICD codes"
            >
              {isSeeding ? 'Restoring ICD codes…' : 'Restore full ICD codes'}
            </button>
            <button
              onClick={handleAddCode}
              className="bg-[#2196F3] hover:bg-[#1976D2] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add ICD Code
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-b-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2196F3] mx-auto"></div>
              <p className="mt-4">Loading ICD codes...</p>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No ICD codes found</p>
              <p className="text-sm mt-2">
                {searchQuery ? 'Try adjusting your search' : 'Click "Add ICD Code" to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#E3F2FD] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#0D47A1]">ICD Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#0D47A1]">Description</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-[#0D47A1]">Case Rate</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-[#0D47A1]">Health Facility Fee</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-[#0D47A1]">Professional Fee</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-[#0D47A1]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCodes.map((code) => (
                    <tr key={code.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{code.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{code.description}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-[#2196F3]">
                        ₱{code.totalCaseRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        ₱{code.healthFacilityFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        ₱{code.professionalFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditCode(code)}
                            className="p-2 text-[#2196F3] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code)}
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
            Showing {filteredCodes.length} of {icdCodes.length} ICD codes
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <ICDCodeDialog
          code={null}
          onSave={handleSaveCode}
          onClose={() => setIsAddDialogOpen(false)}
        />
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && selectedCode && (
        <ICDCodeDialog
          code={selectedCode}
          onSave={handleSaveCode}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </div>
  );
}

// ICD Code Add/Edit Dialog Component
interface ICDCodeDialogProps {
  code: ICDCodeRate | null;
  onSave: (code: ICDCodeRate) => void;
  onClose: () => void;
}

function ICDCodeDialog({ code, onSave, onClose }: ICDCodeDialogProps) {
  const [formData, setFormData] = useState<ICDCodeRate>({
    code: code?.code || '',
    description: code?.description || '',
    totalCaseRate: code?.totalCaseRate || 0,
    healthFacilityFee: code?.healthFacilityFee || 0,
    professionalFee: code?.professionalFee || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ICDCodeRate, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
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
      newErrors.code = 'ICD Code is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.totalCaseRate <= 0) {
      newErrors.totalCaseRate = 'Case Rate must be greater than 0';
    }

    if (formData.healthFacilityFee <= 0) {
      newErrors.healthFacilityFee = 'Health Facility Fee must be greater than 0';
    }

    if (formData.professionalFee <= 0) {
      newErrors.professionalFee = 'Professional Fee must be greater than 0';
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
            {code ? 'Edit ICD Code' : 'Add New ICD Code'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ICD Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ICD-10 Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              disabled={!!code}
              placeholder="e.g., A00.0, J18.9"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } ${code ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              placeholder="Enter detailed description of the medical condition"
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* First Case Rate Section */}
          <div className="bg-[#E3F2FD] border-2 border-[#2196F3] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-[#0D47A1] mb-4">First Case Rate</h3>

            {/* Total Case Rate */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Rate (Total) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalCaseRate || ''}
                  onChange={(e) => handleChange('totalCaseRate', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                    errors.totalCaseRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.totalCaseRate && <p className="text-red-500 text-sm mt-1">{errors.totalCaseRate}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Health Facility Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Facility Fee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.healthFacilityFee || ''}
                    onChange={(e) => handleChange('healthFacilityFee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                      errors.healthFacilityFee ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.healthFacilityFee && <p className="text-red-500 text-sm mt-1">{errors.healthFacilityFee}</p>}
              </div>

              {/* Professional Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Fee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.professionalFee || ''}
                    onChange={(e) => handleChange('professionalFee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent ${
                      errors.professionalFee ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.professionalFee && <p className="text-red-500 text-sm mt-1">{errors.professionalFee}</p>}
              </div>
            </div>
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
              {code ? 'Update' : 'Add'} ICD Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}