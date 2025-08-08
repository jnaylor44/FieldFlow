import React, { useState, useEffect } from 'react';
import { Edit, FileText, Trash2, DollarSign, FilePlus } from 'lucide-react';
import api from '../../utils/api';

const InvoiceList = ({ onViewInvoice, onCreateInvoice, onAddPayment }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/invoices');
      setInvoices(response.data.invoices || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/financial/invoices/${id}`);
        setInvoices(invoices.filter(invoice => invoice.id !== id));
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('Failed to delete invoice. ' + (err.response?.data?.error || 'Please try again.'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    });
  };
  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(invoice => {
        if (filter === 'overdue') {
          return invoice.payment_status !== 'paid' && new Date(invoice.due_date) < new Date();
        }
        return invoice.payment_status === filter;
      });

      if (loading) {
        return (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        );
      }
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('partial')}
            className={`px-3 py-1 rounded text-sm ${filter === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
          >
            Partial
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded text-sm ${filter === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1 rounded text-sm ${filter === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}
          >
            Overdue
          </button>
        </div>
        <button
          onClick={onCreateInvoice}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium flex items-center"
        >
          <FilePlus size={16} className="mr-1" />
          New Invoice
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const isOverdue = invoice.payment_status !== 'paid' && new Date(invoice.due_date) < new Date();
                const status = isOverdue ? 'overdue' : invoice.payment_status;
                
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(invoice.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(invoice.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => onViewInvoice(invoice.id)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View invoice"
                        >
                          <FileText size={18} />
                        </button>
                        {(invoice.payment_status !== 'paid') && (
                          <button
                            onClick={() => onAddPayment(invoice)}
                            className="text-green-600 hover:text-green-900"
                            title="Add payment"
                          >
                            <DollarSign size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete invoice"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;