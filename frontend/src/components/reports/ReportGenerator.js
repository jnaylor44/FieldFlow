import React, { useState, useEffect, useRef } from 'react';
import { reportTemplates, reports, customers, jobs } from '../../utils/api';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, X, Trash2, RefreshCw, Upload } from 'lucide-react';

const ReportGenerator = ({ jobId, customerId, onComplete, onCancel }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [formData, setFormData] = useState({});
  const [customer, setCustomer] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = template selection, 2 = fill form

  const signaturePads = useRef({});
  const fileInputs = useRef({});

  /**
 * Compresses a base64 encoded image to reduce file size
 * @param {string} base64Image - The base64 string of the image
 * @param {number} maxWidth - Maximum width to resize to (default: 1024px)
 * @param {number} quality - JPEG quality (0-1) (default: 0.7 or 70%)
 * @returns {Promise<string>} Compressed base64 image
 */
const compressImage = (base64Image, maxWidth = 1024, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    try {

      const img = new Image();
      img.onload = () => {

        const canvas = document.createElement('canvas');
        
   
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      img.src = base64Image;
    } catch (err) {
      reject(err);
    }
  });
};

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error && error.message) return error.message;
    if (error && typeof error === 'object') return JSON.stringify(error);
    return 'An unknown error occurred';
  };

  useEffect(() => {
    fetchInitialData();
  }, [jobId, customerId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [templatesRes] = await Promise.all([
        reportTemplates.getTemplates(),
      ]);
      
      setTemplates(templatesRes.data);

      if (jobId) {
        const jobRes = await jobs.getJob(jobId);
        setJob(jobRes.data);
        
        if (!customerId && jobRes.data.customer_id) {
          const customerRes = await customers.getCustomer(jobRes.data.customer_id);
          setCustomer(customerRes.data);
        }
      }
      
      if (customerId) {
        const customerRes = await customers.getCustomer(customerId);
        setCustomer(customerRes.data);
      }
    } catch (err) {
      setError('Failed to load initial data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      Object.keys(signaturePads.current).forEach(key => {
        const signaturePad = signaturePads.current[key];
        if (signaturePad && signaturePad._canvas) {
          const canvas = signaturePad._canvas;
          const parentWidth = canvas.parentElement.clientWidth;
          const parentHeight = canvas.parentElement.clientHeight;
          const currentSignature = signaturePad.toDataURL();
          canvas.width = parentWidth;
          canvas.height = parentHeight;
          if (!signaturePad.isEmpty()) {
            signaturePad.fromDataURL(currentSignature);
          }
        }
      });
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {

      const initialFormData = {};
      selectedTemplate.template_content.sections.forEach((section, index) => {
        if (section.type !== 'static') {
          if (section.type === 'checkbox') {
            initialFormData[`section_${index}`] = false;
          } else if (section.type === 'date') {
            initialFormData[`section_${index}`] = new Date().toISOString().split('T')[0];
          } else if (section.type === 'checklist') {
            initialFormData[`section_${index}`] = {};
          } else {
            initialFormData[`section_${index}`] = '';
          }
        }
      });
      setFormData(initialFormData);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = async (templateId) => {
    try {
      setLoading(true);
      const response = await reportTemplates.getTemplate(templateId);
      setSelectedTemplate(response.data);
      setTemplateData(response.data.template_content);
      const initialFormData = {};
      response.data.template_content.sections.forEach((section, index) => {
        if (section.type !== 'static') {
          if (section.type === 'checkbox') {
            initialFormData[`section_${index}`] = false;
          } else if (section.type === 'date') {
            initialFormData[`section_${index}`] = new Date().toISOString().split('T')[0];
          } else {
            initialFormData[`section_${index}`] = '';
          }
        }
      });
      setFormData(initialFormData);
      setStep(2);
    } catch (err) {
      setError('Failed to load template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (sectionIndex, value, checkItemIndex = null, fieldType = null) => {
    if (checkItemIndex !== null) {
      const currentChecklist = {...(formData[`section_${sectionIndex}`] || {})};
      
      if (fieldType === 'note') {
        if (!currentChecklist.notes) currentChecklist.notes = {};
        currentChecklist.notes[checkItemIndex] = value;
      } else {
        currentChecklist[checkItemIndex] = value;
        if (!value && currentChecklist.notes && currentChecklist.notes[checkItemIndex]) {
          delete currentChecklist.notes[checkItemIndex];
        }
      }
      
      setFormData({
        ...formData,
        [`section_${sectionIndex}`]: currentChecklist
      });
    } else {
      setFormData({
        ...formData,
        [`section_${sectionIndex}`]: value
      });
    }
  };
  const handlePhotoSelect = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(index, reader.result);
    };
    reader.readAsDataURL(file);
  };
  const triggerPhotoUpload = (index) => {
    if (fileInputs.current[`section_${index}`]) {
      fileInputs.current[`section_${index}`].click();
    }
  };
  const removePhoto = (index) => {
    handleInputChange(index, '');
    if (fileInputs.current[`section_${index}`]) {
      fileInputs.current[`section_${index}`].value = '';
    }
  };
  const clearSignature = (index) => {
    if (signaturePads.current[`section_${index}`]) {
      signaturePads.current[`section_${index}`].clear();
      handleInputChange(index, '');
    }
  };

  const saveSignature = (index) => {
    if (signaturePads.current[`section_${index}`] && !signaturePads.current[`section_${index}`].isEmpty()) {
      const canvas = signaturePads.current[`section_${index}`]._canvas;
      const signatureData = signaturePads.current[`section_${index}`].toDataURL('image/png');
      handleInputChange(index, signatureData);
    } else {
      setError('Please sign before saving');
    }
  };

  const processReportContent = async () => {
    const processedSections = [];
    
    for (let i = 0; i < templateData.sections.length; i++) {
      const section = templateData.sections[i];
      const sectionValue = formData[`section_${i}`];
      
      if (section.type === 'checklist') {
        const selectedItems = [];
        const allItems = section.checklistItems || [];
        const notes = sectionValue?.notes || {};
        allItems.forEach((item, idx) => {
          if (sectionValue && sectionValue[idx]) {
            const selectedItem = {
              text: item,
              note: notes[idx] || null
            };
            selectedItems.push(selectedItem);
          }
        });
        
        processedSections.push({
          ...section,
          value: sectionValue || {}, // Keep the raw values
          selectedItems, // Add a processed array of selected items
        });
      } else if (section.type === 'photo' && sectionValue) {
        try {
          const compressedValue = await compressImage(sectionValue);
          processedSections.push({
            ...section,
            value: compressedValue
          });
        } catch (err) {
          console.error('Failed to compress image:', err);
          processedSections.push({
            ...section,
            value: sectionValue
          });
        }
      } else {
        processedSections.push({
          ...section,
          value: section.type !== 'static' ? sectionValue : section.content
        });
      }
    }
    
    return processedSections;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTemplate || !customer) {
      setError('Missing required data');
      return;
    }
    let missingRequired = false;
    templateData.sections.forEach((section, index) => {
      if (section.required && section.type !== 'static' && !formData[`section_${index}`]) {
        missingRequired = true;
        setError(`Please fill in the required field: ${section.title}`);
      }
    });
    
    if (missingRequired) {
      return;
    }
    
    try {
      setSubmitting(true);
      

      const processedSections = await processReportContent();
      const reportContent = {
        logo: templateData.logo || null,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        sections: processedSections,
        customer: {
          id: customer.id,
          name: customer.name,
          company: customer.company_name,
          email: customer.email
        },
        job: job ? {
          id: job.id,
          title: job.title,
          status: job.status,
          scheduled_start: job.scheduled_start,
          scheduled_end: job.scheduled_end
        } : null,
        created_at: new Date().toISOString()
      };
      const response = await reports.createReport({
        template_id: selectedTemplate.id,
        customer_id: customer.id,
        job_id: job?.id || null,
        report_content: reportContent
      });
      
      onComplete(response.data);
    } catch (err) {
      const errorMessage = getErrorMessage(err.response?.data?.error || err);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-6">Select a Report Template</h2>
        
        {error && (
  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    {typeof error === 'object' ? getErrorMessage(error) : error}
  </div>
)}
        
        {templates.length === 0 ? (
          <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
            <p className="text-gray-500">No templates available. Please create a template first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <h3 className="font-medium text-lg">{template.name}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {template.description || 'No description'}
                </p>
                {!template.is_active && (
                  <span className="px-2 mt-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">{selectedTemplate.name}</h2>
      <p className="text-gray-600 mb-6">{selectedTemplate.description}</p>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Display logo if available */}
        {templateData?.logo && (
          <div className="mb-6">
            <img 
              src={templateData.logo} 
              alt="Report Logo" 
              className="h-20 object-contain"
            />
          </div>
        )}
      
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Report Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Customer</label>
                <p className="text-gray-800">{customer?.name || 'Not selected'}</p>
              </div>
              {job && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Job</label>
                  <p className="text-gray-800">{job.title}</p>
                </div>
              )}
            </div>
          </div>

        {templateData?.sections?.map((section, index) => {
  const widthClass = 
    section.width === 'half' ? 'w-1/2' : 
    section.width === 'third' ? 'w-1/3' : 
    section.width === 'quarter' ? 'w-1/4' : 
    'w-full';
  const displayClass = 
    section.display === 'inline' ? 'inline-block' : 
    section.display === 'grid' ? 'grid grid-cols-2 gap-4' : 
    'block';
  const layoutClass = 
    section.layout === 'stacked' ? 'flex flex-col space-y-2' : 
    section.layout === 'row' ? 'flex flex-row items-center space-x-4' : 
    section.layout === 'columns' ? 'grid grid-cols-3 gap-4' : 
    '';
  
  return (
    <div 
      key={index} 
      className={`${section.display === 'inline' ? widthClass + ' pr-4 inline-block align-top' : 'w-full'} mb-6`}
    >
      <h4 className="font-medium text-lg mb-2">{section.title}</h4>
      
      {section.type === 'static' ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
        </div>
      ) : (
        <div className={layoutClass}>
          {section.type === 'text' && (
            <input
              type="text"
              value={formData[`section_${index}`] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder={section.placeholder || ''}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={section.required}
            />
          )}
          
          {section.type === 'textarea' && (
            <textarea
              value={formData[`section_${index}`] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder={section.placeholder || ''}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              required={section.required}
            />
          )}
          
          {section.type === 'number' && (
            <input
              type="number"
              value={formData[`section_${index}`] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder={section.placeholder || ''}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={section.required}
            />
          )}
          
          {section.type === 'checkbox' && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData[`section_${index}`] || false}
                onChange={(e) => handleInputChange(index, e.target.checked)}
                className="form-checkbox h-5 w-5 text-primary-600"
                required={section.required}
              />
              <span className="ml-2 text-gray-700">{section.placeholder || 'Check if applicable'}</span>
            </label>
          )}

{section.type === 'checklist' && (
  <div className="bg-gray-50 p-4 rounded border">
    {section.checklistItems && section.checklistItems.length > 0 ? (
      <div>
        <div className={`grid grid-cols-${section.columns || 1} gap-4`}>
          {(() => {
            const items = section.checklistItems;
            const numCols = section.columns || 1;
            const numRows = Math.ceil(items.length / numCols);
            const reorderedItems = Array(items.length).fill(null);
            items.forEach((item, checkIndex) => {
              const col = Math.floor(checkIndex / numRows);
              const row = checkIndex % numRows;
              const newIndex = row * numCols + col;
              if (newIndex < items.length) {
                const isChecked = formData[`section_${index}`]?.[checkIndex] || false;
                
                reorderedItems[newIndex] = (
                  <div key={checkIndex} className="flex flex-col">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleInputChange(index, e.target.checked, checkIndex)}
                        className="form-checkbox h-5 w-5 text-primary-600"
                        id={`checklist-${index}-${checkIndex}`}
                      />
                      <label 
                        htmlFor={`checklist-${index}-${checkIndex}`}
                        className="ml-2 text-gray-700 cursor-pointer"
                      >
                        {item}
                      </label>
                    </div>
                    
                    {/* Note field if enabled and item is checked */}
                    {section.allowNotes && isChecked && (
                      <div className="ml-7 mt-1">
                        <input
                          type="text"
                          value={(formData[`section_${index}`]?.notes || {})[checkIndex] || ''}
                          onChange={(e) => handleInputChange(index, e.target.value, checkIndex, 'note')}
                          placeholder="Add note..."
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 outline-none py-1 px-1"
                        />
                      </div>
                    )}
                  </div>
                );
              }
            });
            return reorderedItems.filter(Boolean);
          })()}
        </div>
      </div>
    ) : (
      <p className="text-gray-500 text-center">No checklist items defined</p>
    )}
  </div>
)}
          
          {section.type === 'select' && (
            <select
              value={formData[`section_${index}`] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={section.required}
            >
              <option value="">Select {section.placeholder || '...'}</option>
              {section.options?.map((option, i) => (
                <option key={i} value={option}>{option}</option>
              ))}
            </select>
          )}
          
          {section.type === 'date' && (
            <input
              type="date"
              value={formData[`section_${index}`] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={section.required}
            />
          )}
          
          {section.type === 'signature' && (
  <div className="border-2 border-gray-300 rounded-lg w-full">
    {formData[`section_${index}`] ? (
      <div className="relative">
        <img 
          src={formData[`section_${index}`]} 
          alt="Signature" 
          className="max-h-36 w-full object-contain bg-white p-2"
        />
        <button
          type="button"
          onClick={() => clearSignature(index)}
          className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full"
        >
          <X size={16} />
        </button>
      </div>
    ) : (
      <div className="p-2 bg-white w-full">
        <div className="border border-gray-200 bg-white w-full relative" style={{ height: "200px" }}>
          <SignatureCanvas
            ref={ref => {
              signaturePads.current[`section_${index}`] = ref;
              if (ref) {
                setTimeout(() => {
                  const parentWidth = ref._canvas.parentElement.clientWidth;
                  const parentHeight = ref._canvas.parentElement.clientHeight;
                  ref.clear();
                  ref._canvas.width = parentWidth;
                  ref._canvas.height = parentHeight;
                }, 100);
              }
            }}
            canvasProps={{
              className: "signature-canvas w-full h-full absolute top-0 left-0"
            }}
            backgroundColor='rgba(255, 255, 255, 0)'
            clearOnResize={false}
          />
        </div>
        <div className="flex justify-between mt-2">
          <button
            type="button"
            onClick={() => clearSignature(index)}
            className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => saveSignature(index)}
            className="px-3 py-1 text-sm bg-blue-600 rounded text-white hover:bg-blue-700"
          >
            Save Signature
          </button>
        </div>
      </div>
    )}
  </div>
)}
          
          {section.type === 'photo' && (
            <div>
              <input
                type="file"
                accept="image/*"
                ref={ref => fileInputs.current[`section_${index}`] = ref}
                onChange={(e) => handlePhotoSelect(index, e)}
                className="hidden"
              />
              
              {formData[`section_${index}`] ? (
                <div className="relative">
                  <img 
                    src={formData[`section_${index}`]} 
                    alt="Uploaded" 
                    className="max-h-64 object-contain border rounded p-2"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-lg flex flex-col items-center">
                  <Camera size={48} className="text-gray-400 mb-2" />
                  <p className="text-gray-500 mb-4">{section.placeholder || 'Click to add a photo'}</p>
                  <button
                    type="button"
                    onClick={() => triggerPhotoUpload(index)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Photo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})}
</div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportGenerator;