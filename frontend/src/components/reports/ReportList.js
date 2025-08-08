import React, { useState, useEffect } from 'react';
import { reports, reportTemplates } from '../../utils/api';
import { Download, Mail, Eye, Trash2, Plus, FileText } from 'lucide-react';

const ReportList = ({ jobId, customerId, onView, onNew }) => {
  const [reportsList, setReportsList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchReports(),
      fetchTemplates()
    ]).finally(() => setLoading(false));
  }, [jobId, customerId]);

  const fetchReports = async () => {
    try {
      const filters = {};
      
      if (jobId) filters.job_id = jobId;
      if (customerId) filters.customer_id = customerId;
      
      const response = await reports.getReports(filters);
      setReportsList(response.data.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await reportTemplates.getTemplates();
      setTemplates(response.data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };
  
  const handleSendReport = async (id) => {
    try {
      const report = reportsList.find(r => r.id === id);
      if (!report) return;
      
      const emailData = {
        subject: `Report: ${report.report_number}`,
        message: `Please find attached report ${report.report_number}.`
      };
      
      await reports.sendReport(id, emailData);
      fetchReports();
      
      alert('Report sent successfully');
    } catch (err) {
      setError('Failed to send report');
      console.error(err);
    }
  };
  
  const handleGeneratePDF = async (id) => {
    try {
      const response = await reports.generatePDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const report = reportsList.find(r => r.id === id);
      
      link.href = url;
      link.setAttribute('download', `Report_${report?.report_number || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to generate PDF');
      console.error(err);
    }
  };
  
  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reports.deleteReport(id);
      setReportsList(reportsList.filter(report => report.id !== id));
    } catch (err) {
      setError('Failed to delete report');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Reports</h2>
        {onNew && templates.length > 0 && (
          <button
            onClick={onNew}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Report
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Report Templates Available</h3>
          <p className="text-yellow-700 mb-4">
            You need to create a report template before you can generate reports.
          </p>
        </div>
      ) : reportsList.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No reports found</p>
          <p className="text-gray-400 mb-6">
            {jobId || customerId
              ? 'No reports have been created for this record yet.'
              : 'Create your first report to get started.'}
          </p>
          {onNew && (
            <button
              onClick={onNew}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 inline-flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create New Report
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {reportsList.map((report) => (
              <li key={report.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {report.report_number}
                      </h3>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                         report.status === 'sent' ? 'bg-green-100 text-green-800' : 
                         'bg-gray-100 text-gray-800'}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.template_name}
                    </p>
                    <div className="mt-1 text-xs text-gray-500">
                      <span>{report.customer_name}</span>
                      {report.job_title && (
                        <span className="ml-2">• {report.job_title}</span>
                      )}
                      <span className="ml-2">• {new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView && onView(report.id)}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleSendReport(report.id)}
                      className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                      title="Send"
                    >
                      <Mail size={18} />
                    </button>
                    <button
                      onClick={() => handleGeneratePDF(report.id)}
                      className="p-2 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-50"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportList;