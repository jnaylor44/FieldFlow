import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import api from '../../utils/api';

const WorkerSchedule = ({ workerId }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedule();
  }, [workerId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workers/${workerId}/schedule`);
      setSchedule(response.data);
    } catch (error) {
      console.error('Error fetching worker schedule:', error);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };
  const groupedSchedule = schedule.reduce((groups, job) => {
    const date = new Date(job.scheduled_start).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(job);
    return groups;
  }, {});

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upcoming Schedule</h3>
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Upcoming Schedule</h3>
      
      {Object.keys(groupedSchedule).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No scheduled jobs for this worker
        </div>
      ) : (
        Object.entries(groupedSchedule).map(([date, jobs]) => (
          <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-100 p-3 font-medium flex items-center">
              <Calendar size={18} className="mr-2 text-gray-600" />
              {new Date(date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="divide-y">
              {jobs.map(job => (
                <div key={job.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{job.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(job.priority)}`}>
                      {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock size={14} className="mr-1" />
                      {formatTime(job.scheduled_start)} - {formatTime(job.scheduled_end)}
                    </div>
                    
                    {job.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin size={14} className="mr-1" />
                        {job.location}
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-600">
                      <User size={14} className="mr-1" />
                      {job.customer_name}
                      {job.customer_phone && ` • ${job.customer_phone}`}
                    </div>
                  </div>
                  
                  {job.description && (
                    <div className="mt-2 text-gray-600 text-sm">
                      {job.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default WorkerSchedule;