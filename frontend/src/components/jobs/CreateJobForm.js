import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import Modal from './JobModal';
import CreateCustomerForm from '../customers/CreateCustomerForm';
import { Plus, MapPin, X } from 'lucide-react';

const CreateJobForm = ({ onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    scheduledStart: '',
    scheduledEnd: '',
    priority: 'medium',
    assignedUserId: '',
    locations: [{ address: '', details: '' }] 
  });
  
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRefs = useRef({});
  const suggestionTimeoutRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, workersRes] = await Promise.all([
        api.get('/customers'),
        api.get('/users')
      ]);
      setCustomers(customersRes.data);
      setWorkers(workersRes.data.filter(user => user.role === 'worker'));
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error loading form data:', err);
    }
  };

  const fetchAddressSuggestions = async (input, locationIndex) => {
    if (!input || input.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    try {

      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      
      suggestionTimeoutRef.current = setTimeout(async () => {
        const response = await fetch(`http://localhost:3000/api/v1/places/autocomplete?input=${encodeURIComponent(input)}`);
        const data = await response.json();
console.log('Google API response data:', data);
console.log('Predictions array:', data.predictions);
console.log('Setting suggestions array of length:', (data.predictions || []).length);
        setAddressSuggestions(data.predictions || []);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
      }, 300);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setAddressSuggestions([]);
    }
  };

  const selectAddressPrediction = async (prediction, locationIndex) => {
    try {
      const response = await fetch(`/api/v1/places/details?place_id=${prediction.place_id}`);
      const data = await response.json();
      
      if (data.result) {
        const formattedAddress = data.result.formatted_address;
        
     
        let lat = null;
        let lng = null;
        
        if (data.result.geometry && data.result.geometry.location) {
          lat = data.result.geometry.location.lat;
          lng = data.result.geometry.location.lng;
        }
        

        const updatedLocations = [...formData.locations];
        updatedLocations[locationIndex] = {
          ...updatedLocations[locationIndex],
          address: formattedAddress,
          lat,
          lng
        };
        
        setFormData(prev => ({
          ...prev,
          locations: updatedLocations
        }));
      }
      
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {

      const filteredLocations = formData.locations.filter(loc => loc.address.trim() !== '');
      
      const submitData = {
        ...formData,
        assignedUserId: formData.assignedUserId || null,
        locations: filteredLocations
      };
  
      const response = await api.post('/jobs', submitData);
      onJobCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (index, field, value) => {
    const updatedLocations = [...formData.locations];
    updatedLocations[index] = {
      ...updatedLocations[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      locations: updatedLocations
    }));
    
    if (field === 'address') {
      fetchAddressSuggestions(value, index);
    }
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { address: '', details: '' }]
    }));
  };

  const removeLocation = (index) => {
    if (formData.locations.length <= 1) {
      return; 
    }
    
    const updatedLocations = formData.locations.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      locations: updatedLocations
    }));
  };

  const handleCustomerCreated = async (newCustomer) => {
    await fetchData(); 
    setFormData(prev => ({
      ...prev,
      customerId: newCustomer.id
    }));
    setShowCustomerModal(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSuggestions && !e.target.closest('.location-search-wrapper')) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Create New Job</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Job title"
          />
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Customer
            </label>
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="inline-flex items-center px-2 py-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} className="mr-1" />
              Add New Customer
            </button>
          </div>
          <select
            name="customerId"
            required
            value={formData.customerId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select a customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.company_name ? ` (${customer.company_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Job description and requirements"
          />
        </div>


        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Job Locations
            </label>
            <button
              type="button"
              onClick={addLocation}
              className="inline-flex items-center px-2 py-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus size={16} className="mr-1" />
              Add Location
            </button>
          </div>
          
          {formData.locations.map((location, index) => (
            <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                  Location {index + 1}
                </span>
                {formData.locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="mb-2 location-search-wrapper relative">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="relative mt-1">
                  <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => handleLocationChange(index, 'address', e.target.value)}
                    placeholder="Start typing an address..."
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    onFocus={() => {
                      if (location.address.length >= 3) {
                        fetchAddressSuggestions(location.address, index);
                      }
                    }}
                  />
                </div>
                
                {/* Address suggestions */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    ref={el => suggestionsRefs.current[index] = el}
                  >
                    {addressSuggestions.map((suggestion, i) => (
                      <div
                        key={suggestion.place_id}
                        className={`p-2 hover:bg-gray-100 cursor-pointer ${activeSuggestionIndex === i ? 'bg-gray-100' : ''}`}
                        onClick={() => selectAddressPrediction(suggestion, index)}
                      >
                        {suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Details (optional)
                </label>
                <input
                  type="text"
                  value={location.details}
                  onChange={(e) => handleLocationChange(index, 'details', e.target.value)}
                  placeholder="Apartment number, gate code, special instructions, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              name="scheduledStart"
              required
              value={formData.scheduledStart}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              name="scheduledEnd"
              required
              value={formData.scheduledEnd}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assign Worker
            </label>
            <select
              name="assignedUserId"
              value={formData.assignedUserId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Unassigned</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </form>

      {/* Customer Creation Modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)}>
        <CreateCustomerForm
          onClose={() => setShowCustomerModal(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      </Modal>
    </div>
  );
};

export default CreateJobForm;