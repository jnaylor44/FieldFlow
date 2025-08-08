import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Edit,
  UserPlus,
  Play,
  Square,
  MessageCircle,
  Image,
  Camera
} from 'lucide-react';
import api from '../../utils/api';
import Modal from '../jobs/JobModal';
import EditJobForm from './EditJobForm';
import AssignJobForm from './AssignJobForm';

import ReportList from '../reports/ReportList';
import ReportGenerator from '../reports/ReportGenerator';
import ReportView from '../reports/ReportView';


const JobDetailView = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'photos', 'notes', 'reports'

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details');
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

  const handleStartJob = async () => {
    try {
      setStatusAction('starting');
      await api.post(`/jobs/${jobId}/start`);
      await fetchJobDetails(); // Refresh job data
      setStatusAction(null);
    } catch (err) {
      console.error('Error starting job:', err);
      setError('Failed to start job');
      setStatusAction(null);
    }
  };

  const handleCompleteJob = async () => {
    try {
      setStatusAction('completing');
      await api.post(`/jobs/${jobId}/complete`);
      await fetchJobDetails(); // Refresh job data
      setStatusAction(null);
    } catch (err) {
      console.error('Error completing job:', err);
      setError('Failed to complete job');
      setStatusAction(null);
    }
  };

  const handleJobUpdated = (updatedJob) => {
    setJob({ ...job, ...updatedJob });
  };

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
        <div className="text-red-800 mb-4">{error}</div>
        <button 
          onClick={fetchJobDetails}
          className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!job) {
    return <div>No job data found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-600">Job #{job.id.substring(0, 8)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
          {job.status}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {job.status === 'scheduled' && (
          <button
            onClick={handleStartJob}
            disabled={statusAction === 'starting'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {statusAction === 'starting' ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Starting...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Start Job
              </>
            )}
          </button>
        )}
        
        {job.status === 'in_progress' && (
          <button
            onClick={handleCompleteJob}
            disabled={statusAction === 'completing'}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {statusAction === 'completing' ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Completing...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Complete Job
              </>
            )}
          </button>
        )}
        
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus size={16} className="mr-2" />
          {job.assigned_user_id ? 'Reassign' : 'Assign'}
        </button>


        
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          <Edit size={16} className="mr-2" />
          Edit Job
        </button>
      </div>
      {/* Tab Navigation */}

