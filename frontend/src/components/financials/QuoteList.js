import React, { useState, useEffect } from 'react';
import { Edit, FileText, Trash2, ArrowRight, FilePlus } from 'lucide-react';
import api from '../../utils/api';

const QuoteList = ({ onViewQuote, onCreateQuote, onConvertToInvoice }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/quotes');
      setQuotes(response.data.quotes || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to load quotes. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (id) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await api.delete(`/financial/quotes/${id}`);
        setQuotes(quotes.filter(quote => quote.id !== id));
      } catch (err) {
        console.error('Error deleting quote:', err);
        alert('Failed to delete quote. ' + (err.response?.data?.error || 'Please try again.'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
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

  const filteredQuotes = filter === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.status === filter);

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
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 rounded text-sm ${filter === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}
          >
            Draft
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1 rounded text-sm ${filter === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 rounded text-sm ${filter === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
          >
            Accepted
          </button>
        </div>
        <button
          onClick={onCreateQuote}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium flex items-center"
        >
          <FilePlus size={16} className="mr-1" />
          New Quote
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No quotes found
                </td>
              </tr>
            ) : (
              filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{quote.quote_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quote.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(quote.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(quote.valid_until)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(quote.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(quote.status)}`}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onViewQuote(quote.id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View quote"
                      >
                        <FileText size={18} />
                      </button>
                      {quote.status === 'accepted' && (
                        <button
                          onClick={() => onConvertToInvoice(quote)}
                          className="text-green-600 hover:text-green-900"
                          title="Convert to invoice"
                        >
                          <ArrowRight size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete quote"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuoteList;