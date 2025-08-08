import React, { useState } from 'react';
import TemplateList from '../components/reports/TemplateList';
import TemplateEditor from '../components/reports/TemplateEditor';
import { reportTemplates } from '../utils/api';

const ReportTemplatesPage = () => {
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchFullTemplate = async (templateId) => {
    try {
      setLoading(true);
      const response = await reportTemplates.getTemplate(templateId);
      return response.data;
    } catch (err) {
      console.error("Error fetching template details:", err);
      setError('Failed to load template details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = async (template) => {
    console.log("Edit template clicked:", template);
    const fullTemplate = await fetchFullTemplate(template.id);
    
    if (fullTemplate) {
      console.log("Full template loaded:", fullTemplate);
      setSelectedTemplate(fullTemplate);
      setView('editor');
    }
  };

  const handleNewTemplate = () => {
    console.log("New template clicked");
    setSelectedTemplate(null);
    setView('editor');
  };

  const handleSaveComplete = (savedTemplate) => {
    console.log("Template saved:", savedTemplate);
    setView('list');
    setSelectedTemplate(null);
  };

  return (
    <div className="container mx-auto p-6">
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        view === 'list' ? (
          <TemplateList 
            onEdit={handleEditTemplate}    
            onNew={handleNewTemplate}      
          />
        ) : (
          <TemplateEditor 
            template={selectedTemplate}
            onSave={handleSaveComplete}
            onCancel={() => setView('list')}
          />
        )
      )}
    </div>
  );
};

export default ReportTemplatesPage;