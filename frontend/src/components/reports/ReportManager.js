import React, { useState } from 'react';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';
import ReportList from './ReportList';
import ReportView from './ReportView';
import ReportGenerator from './ReportGenerator';
import { Plus, FileText } from 'lucide-react';

const ReportManager = () => {
  const [activeView, setActiveView] = useState('reports'); // 'reports', 'templates', 'viewReport', 'newReport', 'editTemplate'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveView('editTemplate');
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setActiveView('editTemplate');
  };

  const handleTemplateSaved = () => {
    setActiveView('templates');
    setSelectedTemplate(null);
  };

  const handleViewReport = (reportId) => {
    setSelectedReportId(reportId);
    setActiveView('viewReport');
  };

  const handleNewReport = () => {
    setActiveView('newReport');
  };

  const handleReportCreated = () => {
    setActiveView('reports');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'templates':
        return (
          <TemplateList 
            onEdit={handleEditTemplate}
            onNew={handleNewTemplate}
          />
        );
      case 'editTemplate':
        return (
          <TemplateEditor 
            template={selectedTemplate}
            onSave={handleTemplateSaved}
            onCancel={() => setActiveView('templates')}
          />
        );
      case 'viewReport':
        return (
          <ReportView 
            reportId={selectedReportId}
            onBack={() => setActiveView('reports')}
          />
        );
      case 'newReport':
        return (
          <ReportGenerator 
            onComplete={handleReportCreated}
            onCancel={() => setActiveView('reports')}
          />
        );
      case 'reports':
      default:
        return (
          <ReportList 
            onView={handleViewReport}
            onNew={handleNewReport}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4 border-b pb-4">
          <button
            onClick={() => setActiveView('reports')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeView === 'reports' || activeView === 'viewReport' || activeView === 'newReport'
              ? 'bg-primary-100 text-primary-700' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveView('templates')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeView === 'templates' || activeView === 'editTemplate' 
              ? 'bg-primary-100 text-primary-700' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Templates
          </button>
        </div>
        
        {/* Always-visible action buttons */}
        <div className="flex space-x-2">
          {/* Show "New Template" button regardless of view */}
          <button
            onClick={handleNewTemplate}
            className="px-3 py-1.5 text-sm font-medium border border-purple-300 text-purple-700 bg-white rounded-md hover:bg-purple-50 flex items-center"
          >
            <FileText size={16} className="mr-1.5" />
            New Template
          </button>
          
          {/* Show "New Report" button only if we're in reports view and not in sub-views */}
          {activeView === 'reports' && (
            <button
              onClick={handleNewReport}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center"
            >
              <Plus size={16} className="mr-1.5" />
              New Report
            </button>
          )}
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default ReportManager;