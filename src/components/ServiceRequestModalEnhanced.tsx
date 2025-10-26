import React, { useState, useEffect } from 'react';
import { createServiceRequest } from '../utils/serviceRequestsAPI';
import { useUser } from '../context/UserContext';

interface ServiceRequestModalEnhancedProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: string;
  };
}

export default function ServiceRequestModalEnhanced({ 
  open, 
  onClose, 
  service 
}: ServiceRequestModalEnhancedProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    requestDetails: '',
    attachments: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        requestDetails: '',
        attachments: []
      });
      setSubmitted(false);
      setRequestId(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user || !formData.requestDetails.trim()) {
      alert('Please provide request details');
      return;
    }

    try {
      setSubmitting(true);
      
      const id = await createServiceRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        serviceId: service.id,
        serviceTitle: service.title,
        serviceCategory: service.category,
        requestDetails: { details: formData.requestDetails },
        attachments: formData.attachments
      });

      setRequestId(id);
      setSubmitted(true);
      
      // Show success notification
      document.dispatchEvent(
        new CustomEvent('notifications:add', {
          detail: { 
            type: 'service', 
            message: `Service request submitted: ${service.title}`, 
            meta: { id, serviceTitle: service.title } 
          },
        })
      );
      
    } catch (error) {
      console.error('Failed to submit service request:', error);
      alert('Failed to submit service request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In a real implementation, you would upload files to Firebase Storage
      // For now, we'll just store the file names
      const fileNames = Array.from(files).map(file => file.name);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileNames]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold">{service.title}</h2>
              <p className="text-gray-600">{service.description}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {service.category}
                </span>
                <span className="ml-2 text-sm text-gray-600">{service.price}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {!submitted ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Request Details *
                </label>
                <textarea
                  value={formData.requestDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestDetails: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 h-32 resize-none"
                  placeholder="Please describe your requirements in detail. Include any specific features, design preferences, timeline, or other important information..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center text-gray-600 hover:text-gray-800"
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm">Click to upload files</span>
                    <span className="text-xs text-gray-500">or drag and drop</span>
                  </label>
                </div>
                
                {formData.attachments.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Uploaded Files:</div>
                    <div className="space-y-1">
                      {formData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">{attachment}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Admin will review your request and submit a detailed proposal</li>
                  <li>2. You'll receive a notification with pricing and timeline</li>
                  <li>3. You can pay using your digital wallet or UPI</li>
                  <li>4. Work will begin once payment is confirmed</li>
                  <li>5. You'll receive deliverables upon completion</li>
                </ol>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.requestDetails.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                Request Submitted Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                Your service request has been submitted. You'll receive a notification when the admin reviews it.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-600">
                  <div>Request ID: <span className="font-mono">{requestId}</span></div>
                  <div>Service: {service.title}</div>
                  <div>Status: Pending Review</div>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.href = '/orders'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Orders
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
