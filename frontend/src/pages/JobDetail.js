import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import JobDetailView from '../components/jobs/JobDetailView';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-100 overflow-auto">
      <header className="bg-white shadow-sm">
        <div className="flex items-center px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <div className="flex items-center">
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </div>
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Job Details</h1>
        </div>
      </header>

      <main className="p-6">
        <JobDetailView jobId={jobId} />
      </main>
    </div>
  );
};

export default JobDetail;