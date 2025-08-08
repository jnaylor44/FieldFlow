import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  User, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Trash,
  Send
} from 'lucide-react';
import api, { users, jobs } from '../../utils/api';
import Modal from '../jobs/JobModal';

const WorkerInvoicing = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    notes: ''
  });
  const [timeEntries, setTimeEntries] = useState([]);
  
  useEffect(() => {
    fetchUserAndJobData();
  }, []);
  
  const fetchUserAndJobData = async () => {
    try {
      setLoading(true);
      const userResponse = await users.getCurrentUser();
      setCurrentUser(userResponse.data);
      const completedJobsResponse = await jobs.getJobs({
        assignedTo: userResponse.data.id,
        status: 'completed'
      });
      const jobsWithoutInvoices = [];
      for (const job of completedJobsResponse.data) {
        const invoiceCheck = await api.get(`/jobs/${job.id}/invoices`);
        if (invoiceCheck.data.length === 0) {
          jobsWithoutInvoices.push(job);
        }
      }
      
      setCompletedJobs(jobsWithoutInvoices);
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTimeEntries = async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}/time-entries`);
      setTimeEntries(response.data);
      if (response.data.length > 0) {
        const totalSeconds = response.data.reduce((total, entry) => {
          if (!entry.end_time) return total;
          
          const start = new Date(entry.start_time).getTime();
          const end = new Date(entry.end_time).getTime();
          return total + Math.floor((end - start) / 1000);
        }, 0);
        
        const totalHours = Math.max(1, Math.ceil(totalSeconds / 3600));
        
        setInvoiceData({
          items: [
            { 
              description: `Labor for ${selectedJob.title}`, 
              quantity: totalHours, 
              unit_price: 75 // Default hourly rate
            }
          ],
          notes: 'Thank you for your business!'
        });
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };
  
  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setShowInvoiceModal(true);
    setInvoiceData({
      items: [{ description: '', quantity: 1, unit_price: 0 }],
      notes: ''
    });
    await fetchTimeEntries(job.id);
  };
  
  const handleInvoiceChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index][field] = value;
    setInvoiceData({ ...invoiceData, items: newItems });
  };
  
  const addInvoiceItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };
  
  const removeInvoiceItem = (index) => {
    const newItems = [...invoiceData.items];
    newItems.splice(index, 1);
    setInvoiceData({ ...invoiceData, items: newItems });
  };
  
  const calculateItemTotal = (item) => {
    return item.quantity * item.unit_price;
  };
  
  const calculateSubtotal = () => {
    return invoiceData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };
  
  const calculateTax = () => {
    return calculateSubtotal() * 0.15; // 15% GST for NZ
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(amount);
  };
  
  const handleCreateInvoice = async () => {
    try {
      if (!selectedJob) return;
      const formattedItems = invoiceData.items.map(item => ({
        ...item,
        amount: calculateItemTotal(item)
      }));
      
      const invoicePayload = {
        customer_id: selectedJob.customer_id,
        job_id: selectedJob.id,
        items: formattedItems,
        notes: invoiceData.notes,
        amount: calculateSubtotal(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      };
      
      await api.post('/invoices', invoicePayload);
      
      setShowInvoiceModal(false);
      fetchUserAndJobData(); // Refresh the job list
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    }
  };
  
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  const calculateEntryDuration = (entry) => {
    if (!entry.end_time) return 0;
    
    const start = new Date(entry.start_time).getTime();
    const end = new Date(entry.end_time).getTime();
    
    return Math.floor((end - start) / 1000);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Completed Jobs Ready for Invoicing</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : completedJobs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CheckCircle size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No completed jobs waiting to be invoiced</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedJobs.map(job => (
              <div 
                key={job.id} 
                className="border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleJobSelect(job)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{job.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="flex items-center">
                      <User size={14} className="mr-1 text-gray-500" />
                      <span className="truncate">{job.customer_name || 'No customer'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1 text-gray-500" />
                      <span>{formatDate(job.actual_end || job.scheduled_end)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobSelect(job);
                      }}
                      className="px-3 py-1 bg-primary-600 text-white rounded flex items-center text-sm"
                    >
                      <FileText size={14} className="mr-1" />
                      Create Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Invoice Modal */}
      <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}>
        {selectedJob && (
          <div className="p-4">
            <h2 className="text-xl font-medium mb-2">Create Invoice</h2>
            <p className="text-gray-600 mb-4">Job: {selectedJob.title} for {selectedJob.customer_name}</p>
            
            {timeEntries.length > 0 && (
              <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Time Entries</h3>
                
                <div className="space-y-2">
                  {timeEntries.map(entry => (
                    <div key={entry.id} className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-700">{new Date(entry.start_time).toLocaleDateString()}: </span>
                        <span className="text-gray-500">{entry.entry_type}</span>
                      </div>
                      <div className="font-medium">
                        {formatDuration(calculateEntryDuration(entry))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t flex justify-between font-medium">
                    <span>Total Time:</span>
                    <span>
                      {formatDuration(
                        timeEntries.reduce((total, entry) => total + calculateEntryDuration(entry), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Invoice Items</h3>
              
              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="flex space-x-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleInvoiceChange(index, 'description', e.target.value)}
                        className="w-full border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleInvoiceChange(index, 'quantity', parseFloat(e.target.value))}
                        className="w-full border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => handleInvoiceChange(index, 'unit_price', parseFloat(e.target.value))}
                        className="w-full border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div className="w-24 text-right py-2 text-sm font-medium">
                      {formatCurrency(calculateItemTotal(item))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeInvoiceItem(index)}
                      disabled={invoiceData.items.length <= 1}
                      className={`p-2 rounded ${
                        invoiceData.items.length <= 1 
                          ? 'text-gray-300' 
                          : 'text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addInvoiceItem}
                  className="text-primary-600 text-sm font-medium flex items-center hover:text-primary-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Item
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows="2"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                placeholder="Thank you for your business!"
                className="w-full border-gray-300 rounded-md text-sm"
              ></textarea>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between mb-1 text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              
              <div className="flex justify-between mb-1 text-sm">
                <span>GST (15%):</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              >
                <Send size={16} className="mr-2" />
                Create Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkerInvoicing;