import React, { useState, useEffect } from 'react';
import { reports } from '../../utils/api';
import { Mail, Download, ArrowLeft, CheckCircle, AlertCircle, X } from 'lucide-react';

const ReportView = ({ reportId, onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await reports.getReport(reportId);
      setReport(response.data);
      if (response.data?.customer?.email) {
        setEmailData({
          email: response.data.customer.email,
          subject: `Report: ${response.data.report_number}`,
          message: `Dear ${response.data.customer.name},\n\nPlease find attached report ${response.data.report_number}.\n\nThank you,\n${response.data.created_by_name || 'FieldFlow Team'}`
        });
      }
    } catch (err) {
      setError('Failed to load report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    
    if (!emailData.email) {
      setError('Please provide an email address');
      return;
    }
    
    try {
      setSending(true);
      await reports.sendReport(reportId, emailData);
      setEmailSuccess(true);
      setTimeout(() => {
        setShowEmailForm(false);
        setEmailSuccess(false);
        fetchReport();
      }, 2000);
    } catch (err) {
      setError('Failed to send report: ' + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setDownloadInProgress(true);
      const response = await reports.generatePDF(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      
      link.href = url;
      link.setAttribute('download', `Report_${report?.report_number || reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
        setDownloadInProgress(false);
      }, 100);
    } catch (err) {
      setError('Failed to generate PDF: ' + (err.response?.data?.error || err.message));
      console.error(err);
      setDownloadInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Report not found'}
      </div>
    );
  }

  const reportContent = report.report_content || {};

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="text-xl font-semibold">Report: {report.report_number}</h2>
          <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
             report.status === 'sent' ? 'bg-green-100 text-green-800' : 
             'bg-gray-100 text-gray-800'}`}
          >
            {report.status}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowEmailForm(true)}
            className="px-3 py-1 flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded"
            disabled={sending}
          >
            <Mail size={16} className="mr-1" />
            {sending ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={handleGeneratePDF}
            className="px-3 py-1 flex items-center text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded"
            disabled={downloadInProgress}
          >
            <Download size={16} className="mr-1" />
            {downloadInProgress ? 'Generating...' : 'PDF'}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Report Details</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-sm text-gray-500">Template:</dt>
              <dd className="text-sm font-medium">{report.template_name}</dd>
              
              <dt className="text-sm text-gray-500">Created:</dt>
              <dd className="text-sm font-medium">{new Date(report.created_at).toLocaleString()}</dd>
              
              <dt className="text-sm text-gray-500">Status:</dt>
              <dd className="text-sm font-medium">{report.status}</dd>
              
              {report.sent_at && (
                <>
                  <dt className="text-sm text-gray-500">Sent:</dt>
                  <dd className="text-sm font-medium">{new Date(report.sent_at).toLocaleString()}</dd>
                </>
              )}
            </dl>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Customer Information</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-sm text-gray-500">Name:</dt>
              <dd className="text-sm font-medium">{reportContent.customer?.name || report.customer_name || 'N/A'}</dd>
              
              <dt className="text-sm text-gray-500">Email:</dt>
              <dd className="text-sm font-medium">{reportContent.customer?.email || report.customer_email || 'N/A'}</dd>
              
              {reportContent.job?.title && (
                <>
                  <dt className="text-sm text-gray-500">Job:</dt>
                  <dd className="text-sm font-medium">{reportContent.job.title}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
        
        {/* Report Logo */}
        {reportContent.logo && (
          <div className="mb-6">
            <img 
              src={reportContent.logo} 
              alt="Company Logo" 
              className="h-20 object-contain"
            />
          </div>
        )}
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium">Report Content</h3>
          </div>
          
          {/* <div className="p-6">
            {reportContent.sections?.map((section, index) => (
              <div key={index} className="mb-6">
                <h4 className="font-medium text-lg mb-2">{section.title}</h4>
                
                {section.type === 'static' ? (
                  <div className="whitespace-pre-line text-gray-700">
                    {section.content}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded border">
                    {section.type === 'checkbox' ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!section.value}
                          readOnly
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="ml-2">{section.placeholder || 'Checked'}</span>
                      </div>
                    ) : section.type === 'photo' ? (
                      section.value ? (
                        <div className="flex justify-center">
                          <img 
                            src={section.value}
                            alt={section.title} 
                            className="max-h-64 object-contain"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">No photo provided</p>
                      )
                    ) : section.type === 'signature' ? (
                      section.value ? (
                        <div className="flex justify-center">
                          <img 
                            src={section.value} 
                            alt="Signature" 
                            className="max-h-20 object-contain"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">No signature provided</p>
                      )
                    ) : (
                      <div className="whitespace-pre-line">
                        {section.value || <span className="text-gray-400">No data provided</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div> */}

          <div className="p-6">
  {reportContent.sections?.map((section, index) => {
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
      className={`mb-6 ${section.display === 'inline' ? widthClass + ' pr-4 inline-block align-top' : 'w-full'}`}
    >
      <h4 className="font-medium text-lg mb-2">{section.title}</h4>
      
      {section.type === 'static' ? (
        <div className="whitespace-pre-line text-gray-700">
          {section.content}
        </div>
      ) : (
        <div className={`bg-gray-50 p-4 rounded border ${layoutClass}`}>
          {section.type === 'checkbox' ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={!!section.value}
                readOnly
                className="h-4 w-4 text-primary-600"
              />
              <span className="ml-2">{section.placeholder || 'Checked'}</span>
            </div>
          ) : section.type === 'photo' ? (
            section.value ? (
              <div className="flex justify-center">
                <img 
                  src={section.value}
                  alt={section.title} 
                  className="max-h-64 object-contain"
                />
              </div>
            ) : (
              <p className="text-gray-500 text-center">No photo provided</p>
            )
          ) : section.type === 'signature' ? (
            section.value ? (
              <div className="flex justify-center">
                <img 
                  src={section.value} 
                  alt="Signature" 
                  className="max-h-20 object-contain"
                />
              </div>
            ) : (
              <p className="text-gray-500 text-center">No signature provided</p>
            )
          ) : section.type === 'checklist' ? (
            <div>
              {section.checklistItems && section.checklistItems.length > 0 ? (
                <div>
                  <div className={`grid grid-cols-${section.columns || 1} gap-4`}>
                    {section.checklistItems.map((item, checkIndex) => {
                      const isChecked = section.value && section.value[checkIndex];
                      const note = section.value?.notes && section.value.notes[checkIndex];
                      
                      return (
                        <div key={checkIndex} className="flex flex-col">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isChecked || false}
                              readOnly
                              className="h-5 w-5 text-primary-600"
                            />
                            <span className={`ml-2 ${isChecked ? 'font-medium' : 'text-gray-600'}`}>
                              {item}
                            </span>
                          </div>
                          
                          {/* Show note if it exists */}
                          {note && (
                            <div className="ml-7 mt-1 text-sm text-gray-600 italic">
                              Note: {note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary section if enabled and items are selected */}
                  {section.summarizeSelected && section.value && 
                   Object.keys(section.value).some(k => k !== 'notes' && section.value[k]) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-semibold mb-2">Selected Items:</h5>
                      <ul className="list-disc pl-5 space-y-1">
                        {section.checklistItems.map((item, idx) => {
                          if (section.value[idx]) {
                            return (
                              <li key={idx} className="text-gray-700">
                                {item}
                                {section.value.notes && section.value.notes[idx] && (
                                  <span className="ml-2 text-sm text-gray-600 italic">
                                    ({section.value.notes[idx]})
                                  </span>
                                )}
                              </li>
                            );
                          }
                          return null;
                        }).filter(Boolean)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No checklist items defined</p>
              )}
            </div>
          ) : (
            <div className={`whitespace-pre-line ${displayClass}`}>
              {section.value || <span className="text-gray-400">No data provided</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
  })}
</div>
        </div>
      </div>
      
      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            {emailSuccess ? (
              <div className="text-center">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Email Sent Successfully</h3>
                <p className="text-gray-500">The report has been emailed to {emailData.email}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium text-gray-900">Send Report</h3>
                  <button 
                    onClick={() => setShowEmailForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                    <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSendReport}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={emailData.email}
                      onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={emailData.subject}
                      onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={emailData.message}
                      onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      disabled={sending}
                    >
                      {sending ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;