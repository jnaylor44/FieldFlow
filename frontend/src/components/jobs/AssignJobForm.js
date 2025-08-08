import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { User, Check, AlertTriangle } from 'lucide-react';

const AssignJobForm = ({ job, onClose, onJobAssigned }) => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchWorkers();
    if (job && job.assigned_user_id) {
      setSelectedWorkerId(job.assigned_user_id);
    }
  }, [job]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users');
      const workersList = response.data.filter(user => user.role === 'worker');
      setWorkers(workersList);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading workers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post(`/jobs/${job.id}/assign`, {
        userId: selectedWorkerId || null  
      });
      
      setSuccess(true);
      onJobAssigned(response.data);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign job');
      console.error('Error assigning job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerChange = (e) => {
    setSelectedWorkerId(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Assign Job</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertTriangle size={16} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
          <Check size={16} className="mr-2" />
          Job assigned successfully!
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Job Details</h3>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="font-semibold">{job?.title}</p>
          <p className="text-sm text-gray-600">
            Customer: {job?.customer_name || 'Not specified'}
          </p>
          <p className="text-sm text-gray-600">
            Priority: <span className="capitalize">{job?.priority || 'Not specified'}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Assign To Worker
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={16} className="text-gray-400" />
            </div>
            <select
              value={selectedWorkerId}
              onChange={handleWorkerChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Unassigned</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
          {selectedWorkerId === '' && (
            <p className="mt-1 text-xs text-amber-600">
              Selecting "Unassigned" will remove any current assignment
            </p>
          )}
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
            {loading ? 'Assigning...' : 'Assign Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignJobForm;