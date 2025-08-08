import React, { useState, useEffect } from 'react';
import { Clock, BarChart2, Calendar, CheckCircle, Activity } from 'lucide-react';
import api from '../../utils/api';

const WorkerMetrics = ({ workerId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, [workerId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/workers/${workerId}/metrics`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching worker metrics:', error);
      setError('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Performance Metrics</h3>
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDecimal = (value) => {
    return parseFloat(value).toFixed(1);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard 
          title="Job Completion Rate" 
          value={formatPercentage(metrics.completion_rate)}
          icon={CheckCircle}
          description={`${metrics.completed_jobs} completed out of ${metrics.total_jobs} total jobs`} 
        />
        
        <MetricCard 
          title="Average Time Per Job" 
          value={`${formatDecimal(metrics.avg_hours_per_job)} hours`}
          icon={Clock}
          description="Average time spent on jobs" 
        />
        
        <MetricCard 
          title="Total Hours Worked" 
          value={`${formatDecimal(metrics.total_hours)} hours`}
          icon={Activity}
          description="Total time spent on jobs" 
        />
        
        <MetricCard 
          title="Jobs Completed Per Day" 
          value={formatDecimal(metrics.avg_jobs_per_day)}
          icon={Calendar}
          description="Average jobs completed per working day" 
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium mb-4 flex items-center">
          <BarChart2 size={18} className="mr-2" />
          Performance Overview
        </h4>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completion Rate</span>
              <span className="font-medium">{formatPercentage(metrics.completion_rate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ width: formatPercentage(metrics.completion_rate) }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Avg. Jobs Per Day (vs. Target 3.0)</span>
              <span className="font-medium">{formatDecimal(metrics.avg_jobs_per_day)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (metrics.avg_jobs_per_day / 3) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          {/* If we had more metrics, we could add them here */}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm text-gray-600">{title}</h4>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
        <Icon size={20} />
      </div>
    </div>
    {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
  </div>
);

export default WorkerMetrics;