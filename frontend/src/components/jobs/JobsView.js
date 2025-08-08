import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const JobsView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();  // Add this hook for navigation

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Starting jobs fetch...');

      const response = await api.get('/jobs');
      
      console.log('Jobs API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      setJobs(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        config: err.config
      });

      let errorMessage = 'Failed to fetch jobs';
      
      if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        window.location.href = '/login';
      } else if (err.response?.status === 404) {
        errorMessage = 'Jobs endpoint not found. Please check API configuration.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 mb-4">
          {error}
        </div>
        <div className="text-sm text-red-600 mb-4">
          Please check:
          <ul className="list-disc ml-4 mt-2">
            <li>Your API server is running (http://localhost:3000)</li>
            <li>You are logged in with valid credentials</li>
            <li>Your authentication token is valid</li>
          </ul>
        </div>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchJobs();
          }}
          className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'draft', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
              filter === status 
                ? 'bg-primary-100 text-primary-800 border-primary-200' 
                : 'bg-white hover:bg-gray-50'
            } border`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No jobs found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{job.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600 gap-2">
                  <User size={16} />
                  <span>{job.customer_name || 'No customer assigned'}</span>
                </div>

                <div className="flex items-center text-gray-600 gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(job.scheduled_start)}</span>
                </div>

                {job.location && (
                  <div className="flex items-center text-gray-600 gap-2">
                    <MapPin size={16} />
                    <span className="truncate">
                      {typeof job.location === 'string' && job.location.startsWith('[') 
                        ? JSON.parse(job.location)[0]?.address || 'Multiple locations'
                        : job.location}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className={getPriorityColor(job.priority)} />
                  <span className={`capitalize ${getPriorityColor(job.priority)}`}>
                    {job.priority} Priority
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock size={16} className="mr-1" />
                    {job.estimated_hours ? `${job.estimated_hours} hours` : 'No estimate'}
                  </div>
                  <button 
                    onClick={() => navigate(`/jobs/${job.id}`)} 
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsView;