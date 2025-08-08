import React, { useState } from 'react';
import api from '../../utils/api';

const PaymentForm = ({ invoice, onClose, onPaymentAdded }) => {
  const [formData, setFormData] = useState({
    amount: invoice.total_amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    
    if (!formData.payment_date) {
      setError('Please enter a payment date');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post(`/financial/invoices/${invoice.id}/payments`, formData);
      onPaymentAdded(response.data);
      onClose();
    } catch (err) {
      console.error('Error adding payment:', err);
      setError(err.response?.data?.error || 'Failed to add payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 2
    });
  };
  const paidAmount = invoice.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
  const remainingAmount = parseFloat(invoice.total_amount) - paidAmount;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Add Payment for Invoice {invoice.invoice_number}
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
            <span className="block text-sm font-medium text-gray-500">Customer:</span>
            <span className="block text-sm font-medium">{invoice.customer_name}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Invoice Total:</span>
            <span className="block text-sm font-medium">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Amount Paid:</span>
            <span className="block text-sm font-medium">{formatCurrency(paidAmount)}</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-500">Remaining Balance:</span>
            <span className="block text-sm font-medium text-green-600">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Amount *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              max={remainingAmount}
              step="0.01"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">NZD</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Date *
          </label>
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Method *
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            required
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reference Number
          </label>
          <input
            type="text"
            name="reference_number"
            value={formData.reference_number}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
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
            {loading ? 'Processing...' : 'Add Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;