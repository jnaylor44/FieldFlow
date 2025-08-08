import React, { useState, useEffect, useRef } from 'react';
import { reportTemplates } from '../../utils/api';
import { Layout, Grid, Columns, AlignLeft, CheckSquare, ListChecks } from 'lucide-react';

const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_content: {
      logo: null,
      sections: [],
      variables: {}
    },
    is_active: true
  });
  const [sections, setSections] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (template) {
      console.log("Loading template for editing:", template);
      const templateContent = template.template_content || { logo: null, sections: [], variables: {} };
      const templateSections = Array.isArray(templateContent.sections) 
        ? templateContent.sections 
        : [];
        
      console.log("Template sections to load:", templateSections);
      setFormData({
        name: template.name || '',
        description: template.description || '',
        template_content: templateContent,
        is_active: template.is_active !== undefined ? template.is_active : true
      });
      setSections(templateSections);
      if (templateContent.logo) {
        setLogoPreview(templateContent.logo);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        template_content: { logo: null, sections: [], variables: {} },
        is_active: true
      });
      setSections([]);
      setLogoPreview(null);
    }
  }, [template]);
  useEffect(() => {
    if (!isInitialMount.current) {
      console.log("Sections state updated:", sections);
    } else {
      isInitialMount.current = false;
    }
  }, [sections]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setLogoPreview(base64String);
      setFormData({
        ...formData,
        template_content: {
          ...formData.template_content,
          logo: base64String
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setSections(updatedSections);
  };

  const addSection = (type = 'text') => {
    const newSection = {
      title: type === 'checklist' ? 'Checklist Section' : 'New Section',
      type: type,
      content: '',
      placeholder: '',
      required: false,
      layout: 'full',
      width: 'full',
      display: 'block',
      columns: 2, // Default 2 columns for checklist
      checklistItems: type === 'checklist' ? ['Item 1', 'Item 2', 'Item 3', 'Item 4'] : [], // Sample items for checklist
    };
    
    setSections([...sections, newSection]);
    setActiveSection(sections.length);
  };

  const removeSection = (index) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    setSections(updatedSections);
    if (activeSection === index) {
      setActiveSection(null);
    } else if (activeSection > index) {
      setActiveSection(activeSection - 1);
    }
  };

  const handleLayoutChange = (index, layout) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      layout: layout
    };
    setSections(updatedSections);
  };

  const handleWidthChange = (index, width) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      width: width
    };
    setSections(updatedSections);
  };

  const handleDisplayChange = (index, display) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      display: display
    };
    setSections(updatedSections);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updatedFormData = {
        ...formData,
        template_content: {
          ...formData.template_content,
          sections: sections,
          logo: logoPreview
        }
      };

      console.log("Saving template with sections:", sections);

      if (template) {
        const response = await reportTemplates.updateTemplate(template.id, updatedFormData);
        onSave(response.data);
      } else {
        const response = await reportTemplates.createTemplate(updatedFormData);
        onSave(response.data);
      }
    } catch (err) {
      console.error("Error saving template:", err);
      setError(err.response?.data?.error || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };
  const moveSectionUp = (index) => {
    if (index === 0) return; // Already at the top
    
    const updatedSections = [...sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[index - 1];
    updatedSections[index - 1] = temp;
    
    setSections(updatedSections);
    if (activeSection === index) {
      setActiveSection(index - 1);
    } else if (activeSection === index - 1) {
      setActiveSection(index);
    }
  };
  const moveSectionDown = (index) => {
    if (index === sections.length - 1) return; // Already at the bottom
    
    const updatedSections = [...sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[index + 1];
    updatedSections[index + 1] = temp;
    
    setSections(updatedSections);
    if (activeSection === index) {
      setActiveSection(index + 1);
    } else if (activeSection === index + 1) {
      setActiveSection(index);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">
        {template ? 'Edit Template' : 'Create Template'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Template Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
        </div>

        {/* Logo Upload Section */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Report Logo
          </label>
          <div className="flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label 
              htmlFor="logo-upload"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            
            {logoPreview && (
              <div className="ml-4 relative">
                <img
                  src={logoPreview}
                  alt="Template Logo"
                  className="h-16 object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview(null);
                    setFormData({
                      ...formData,
                      template_content: {
                        ...formData.template_content,
                        logo: null
                      }
                    });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Recommended: company logo (PNG or JPG, max 5MB)
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="form-checkbox h-5 w-5 text-primary-600"
            />
            <span className="ml-2 text-gray-700">Active</span>
          </label>
        </div>

        <div className="mt-6 mb-4">
          <h3 className="text-lg font-semibold mb-2">Template Sections</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add sections to your template. Each section can be a text field, checkbox, date, etc.
          </p>

          {sections.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <p className="text-gray-500">No sections added yet. Add your first section to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Template preview panel */}
              <div className="bg-white p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Template Preview</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-12 gap-4">
                    {sections.map((section, index) => (
                      <div 
                        key={`preview-${index}`}
                        className={`
                          ${section.width === 'full' ? 'col-span-12' : 
                            section.width === 'half' ? 'col-span-6' : 
                            section.width === 'third' ? 'col-span-4' : 
                            section.width === 'quarter' ? 'col-span-3' : 'col-span-12'}
                          ${activeSection === index ? 'ring-2 ring-blue-500' : ''}
                          p-2 border border-gray-200 rounded
                          cursor-pointer
                          hover:bg-blue-50
                        `}
                        onClick={() => setActiveSection(index)}
                      >
                        <strong>{section.title}</strong>
                        <div className="text-xs text-gray-500">
                          {section.type} - {section.layout} layout
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Sections list */}
              {sections.map((section, index) => (
                <div 
                  key={index} 
                  className={`border p-4 rounded ${
                    activeSection === index ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium flex items-center">
                      <button 
                        type="button"
                        className="mr-2 p-1 rounded hover:bg-gray-200"
                        onClick={() => setActiveSection(activeSection === index ? null : index)}
                      >
                        {activeSection === index ? '▼' : '▶'}
                      </button>
                      Section {index + 1}: {section.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSectionUp(index)}
                        className={`p-1 rounded ${index === 0 ? 'text-gray-400' : 'hover:bg-gray-200 text-gray-700'}`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === sections.length - 1}
                        onClick={() => moveSectionDown(index)}
                        className={`p-1 rounded ${index === sections.length - 1 ? 'text-gray-400' : 'hover:bg-gray-200 text-gray-700'}`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {(activeSection === index) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Type
                        </label>
                        <select
                          value={section.type}
                          onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Text Area</option>
                          <option value="number">Number</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="select">Dropdown</option>
                          <option value="date">Date</option>
                          <option value="signature">Signature</option>
                          <option value="photo">Photo</option>
                          <option value="static">Static Text</option>
                          <option value="checklist">Checklist</option>
                        </select>
                      </div>

                      {/* Layout Options */}
                      <div className="col-span-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Layout Options
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Field Width */}
                          <div>
                            <label className="block text-gray-700 text-xs mb-1">
                              Field Width
                            </label>
                            <select
                              value={section.width || 'full'}
                              onChange={(e) => handleWidthChange(index, e.target.value)}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                            >
                              <option value="full">Full Width</option>
                              <option value="half">Half Width</option>
                              <option value="third">One Third</option>
                              <option value="quarter">One Quarter</option>
                            </select>
                          </div>
                          
                          {/* Display Style */}
                          <div>
                            <label className="block text-gray-700 text-xs mb-1">
                              Display Style
                            </label>
                            <select
                              value={section.display || 'block'}
                              onChange={(e) => handleDisplayChange(index, e.target.value)}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                            >
                              <option value="block">Block</option>
                              <option value="inline">Inline</option>
                              <option value="grid">Grid</option>
                            </select>
                          </div>
                          
                          {/* Layout Type */}
                          <div>
                            <label className="block text-gray-700 text-xs mb-1">
                              Layout Type
                            </label>
                            <select
                              value={section.layout || 'full'}
                              onChange={(e) => handleLayoutChange(index, e.target.value)}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                            >
                              <option value="full">Default</option>
                              <option value="stacked">Stacked</option>
                              <option value="row">Row</option>
                              <option value="columns">Columns</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {section.type === 'static' && (
                        <div className="col-span-2">
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Content
                          </label>
                          <textarea
                            value={section.content}
                            onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            rows="4"
                          />
                        </div>
                      )}

                      {section.type !== 'static' && section.type !== 'checklist' && (
                        <div className="col-span-2">
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Placeholder/Label
                          </label>
                          <input
                            type="text"
                            value={section.placeholder || ''}
                            onChange={(e) => handleSectionChange(index, 'placeholder', e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                      )}

                      {section.type === 'select' && (
                        <div className="col-span-2">
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Options (comma separated)
                          </label>
                          <input
                            type="text"
                            value={section.rawOptionsString || ''}
                            onChange={(e) => {
                              handleSectionChange(index, 'rawOptionsString', e.target.value);
                              if (section.options !== undefined) {
                                handleSectionChange(
                                  index, 
                                  'options', 
                                  e.target.value.split(',')
                                );
                              }
                            }}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                      )}
                      {section.type === 'checklist' && (
                        <div className="col-span-2 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 text-sm font-bold mb-2">
                                Number of Columns
                              </label>
                              <select
                                value={section.columns || 1}
                                onChange={(e) => handleSectionChange(index, 'columns', parseInt(e.target.value))}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value={1}>1 Column</option>
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                                <option value={4}>4 Columns</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-gray-700 text-sm font-bold mb-2">
                                Display Style
                              </label>
                              <select
                                value={section.checklistStyle || 'standard'}
                                onChange={(e) => handleSectionChange(index, 'checklistStyle', e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="standard">Standard Checkboxes</option>
                                <option value="compact">Compact List</option>
                                <option value="buttons">Button Style</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-gray-700 text-sm font-bold">
                                Checklist Items
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const items = section.checklistItems || [];
                                  handleSectionChange(index, 'checklistItems', [...items, `Item ${items.length + 1}`]);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                + Add Item
                              </button>
                            </div>

                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                              {(section.checklistItems || [])
                                .map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex items-center">
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => {
                                        const newItems = [...(section.checklistItems || [])];
                                        newItems[itemIdx] = e.target.value;
                                        handleSectionChange(index, 'checklistItems', newItems);
                                      }}
                                      className="flex-grow shadow-sm border rounded px-3 py-1 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="Enter item text"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = [...(section.checklistItems || [])];
                                        newItems.splice(itemIdx, 1);
                                        handleSectionChange(index, 'checklistItems', newItems);
                                      }}
                                      className="ml-2 text-red-600 hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                            </div>
                            
                            <div className="text-xs text-gray-500 mb-2">
                              Or enter multiple items at once (one per line):
                            </div>

                            <textarea
                              value={(section.checklistItems || []).join('\n')}
                              onChange={(e) => {
                                const items = e.target.value.split('\n');
                                handleSectionChange(index, 'checklistItems', items);
                              }}
                              placeholder="Enter one item per line"
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              rows="4"
                            />
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
  <h5 className="text-sm font-medium mb-2">Preview</h5>
  <div className={`grid grid-cols-${section.columns || 1} gap-4`}>
    {(() => {
      const items = (section.checklistItems || []).filter(item => item.trim() !== '');
      const numCols = section.columns || 1;
      const numRows = Math.ceil(items.length / numCols);
      const reorderedItems = Array(items.length).fill(null);
      items.forEach((item, i) => {
        const col = Math.floor(i / numRows);
        const row = i % numRows;
        const newIndex = row * numCols + col;
        if (newIndex < items.length) {
          reorderedItems[newIndex] = {
            item: item,
            originalIndex: i
          };
        }
      });
      return reorderedItems
        .filter(Boolean)
        .map(({item, originalIndex}, i) => (
          <div key={i} className="flex items-center">
            <input
              type="checkbox"
              disabled
              className="form-checkbox h-4 w-4 text-gray-400"
            />
            <span className="ml-2 text-sm text-gray-600">{item}</span>
          </div>
        ));
    })()}
  </div>
  {(!section.checklistItems || section.checklistItems.filter(item => item.trim() !== '').length === 0) && (
    <p className="text-sm text-gray-500 italic">Add items to see preview</p>
  )}
</div>
                          
                          <div className="mt-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={section.summarizeSelected || false}
                                onChange={(e) => handleSectionChange(index, 'summarizeSelected', e.target.checked)}
                                className="form-checkbox h-5 w-5 text-primary-600"
                              />
                              <span className="ml-2 text-gray-700">Show summary of selected items</span>
                            </label>
                            
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={section.allowNotes || false}
                                onChange={(e) => handleSectionChange(index, 'allowNotes', e.target.checked)}
                                className="form-checkbox h-5 w-5 text-primary-600"
                              />
                              <span className="ml-2 text-gray-700">Allow notes for each selected item</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={section.required || false}
                            onChange={(e) => handleSectionChange(index, 'required', e.target.checked)}
                            className="form-checkbox h-5 w-5 text-primary-600"
                          />
                          <span className="ml-2 text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex space-x-2">
            <button
              type="button"
              onClick={() => addSection()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Section
            </button>
            <button
              type="button"
              onClick={() => addSection('checklist')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
            >
              <ListChecks size={16} className="mr-2" />
              Add Checklist
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
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
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateEditor;