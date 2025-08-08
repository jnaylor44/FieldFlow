import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  UserCog,
  Menu,
  X,
  LogOut,
  User,
  FileSpreadsheet
} from 'lucide-react';

import Modal from '../components/jobs/JobModal';
import CreateJobForm from '../components/jobs/CreateJobForm';
import JobsView from '../components/jobs/JobsView';
import CustomersView from '../components/customers/CustomersView';
import EditCustomerForm from '../components/customers/EditCustomerForm';
import CustomerJobs from '../components/customers/CustomerJobs';
import FinancialsManager from '../components/financials/FinancialsManager';
import WorkerManager from '../components/workers/WorkerManager';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import ReportTemplatesPage from '../pages/ReportTemplatesPage';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [showCustomerJobs, setShowCustomerJobs] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const navigation = [
    { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { name: 'Jobs', icon: Briefcase, id: 'jobs' },
    { name: 'Customers', icon: Users, id: 'customers' },
    { name: 'Financials', icon: FileText, id: 'financials' },
    { name: 'Workers', icon: UserCog, id: 'workers' },
    { name: 'Report Templates', icon: FileSpreadsheet, id: 'templates' },
  ];
  const DashboardContent = {
    overview: <DashboardOverview />,
    jobs: (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Job Management</h2>
          <button
            onClick={() => setShowCreateJobModal(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create New Job
          </button>
        </div>
        <JobsView />
        
        <Modal isOpen={showCreateJobModal} onClose={() => setShowCreateJobModal(false)}>
          <CreateJobForm 
            onClose={() => setShowCreateJobModal(false)}
            onJobCreated={(newJob) => {
              setShowCreateJobModal(false);
              if (window.location.pathname === '/jobs') {
                window.location.reload();
              }
            }}
          />
        </Modal>
      </div>
    ),
    customers: (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Customer Management</h2>
          <button
            onClick={() => {
              setCustomerToEdit(null);
              setShowEditCustomerModal(true);
            }}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add New Customer
          </button>
        </div>
        
        {!showCustomerJobs ? (
          <CustomersView 
            onEditCustomer={(customer) => {
              setCustomerToEdit(customer);
              setShowEditCustomerModal(true);
            }}
            onViewCustomerJobs={(customerId, customerName) => {
              setSelectedCustomerId(customerId);
              setSelectedCustomerName(customerName);
              setShowCustomerJobs(true);
            }}
          />
        ) : (
          <div>
            <button
              onClick={() => setShowCustomerJobs(false)}
              className="mb-4 px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              ← Back to Customers
            </button>
            <CustomerJobs 
              customerId={selectedCustomerId}
              customerName={selectedCustomerName}
            />
          </div>
        )}
    
        <Modal isOpen={showEditCustomerModal} onClose={() => setShowEditCustomerModal(false)}>
          <EditCustomerForm 
            customer={customerToEdit}
            onClose={() => setShowEditCustomerModal(false)}
            onCustomerSaved={(customer) => {
              setShowEditCustomerModal(false);
              if (showCustomerJobs) {
                setShowCustomerJobs(false);
              }
            }}
          />
        </Modal>
      </div>
    ),
    financials: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Financial Management</h2>
        <FinancialsManager />
      </div>
    ),
    workers: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Worker Management</h2>
        <WorkerManager />
      </div>
    ),
    templates: (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Template Management</h2>
        <ReportTemplatesPage />
      </div>
    ),
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-white shadow-lg transition-all duration-300 
        flex flex-col
      `}>
{/* Sidebar header - set explicit height */}
<div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
  <h1 className={`font-bold text-2xl ${!isSidebarOpen && 'hidden'}`}>
    FieldFlow
  </h1>
  <button 
    onClick={() => setSidebarOpen(!isSidebarOpen)}
    className="p-2 rounded-lg hover:bg-gray-100"
  >
    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
  </button>
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
              {isSidebarOpen && <span className="ml-3">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
      <header className="bg-white shadow-sm">
  <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200">
    <h1 className="text-2xl font-semibold text-gray-800">
      {navigation.find(item => item.id === activeSection)?.name}
    </h1>
    <div className="flex items-center space-x-4">
      <button className="flex items-center space-x-2 text-gray-700">
        <User size={20} />
        <span>Profile</span>
      </button>
    </div>
  </div>
</header>

        <main className="p-6">
          {DashboardContent[activeSection]}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;