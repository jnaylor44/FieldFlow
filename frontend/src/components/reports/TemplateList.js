import React, { useState, useEffect } from 'react';
import { reportTemplates } from '../../utils/api';
import { Edit, Trash2, Plus, Copy } from 'lucide-react';

const TemplateList = ({ onEdit, onNew }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await reportTemplates.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await reportTemplates.deleteTemplate(id);
      setTemplates(templates.filter(template => template.id !== id));
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      const newName = `Copy of ${template.name}`;
      const response = await reportTemplates.createTemplate({
        ...template,
        name: newName,
        id: undefined
      });
      fetchTemplates();
    } catch (err) {
      setError('Failed to duplicate template');
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
      {/* Header with title and create button - always visible */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">You have created {templates.length} of 10 available templates </h2>
        <button
          onClick={onNew}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
        >
          <Plus size={16} className="mr-2" />
          New Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
          <p className="text-gray-500">No templates found. Create your first template to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {templates.map((template) => (
              <li key={template.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-gray-900">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {template.description || 'No description'}
                    </p>
                    <div className="mt-1">
                      {template.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(template)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 rounded-full hover:bg-indigo-50"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
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

export default TemplateList;