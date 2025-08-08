import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Filter, 
  Play, 
  Square, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import api, { users, jobs } from '../../utils/api';

const WorkerTimeTracker = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeEntry, setActiveTimeEntry] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interval, setIntervalId] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  useEffect(() => {
    fetchUserAndTimeData();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filterDateRange]);
  
  const fetchUserAndTimeData = async () => {
    try {
      setLoading(true);
      const userResponse = await users.getCurrentUser();
      setCurrentUser(userResponse.data);
      const activeJobsResponse = await jobs.getJobs({
        assignedTo: userResponse.data.id,
        status: 'in_progress'
      });
      setActiveJobs(activeJobsResponse.data);
      const timeEntriesResponse = await api.get(`/users/${userResponse.data.id}/time-entries`, {
        params: {
          start_date: filterDateRange.startDate,
          end_date: filterDateRange.endDate
        }
      });
      setTimeEntries(timeEntriesResponse.data);
      const activeTimeEntryResponse = await api.get(`/users/${userResponse.data.id}/active-time-entry`);
      if (activeTimeEntryResponse.data) {
        const entry = activeTimeEntryResponse.data;
        setActiveTimeEntry(entry);
        const startTime = new Date(entry.start_time).getTime();
        const now = new Date().getTime();
        setTimeElapsed(Math.floor((now - startTime) / 1000));
        
        const id = setInterval(() => {
          setTimeElapsed(prev => prev + 1);
        }, 1000);
        
        setIntervalId(id);
      }
    } catch (error) {
      console.error('Error fetching time data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const startTimeEntry = async (jobId) => {
    try {
      const response = await api.post(`/jobs/${jobId}/time-entries`, {
        entry_type: 'work',
        start_time: new Date().toISOString()
      });
      
      setActiveTimeEntry(response.data);
      setTimeElapsed(0);
      
      const id = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      setIntervalId(id);
      fetchUserAndTimeData();
    } catch (error) {
      console.error('Error starting time entry:', error);
    }
  };
  
  const stopTimeEntry = async () => {
    try {
      if (!activeTimeEntry) return;
      
      await api.put(`/time-entries/${activeTimeEntry.id}`, {
        end_time: new Date().toISOString()
      });
      
      if (interval) {
        clearInterval(interval);
        setIntervalId(null);
      }
      
      setActiveTimeEntry(null);
      setTimeElapsed(0);
      fetchUserAndTimeData();
    } catch (error) {
      console.error('Error stopping time entry:', error);
    }
  };
  
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    let result = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (endTime) {
      const end = new Date(endTime);
      result += ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      result += ' - Now';
    }
    
    return result;
  };
  
  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 0;
    
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : new Date().getTime();
    
    return Math.floor((end - start) / 1000);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  const entriesByDate = timeEntries.reduce((groups, entry) => {
    const date = formatDate(entry.start_time);
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(entry);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {/* Active Timer Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Time Tracking</h2>
        
        {activeTimeEntry ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Currently tracking time for:</p>
                <p className="font-medium">{activeTimeEntry.job_title || 'Current Job'}</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold font-mono">
                  {formatElapsedTime(timeElapsed)}
                </div>
                <p className="text-xs text-gray-500">
                  Started at {new Date(activeTimeEntry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <button
                onClick={stopTimeEntry}
                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
              >
                <Square size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-3">Start tracking time for an active job:</p>
            
            {activeJobs.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Clock size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No active jobs to track time for</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeJobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.customer_name}</p>
                    </div>
                    
                    <button
                      onClick={() => startTimeEntry(job.id)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                    >
                      <Play size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Time Entries History */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Time Entry History</h2>
          
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2">
              <label htmlFor="startDate" className="text-sm">From:</label>
              <input
                type="date"
                id="startDate"
                value={filterDateRange.startDate}
                onChange={(e) => setFilterDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border rounded p-1 text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="endDate" className="text-sm">To:</label>
              <input
                type="date"
                id="endDate"
                value={filterDateRange.endDate}
                onChange={(e) => setFilterDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border rounded p-1 text-sm"
              />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : Object.keys(entriesByDate).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FileText size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No time entries found for the selected date range</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(entriesByDate)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
              .map(([date, entries]) => (
                <div key={date} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-3 font-medium">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-600" />
                      {date}
                      <span className="ml-2 text-sm text-gray-500">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="divide-y">
                    {entries.map(entry => (
                      <div key={entry.id} className="p-3 hover:bg-gray-50">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{entry.job_title}</p>
                            <p className="text-sm text-gray-500">
                              {formatTimeRange(entry.start_time, entry.end_time)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium">
                              {formatElapsedTime(calculateDuration(entry.start_time, entry.end_time))}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                            </p>
                          </div>
                        </div>
                        
                        {entry.notes && (
                          <p className="mt-2 text-sm text-gray-600 italic">
                            "{entry.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerTimeTracker;