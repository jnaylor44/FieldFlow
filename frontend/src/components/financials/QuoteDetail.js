import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Check, X } from 'lucide-react';
import api from '../../utils/api';

const QuoteDetail = ({ quoteId, onBack, onStatusChange, onConvertToInvoice }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/financial/quotes/${quoteId}`);
        setQuote(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError('Failed to load quote details. Please try again.');
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleStatusChange = async (status) => {
    try {
      const response = await api.put(`/financial/quotes/${quoteId}`, { status });
      setQuote({ ...quote, status: response.data.status });
      onStatusChange(response.data);
    } catch (err) {
      console.error('Error updating quote status:', err);
      alert('Failed to update quote status. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-8">Loading quote details...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!quote) return <div className="text-center py-8">Quote not found</div>;

  const isExpired = new Date(quote.valid_until) < new Date();

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Quotes
          </button>
          <div className="flex space-x-2">
            {quote.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('sent')}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Mark as Sent
              </button>
            )}
            {quote.status === 'sent' && !isExpired && (
              <>
                <button
                  onClick={() => handleStatusChange('accepted')}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Check size={16} className="mr-1" />
                  Mark as Accepted
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <X size={16} className="mr-1" />
                  Mark as Rejected
                </button>
              </>
            )}
            {quote.status === 'accepted' && (
              <button
                onClick={() => onConvertToInvoice(quote)}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Convert to Invoice
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Printer size={16} className="mr-1" />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="print:block hidden text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">QUOTE</h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Quote {quote.quote_number}</h2>
            <div className="text-sm text-gray-500">
              <div>Date: {formatDate(quote.created_at)}</div>
              <div className={isExpired ? 'text-red-600 font-medium' : 'text-gray-700'}>
                Valid Until: {formatDate(quote.valid_until)}
                {isExpired && ' (Expired)'}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                  quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  quote.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 mb-1">Your Business Name</div>
            <div className="text-sm text-gray-500">
              <div>123 Business Street</div>
              <div>Auckland, New Zealand</div>
              <div>info@yourbusiness.co.nz</div>
              <div>GST Number: 123-456-789</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Prepared For:</h3>
            <div className="text-sm text-gray-500">
              <div className="font-medium">{quote.customer_name}</div>
              <div>{quote.customer_email}</div>
            </div>
          </div>

          {quote.job && (
            <div className="mt-4 md:mt-0">
              <h3 className="text-sm font-medium text-gray-900 mb-1">Related Job:</h3>
              <div className="text-sm text-gray-500">
                <div>{quote.job.title}</div>
                <div>Date: {formatDate(quote.job.scheduled_start)}</div>
                <div>Status: {quote.job.status}</div>
              </div>
            </div>
          )}
        </div>

        {quote.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Description:</h3>
            <div className="text-sm text-gray-700 border p-3 rounded-md bg-gray-50">
              {quote.description}
            </div>
          </div>
        )}

        <div className="border rounded-md overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quote.items && quote.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td colSpan="3" className="px-6 py-4 text-right font-bold text-gray-900">Total:</td>
                <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(quote.amount)}</td>
              </tr>
              <tr>
                <td colSpan="4" className="px-6 py-4 text-sm text-gray-500">
                  <div className="font-medium">Note:</div>
                  <div>This quote includes materials and labor. GST will be added to the final invoice.</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <div className="mb-1 font-medium">Terms & Conditions:</div>
          <div className="mb-4">
            <div>1. This quote is valid until {formatDate(quote.valid_until)}.</div>
            <div>2. Work will commence upon acceptance of this quote.</div>
            <div>3. Payment terms will be specified on the invoice.</div>
            <div>4. Any additional work not specified in this quote will be quoted separately.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;