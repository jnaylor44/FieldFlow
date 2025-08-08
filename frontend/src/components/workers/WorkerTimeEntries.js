import React, { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, FileText, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

const WorkerTimeEntries = ({ workerId }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    job_id: '',
    entry_type: 'work',
    start_time: '',
    end_time: '',
    notes: ''
  });
  const [jobs, setJobs] = useState([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchTimeEntries();
  }, [workerId, dateFilter]);

  useEffect(() => {
    if (showAddForm) {
      fetchWorkerJobs();
    }
  }, [showAddForm]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFilter.start_date) params.append('start_date', dateFilter.start_date);
      if (dateFilter.end_date) params.append('end_date', dateFilter.end_date);
      
      const response = await api.get(`/workers/${workerId}/time-entries?${params.toString()}`);
      setTimeEntries(response.data);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      setError('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerJobs = async () => {
    try {
      setFetchingJobs(true);
      const response = await api.get(`/workers/${workerId}/jobs?status=in_progress,scheduled`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching worker jobs:', error);
    } finally {
      setFetchingJobs(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post(`/workers/${workerId}/time-entries`, formData);
      setShowAddForm(false);
      setFormData({
        job_id: '',
        entry_type: 'work',
        start_time: '',
        end_time: '',
        notes: ''
      });
      fetchTimeEntries();
    } catch (error) {
      console.error('Error adding time entry:', error);
      setError('Failed to add time entry');
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'In progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Time Tracking</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 bg-primary-600 text-white rounded-md flex items-center text-sm"
          >
            {showAddForm ? (
              <>
                <Calendar size={16} className="mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} className="mr-1" />
                Add Time Entry
              </>
            )}
          </button>
        </div>
      </div>
      
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-medium mb-4">Add New Time Entry</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
                <select
                  name="job_id"
                  value={formData.job_id}
                  onChange={handleInputChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  disabled={fetchingJobs}
                >
                  <option value="">Select a job</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                <select
                  name="entry_type"
                  value={formData.entry_type}
                  onChange={handleInputChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="work">Work</option>
                  <option value="travel">Travel</option>
                  <option value="break">Break</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Time Entry
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Filter Time Entries</h4>
          
          <button
            onClick={() => {
              setDateFilter({ start_date: '', end_date: '' });
            }}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Clear Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.start_date}
              onChange={(e) => setDateFilter({ ...dateFilter, start_date: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.end_date}
              onChange={(e) => setDateFilter({ ...dateFilter, end_date: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : timeEntries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 flex flex-col items-center">
          <Clock size={40} className="text-gray-400 mb-2" />
          <p>No time entries found for the selected period</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.job_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        entry.entry_type === 'work' ? 'bg-blue-100 text-blue-800' :
                        entry.entry_type === 'travel' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(entry.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.end_time ? formatDateTime(entry.end_time) : 'Not ended'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(entry.start_time, entry.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.notes ? (
                        <div className="flex items-center">
                          <FileText size={14} className="mr-1" />
                          {entry.notes.length > 30 ? entry.notes.substring(0, 30) + '...' : entry.notes}
                        </div>
                      ) : (
                        'No notes'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerTimeEntries;