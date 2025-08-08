import React, { useState } from 'react';
import api from '../../utils/api';

const ConvertQuoteDialog = ({ quote, onClose, onConversionComplete }) => {
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dueDate) {
      setError('Please select a due date for the invoice');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post(`/financial/quotes/${quote.id}/convert`, { due_date: dueDate });
      onConversionComplete(response.data.invoice);
    } catch (err) {
      console.error('Error converting quote to invoice:', err);
      setError(err.response?.data?.error || 'Failed to convert quote to invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Convert Quote to Invoice
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 bg-gray-50 p-4 rounded-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-sm font-medium text-gray-500">Quote Number:</span>
            <span className="block text-sm font-medium">{quote.quote_number}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Customer:</span>
            <span className="block text-sm font-medium">{quote.customer_name}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Amount:</span>
            <span className="block text-sm font-medium">
              {parseFloat(quote.amount).toLocaleString('en-NZ', {
                style: 'currency',
                currency: 'NZD'
              })}
            </span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Status:</span>
            <span className="block text-sm font-medium">{quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice Due Date *
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={today}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            This is the date by which the customer must pay the invoice.
          </p>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-4">
            Converting this quote will create a new invoice with all the same line items.
            The invoice will include GST (15%) and will be marked as pending payment.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? 'Converting...' : 'Convert to Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConvertQuoteDialog;