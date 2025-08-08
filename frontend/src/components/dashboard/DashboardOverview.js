import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  FileText, 
  Check, 
  DollarSign, 
  Star 
} from 'lucide-react';
import api from '../../utils/api';

const DashboardOverview = () => {
  const [metrics, setMetrics] = useState({
    todaysJobs: { value: 0, loading: true, error: null, trend: null },
    activeWorkers: { value: 0, loading: true, error: null, trend: null },
    pendingInvoices: { value: 0, loading: true, error: null, trend: null },
    monthlyRevenue: { value: 0, loading: true, error: null, trend: null },
    completedJobs: { value: 0, loading: true, error: null, trend: null },
    customerSatisfaction: { value: 0, loading: true, error: null, trend: null }
  });

  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    
    fetchTodaysJobs();
    fetchCompletedJobs();
    
    fetchActiveWorkers();
    
    fetchPendingInvoices();
    fetchMonthlyRevenue();
    
    fetchCustomerSatisfaction();
    
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  };

  const fetchTodaysJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await api.get('/jobs');
      
      const todaysJobs = response.data.filter(job => 
        job.scheduled_start.includes(today) && 
        job.status !== 'cancelled' && 
        job.status !== 'completed'
      );
      
      setMetrics(prev => ({
        ...prev,
        todaysJobs: {
          value: todaysJobs.length,
          loading: false,
          error: null,
          trend: "+2"
        }
      }));
    } catch (error) {
      console.error('Error fetching today\'s jobs:', error);
      setMetrics(prev => ({
        ...prev,
        todaysJobs: {
          value: 0,
          loading: false,
          error: 'Failed to load data',
          trend: null
        }
      }));
    }
  };

  const fetchActiveWorkers = async () => {
    try {
      const response = await api.get('/workers');
      
      const activeWorkers = response.data.length;
      
      setMetrics(prev => ({
        ...prev,
        activeWorkers: {
          value: activeWorkers,
          loading: false,
          error: null,
          trend: "0" 
        }
      }));
    } catch (error) {
      console.error('Error fetching active workers:', error);
      setMetrics(prev => ({
        ...prev,
        activeWorkers: {
          value: 0,
          loading: false,
          error: 'Failed to load data',
          trend: null
        }
      }));
    }
  };

  const fetchPendingInvoices = async () => {
    try {
      const response = await api.get('/financial/invoices');
      
      const pendingInvoices = response.data.filter(
        invoice => invoice.payment_status === 'pending' || invoice.payment_status === 'overdue'
      );
      
      setMetrics(prev => ({
        ...prev,
        pendingInvoices: {
          value: pendingInvoices.length,
          loading: false,
          error: null,
          trend: "+3" 
        }
      }));
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      setMetrics(prev => ({
        ...prev,
        pendingInvoices: {
          value: 0,
          loading: false,
          error: 'Failed to load data',
          trend: null
        }
      }));
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const response = await api.get('/financial/invoices');
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyInvoices = response.data.filter(invoice => {
        const invoiceDate = new Date(invoice.created_at);
        return invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear &&
               invoice.payment_status === 'paid';
      });
      
      const totalRevenue = monthlyInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.total_amount), 
        0
      );
      
      setMetrics(prev => ({
        ...prev,
        monthlyRevenue: {
          value: totalRevenue.toFixed(2),
          loading: false,
          error: null,
          trend: "+15%"
        }
      }));
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      setMetrics(prev => ({
        ...prev,
        monthlyRevenue: {
          value: 0,
          loading: false,
          error: 'Failed to load data',
          trend: null
        }
      }));
    }
  };

  const fetchCompletedJobs = async () => {
    try {
      const response = await api.get('/jobs');
      
      const completedJobs = response.data.filter(job => job.status === 'completed');
      
      setMetrics(prev => ({
        ...prev,
        completedJobs: {
          value: completedJobs.length,
          loading: false,
          error: null,
          trend: "+5" 
        }
      }));
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
      setMetrics(prev => ({
        ...prev,
        completedJobs: {
          value: 0,
          loading: false,
          error: 'Failed to load data',
          trend: null
        }
      }));
    }
  };

  const fetchCustomerSatisfaction = async () => {
    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        customerSatisfaction: {
          value: "4.8/5",
          loading: false,
          error: null,
          trend: "+0.2"
        }
      }));
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Business Overview</h2>
        <button 
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center px-3 py-1.5 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <p className="text-sm text-gray-500">
        Last updated: {lastRefreshed.toLocaleTimeString()}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Today's Jobs"
          value={metrics.todaysJobs.value}
          trend={metrics.todaysJobs.trend}
          loading={metrics.todaysJobs.loading}
          error={metrics.todaysJobs.error}
          icon={<Clock size={20} />}
        />
        
        <MetricCard
          title="Active Workers"
          value={metrics.activeWorkers.value}
          trend={metrics.activeWorkers.trend}
          loading={metrics.activeWorkers.loading}
          error={metrics.activeWorkers.error}
          icon={<Users size={20} />}
        />
        
        <MetricCard
          title="Pending Invoices"
          value={metrics.pendingInvoices.value}
          trend={metrics.pendingInvoices.trend}
          loading={metrics.pendingInvoices.loading}
          error={metrics.pendingInvoices.error}
          icon={<FileText size={20} />}
        />
        
        <MetricCard
          title="Monthly Revenue"
          value={metrics.monthlyRevenue.value ? `$${metrics.monthlyRevenue.value}` : '$0'}
          trend={metrics.monthlyRevenue.trend}
          loading={metrics.monthlyRevenue.loading}
          error={metrics.monthlyRevenue.error}
          icon={<DollarSign size={20} />}
        />
        
        <MetricCard
          title="Completed Jobs"
          value={metrics.completedJobs.value}
          trend={metrics.completedJobs.trend}
          loading={metrics.completedJobs.loading}
          error={metrics.completedJobs.error}
          icon={<Check size={20} />}
        />
        
        <MetricCard
          title="Customer Satisfaction"
          value={metrics.customerSatisfaction.value}
          trend={metrics.customerSatisfaction.trend}
          loading={metrics.customerSatisfaction.loading}
          error={metrics.customerSatisfaction.error}
          icon={<Star size={20} />}
        />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, trend, loading, error, icon }) => {
  const getTrendDisplay = (trend) => {
    if (!trend) return null;
    
    const isPositive = trend.startsWith('+');
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon size={16} className="mr-1" />
        <span className="text-sm font-medium">{trend}</span>
      </div>
    );
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
      
      {loading ? (
        <div className="mt-4 flex items-center">
          <div className="h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mr-2"></div>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center text-red-600">
          <AlertCircle size={16} className="mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {getTrendDisplay(trend)}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;