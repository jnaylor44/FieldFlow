import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  ChevronDown,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import api, { jobs, users } from '../../utils/api';
import Modal from '../jobs/JobModal';

const WorkerJobView = () => {
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [timeEntryActive, setTimeEntryActive] = useState(false);
  const [activeTimeEntry, setActiveTimeEntry] = useState(null);

  useEffect(() => {
    fetchUserAndJobs();
  }, [filterStatus]);

  const fetchUserAndJobs = async () => {
    try {
      setLoading(true);
      const userResponse = await users.getCurrentUser();
      setCurrentUser(userResponse.data);
      let statusFilter = {};
      if (filterStatus !== 'all') {
        statusFilter.status = filterStatus;
      }
      
      const jobsResponse = await jobs.getJobs({
        ...statusFilter,
        assignedTo: userResponse.data.id
      });
      
      setJobList(jobsResponse.data);
      const activeTimeEntryCheck = await api.get(`/users/${userResponse.data.id}/active-time-entry`);
      if (activeTimeEntryCheck.data) {
        setTimeEntryActive(true);
        setActiveTimeEntry(activeTimeEntryCheck.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await jobs.updateJobStatus(jobId, newStatus);
      fetchUserAndJobs(); // Refresh job list
      
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({
          ...selectedJob,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };
  
  const handleStartTimeEntry = async (jobId) => {
    try {
      const response = await api.post(`/jobs/${jobId}/time-entries`, {
        entry_type: 'work',
        start_time: new Date().toISOString(),
      });
      
      setTimeEntryActive(true);
      setActiveTimeEntry(response.data);
    } catch (error) {
      console.error('Error starting time entry:', error);
    }
  };
  
  const handleEndTimeEntry = async () => {
    try {
      await api.put(`/time-entries/${activeTimeEntry.id}`, {
        end_time: new Date().toISOString()
      });
      
      setTimeEntryActive(false);
      setActiveTimeEntry(null);
    } catch (error) {
      console.error('Error ending time entry:', error);
    }
  };

  const filteredJobs = jobList.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search jobs..."
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter size={18} className="text-gray-500 mr-2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">All Jobs</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {timeEntryActive && activeTimeEntry && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-sm">
              <Clock size={16} className="mr-1" />
              <span className="mr-2">Time tracking active</span>
              <button 
                onClick={handleEndTimeEntry}
                className="bg-yellow-200 hover:bg-yellow-300 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No jobs found</p>
          <p className="text-sm">There are no jobs assigned to you matching the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map(job => (
            <div 
              key={job.id} 
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedJob(job);
                setShowJobDetail(true);
              }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{job.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(job.status)}`}>
                    {job.status === 'in_progress' ? 'In Progress' : 
                     job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                  {job.description ? (
                    <p className="line-clamp-2">{job.description}</p>
                  ) : (
                    <p className="italic">No description</p>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar size={14} className="mr-1" />
                      {formatDate(job.scheduled_start)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock size={14} className="mr-1" />
                      {formatTime(job.scheduled_start)}
                    </div>
                  </div>
                  
                  {job.location && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <MapPin size={14} className="mr-1" />
                      {job.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Job Detail Modal */}
      <Modal isOpen={showJobDetail} onClose={() => setShowJobDetail(false)}>
        {selectedJob && (
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-medium">{selectedJob.title}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(selectedJob.status)}`}>
                {selectedJob.status === 'in_progress' ? 'In Progress' : 
                 selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
              </span>
            </div>
            
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedJob.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Schedule</h3>
                  <div className="mt-1 flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span>{formatDate(selectedJob.scheduled_start)}</span>
                  </div>
                  <div className="mt-1 flex items-center">
                    <Clock size={16} className="text-gray-400 mr-2" />
                    <span>{formatTime(selectedJob.scheduled_start)} - {formatTime(selectedJob.scheduled_end)}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <div className="mt-1 flex items-center">
                    <MapPin size={16} className="text-gray-400 mr-2" />
                    <span>{selectedJob.location || 'No location specified'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                {selectedJob.customer_name ? (
                  <div className="mt-1">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span>{selectedJob.customer_name}</span>
                    </div>
                    {selectedJob.customer_phone && (
                      <div className="mt-1 flex items-center">
                        <Phone size={16} className="text-gray-400 mr-2" />
                        <a href={`tel:${selectedJob.customer_phone}`} className="text-primary-600">
                          {selectedJob.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No customer information</p>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Job Actions</h3>
                  </div>
                  
                  <div className="flex space-x-2">
                    {selectedJob.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(selectedJob.id, 'in_progress')}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                      >
                        Start Job
                      </button>
                    )}
                    
                    {selectedJob.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedJob.id, 'completed')}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
                        >
                          Mark Complete
                        </button>
                        
                        {!timeEntryActive ? (
                          <button
                            onClick={() => handleStartTimeEntry(selectedJob.id)}
                            className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-200"
                          >
                            Start Timer
                          </button>
                        ) : (
                          <button
                            onClick={handleEndTimeEntry}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                          >
                            Stop Timer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkerJobView;