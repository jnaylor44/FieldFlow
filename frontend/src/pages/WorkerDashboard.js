import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  LogOut, 
  User,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import api, { users, jobs } from '../utils/api';
import WorkerJobView from '../components/worker/WorkerJobView.js';
import WorkerTimeTracker from '../components/worker/WorkerTimeTracker';
import WorkerInvoicing from '../components/worker/WorkerInvoicing';

const WorkerDashboard = () => {
  const [activeSection, setActiveSection] = useState('jobs');
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState({
    inProgressJobs: 0,
    upcomingJobs: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await users.getCurrentUser();
      setCurrentUser(userResponse.data);
      const today = new Date().toISOString().split('T')[0];
      const [inProgressJobs, upcomingJobs, completedToday] = await Promise.all([
        jobs.getJobs({ status: 'in_progress', assignedTo: userResponse.data.id }),
        jobs.getJobs({ status: 'scheduled', assignedTo: userResponse.data.id }),
        jobs.getJobs({ status: 'completed', assignedTo: userResponse.data.id, fromDate: today })
      ]);
      
      setUserStats({
        inProgressJobs: inProgressJobs.data.length,
        upcomingJobs: upcomingJobs.data.length,
        completedToday: completedToday.data.length
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const navigation = [
    { name: 'My Jobs', icon: Briefcase, id: 'jobs' },
    { name: 'Time Tracking', icon: Clock, id: 'time' },
    { name: 'Invoicing', icon: FileText, id: 'invoices' },
  ];
  const DashboardContent = {
    jobs: <WorkerJobView />,
    time: <WorkerTimeTracker />,
    invoices: <WorkerInvoicing />
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 flex items-center justify-between border-b">
          <h1 className="font-bold text-xl">FieldFlow</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center p-3 rounded-lg
                ${activeSection === item.id ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'}
                transition-colors duration-200
              `}
            >
              <item.icon size={20} />
              <span className="ml-3">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              {navigation.find(item => item.id === activeSection)?.name}
            </h1>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <User size={20} />
                  <span>{currentUser.name}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {!loading && (
          <div className="p-6">
            {activeSection === 'jobs' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard 
                  title="Active Jobs" 
                  value={userStats.inProgressJobs} 
                  icon={Briefcase} 
                  color="blue"
                />
                <StatsCard 
                  title="Upcoming Jobs" 
                  value={userStats.upcomingJobs} 
                  icon={Calendar} 
                  color="purple"
                />
                <StatsCard 
                  title="Completed Today" 
                  value={userStats.completedToday} 
                  icon={CheckCircle} 
                  color="green"
                />
              </div>
            )}
            
            {DashboardContent[activeSection]}
          </div>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow flex items-center">
      <div className={`w-12 h-12 rounded-full ${colorMap[color]} flex items-center justify-center mr-4`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default WorkerDashboard;