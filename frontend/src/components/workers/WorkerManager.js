import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react'; // Add this import
import WorkersView from './WorkersView';
import WorkerDetail from './WorkerDetail';
import WorkerSchedule from './WorkerSchedule';
import WorkerMetrics from './WorkerMetrics';
import WorkerJobs from './WorkerJobs';
import WorkerTimeEntries from './WorkerTimeEntries';

const WorkerManager = () => {
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const handleBack = () => {
    setSelectedWorkerId(null);
    setActiveTab('details'); // Reset tab when going back
  };
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'time', label: 'Time Tracking' }
  ];

  return (
    <div className="space-y-4">
      {!selectedWorkerId ? (
        <WorkersView onSelectWorker={(id) => {
          setSelectedWorkerId(id);
          setActiveTab('details');
        }} />
      ) : (
        <div>
          <div className="flex justify-between items-center">
            <button 
              onClick={handleBack} 
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={18} className="mr-1" />
              Back to Workers
            </button>
          </div>
          
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-6">
            {activeTab === 'details' && <WorkerDetail workerId={selectedWorkerId} onBack={handleBack} />}
            {activeTab === 'schedule' && <WorkerSchedule workerId={selectedWorkerId} />}
            {activeTab === 'jobs' && <WorkerJobs workerId={selectedWorkerId} />}
            {activeTab === 'metrics' && <WorkerMetrics workerId={selectedWorkerId} />}
            {activeTab === 'time' && <WorkerTimeEntries workerId={selectedWorkerId} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManager;