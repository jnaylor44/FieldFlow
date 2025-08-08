import React from 'react';
import { Phone, Mail, Clock, Calendar } from 'lucide-react';

const WorkerCard = ({ worker, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
          {worker.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 className="font-medium">{worker.name}</h3>
          <div className="text-sm text-gray-500 flex items-center">
            <Clock size={14} className="mr-1" />
            {worker.jobsInProgress ? `${worker.jobsInProgress} jobs in progress` : 'No active jobs'}
          </div>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center text-gray-600">
          <Phone size={14} className="mr-1" />
          {worker.phone || 'No phone'}
        </div>
        <div className="flex items-center text-gray-600">
          <Mail size={14} className="mr-1" />
          {worker.email || 'No email'}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={14} className="mr-1" />
          Next job: {worker.nextJob || 'No upcoming jobs'}
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;