{/* Tab Navigation */}
<div className="border-b border-gray-200 mt-6">
  <nav className="flex space-x-8">
    <button
      className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
      onClick={() => setActiveTab('details')}
    >
      Details
    </button>
    <button
      className={`px-4 py-2 text-sm font-medium ${activeTab === 'photos' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
      onClick={() => setActiveTab('photos')}
    >
      Photos
    </button>
    <button
      className={`px-4 py-2 text-sm font-medium ${activeTab === 'notes' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
      onClick={() => setActiveTab('notes')}
    >
      Notes
    </button>
    <button
      className={`px-4 py-2 text-sm font-medium ${activeTab === 'reports' ? 'border-b-2 border-primary-500 text-primary-700' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
      onClick={() => setActiveTab('reports')}
    >
      Reports
    </button>
  </nav>
</div>

{/* Tab Content */}
<div className="mt-6">
  {activeTab === 'details' && (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Job Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Job Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Job Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center text-gray-700 gap-2">
                <User size={18} />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{job.customer_name}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700 gap-2">
                <Calendar size={18} />
                <div>
                  <p className="text-sm text-gray-500">Scheduled Time</p>
                  <p className="font-medium">{formatDate(job.scheduled_start)} - {formatDate(job.scheduled_end)}</p>
                </div>
              </div>

              {job.locations && job.locations.length > 0 ? (
                <div className="flex items-start text-gray-700 gap-2">
                  <MapPin size={18} className="mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Locations</p>
                    {job.locations.map((loc, index) => (
                      <div key={index} className="mb-2 p-2 bg-gray-50 rounded-md">
                        <p className="font-medium">Location {index + 1}: {loc.address}</p>
                        {loc.details && <p className="text-sm text-gray-600 mt-1">{loc.details}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : job.location ? (
                <div className="flex items-center text-gray-700 gap-2">
                  <MapPin size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{typeof job.location === 'string' ? job.location : JSON.stringify(job.location)}</p>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-700 gap-2">
                <AlertCircle size={18} className={getPriorityColor(job.priority)} />
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className={`font-medium capitalize ${getPriorityColor(job.priority)}`}>{job.priority}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700 gap-2">
                <User size={18} />
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <div className="flex items-center">
                    <p className="font-medium mr-2">{job.assigned_user_name || 'Unassigned'}</p>
                    <button 
                      onClick={() => setShowAssignModal(true)} 
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700 gap-2">
                <Clock size={18} />
                <div>
                  <p className="text-sm text-gray-500">Estimated Hours</p>
                  <p className="font-medium">{job.estimated_hours || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {job.description && (
            <div className="mt-6">
              <h3 className="text-sm text-gray-500 mb-2">Description</h3>
              <p className="text-gray-700">{job.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="space-y-6">
        {/* Time Tracking */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Time Tracking</h2>
          
          {job.timeEntries && job.timeEntries.length > 0 ? (
            <div className="space-y-3">
              {job.timeEntries.map(entry => (
                <div key={entry.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium capitalize">{entry.entry_type}</p>
                    <p className="text-gray-500">{entry.user_name}</p>
                  </div>
                  <div className="text-right">
                    <p>{new Date(entry.start_time).toLocaleTimeString()}</p>
                    {entry.end_time && (
                      <p className="text-gray-500">
                        to {new Date(entry.end_time).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No time entries recorded</p>
          )}
          
          {job.status === 'in_progress' && (
            <button className="mt-4 w-full flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
              <Clock size={16} className="mr-2" />
              Record Time Entry
            </button>
          )}
        </div>
        
        {/* Status History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Status Updates</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Job created</p>
                <p className="text-xs text-gray-500">{formatDate(job.created_at)}</p>
              </div>
            </div>
            
            {job.actual_start && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <CheckCircle size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Job started</p>
                  <p className="text-xs text-gray-500">{formatDate(job.actual_start)}</p>
                </div>
              </div>
            )}
            
            {job.actual_end && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <CheckCircle size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Job completed</p>
                  <p className="text-xs text-gray-500">{formatDate(job.actual_end)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  {activeTab === 'photos' && (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Photos</h2>
        <button className="flex items-center text-primary-600 text-sm font-medium">
          <Camera size={16} className="mr-1" />
          Upload Photo
        </button>
      </div>
      
      {job.photos && job.photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {job.photos.map(photo => (
            <div key={photo.id} className="relative rounded-lg overflow-hidden group">
              <img 
                src={photo.photo_url} 
                alt={photo.caption || 'Job photo'} 
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <p className="text-white text-sm truncate">{photo.caption || 'No caption'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Image size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No photos uploaded yet</p>
        </div>
      )}
    </div>
  )}

  {activeTab === 'notes' && (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Notes</h2>
        <button className="flex items-center text-primary-600 text-sm font-medium">
          <MessageCircle size={16} className="mr-1" />
          Add Note
        </button>
      </div>
      
      {job.notes && job.notes.length > 0 ? (
        <div className="space-y-4">
          {job.notes.map(note => (
            <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <p className="text-sm font-medium">{note.user_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 text-gray-700">{note.note}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <MessageCircle size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No notes added yet</p>
        </div>
      )}
    </div>
  )}

  {activeTab === 'reports' && (
    <div className="py-4">
      {selectedReportId ? (
        <ReportView 
          reportId={selectedReportId} 
          onBack={() => setSelectedReportId(null)} 
        />
      ) : showReportForm ? (
        <ReportGenerator
          jobId={jobId}
          customerId={job?.customer_id}
          onComplete={() => {
            setShowReportForm(false);
          }}
          onCancel={() => setShowReportForm(false)}
        />
      ) : (
        <ReportList
          jobId={jobId}
          onView={(reportId) => setSelectedReportId(reportId)}
          onNew={() => setShowReportForm(true)}
        />
      )}
    </div>
  )}
</div>

      {/* Modals */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <EditJobForm 
          job={job}
          onClose={() => setShowEditModal(false)}
          onJobUpdated={handleJobUpdated}
        />
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <AssignJobForm 
          job={job}
          onClose={() => setShowAssignModal(false)}
          onJobAssigned={handleJobUpdated}
        />
      </Modal>
    </div>
  );
};

export default JobDetailView;