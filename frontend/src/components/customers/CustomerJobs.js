import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const CustomerJobs = ({ customerId, customerName }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/customers/${customerId}/jobs`);
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching customer jobs:', err);
        setError('Failed to load jobs. Please try again.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, [customerId]);

  if (loading) return <div className="text-center py-4">Loading jobs...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Jobs for {customerName}</h3>
      </div>
      
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No jobs found for this customer</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    {job.description && <div className="text-xs text-gray-500 truncate max-w-xs">{job.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(job.scheduled_start).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(job.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.priority === 'high' || job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      job.priority === 'low' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {job.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerJobs;