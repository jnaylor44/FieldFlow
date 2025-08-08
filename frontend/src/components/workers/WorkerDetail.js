import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, Edit, Save, X, MapPin, FileText, User } from 'lucide-react';
import api from '../../utils/api';
import MapView from '../maps/MapView';

const WorkerDetail = ({ workerId, onBack }) => {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('location'); // Changed default to 'location'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [workerJobs, setWorkerJobs] = useState([]);
  const [mapKey, setMapKey] = useState(Date.now()); // Force map re-render

  useEffect(() => {
    fetchWorkerDetails();
    if (workerId) {
      fetchWorkerJobs();
    }
  }, [workerId]);

  const fetchWorkerDetails = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await api.get(`/workers/${workerId}`);
      console.log('Worker details:', response.data);
      setWorker(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || ''
      });
    } catch (error) {
      console.error('Error fetching worker details:', error);
      setError('Failed to load worker details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerJobs = async () => {
    try {
      const response = await api.get(`/workers/${workerId}/jobs`);
      console.log('Worker jobs:', response.data);
      setWorkerJobs(response.data);
    } catch (error) {
      console.error('Error fetching worker jobs:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/users/${workerId}`, formData);
      setWorker(prev => ({ ...prev, ...response.data }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating worker:', error);
      setError('Failed to update worker');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'location') {
      setMapKey(Date.now());
    }
  };

  if (loading && !worker) {
    return <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (error && !worker) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Workers
        </button>
        
        {activeTab === 'details' && !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 flex items-center text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
          >
            <Edit size={16} className="mr-1" />
            Edit
          </button>
        ) : activeTab === 'details' && isEditing ? (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 flex items-center text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
            >
              <X size={16} className="mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 flex items-center text-white bg-primary-600 hover:bg-primary-700 rounded"
            >
              <Save size={16} className="mr-1" />
              Save
            </button>
          </div>
        ) : null}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-500 border border-red-200 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              {worker?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="flex-1">
              {isEditing && activeTab === 'details' ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="text-xl font-medium w-full border-gray-300 rounded-md"
                />
              ) : (
                <h2 className="text-xl font-medium">{worker?.name}</h2>
              )}
              <p className="text-gray-500">Worker</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => handleTabChange('details')}
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === 'details'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User size={16} className="mr-1" />
              Details
            </button>
            <button
              onClick={() => handleTabChange('location')}
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === 'location'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin size={16} className="mr-1" />
              Location
            </button>
            <button
              onClick={() => handleTabChange('jobs')}
              className={`px-4 py-3 text-sm font-medium flex items-center ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={16} className="mr-1" />
              Jobs
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8">
                  <Phone size={18} className="text-gray-600" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="flex-1 border-gray-300 rounded-md"
                    placeholder="Add phone number"
                  />
                ) : (
                  <span>{worker?.phone || 'No phone number'}</span>
                )}
              </div>
              
              <div className="flex items-center">
                <div className="w-8">
                  <Mail size={18} className="text-gray-600" />
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="flex-1 border-gray-300 rounded-md"
                    placeholder="Add email address"
                  />
                ) : (
                  <span>{worker?.email || 'No email address'}</span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Current Location</h3>
                <p className="text-sm text-gray-600 mb-3">
                  View the worker's current location and assigned jobs on the map.
                </p>
                
                {/* Map Container with explicit styling */}
                <div 
                  style={{ 
                    height: '400px', 
                    width: '100%', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    overflow: 'hidden'
                  }}
                  key={mapKey}
                >
                  <MapView 
                    selectedWorker={workerId}
                    height="400px"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <h3 className="text-lg font-medium mb-2">Assigned Jobs</h3>
              {workerJobs.length > 0 ? (
                <div className="space-y-3">
                  {workerJobs.map(job => (
                    <div key={job.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div className="font-medium">{job.title}</div>
                        <div className={`px-2 py-0.5 text-xs rounded-full ${
                          job.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(job.scheduled_start).toLocaleString()} - {new Date(job.scheduled_end).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {job.customer_name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No jobs assigned to this worker.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDetail;