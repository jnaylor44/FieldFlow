import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import api from '../../utils/api';

const InvoiceForm = ({ onClose, onInvoiceCreated, editInvoice = null }) => {
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    job_id: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  });


  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {

    const fetchData = async () => {
      try {
        const customersResponse = await api.get('/customers');
        setCustomers(customersResponse.data);
        

        if (formData.customer_id) {
          const jobsResponse = await api.get(`/customers/${formData.customer_id}/jobs`);
          setJobs(jobsResponse.data);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load customers or jobs');
      }
    };
    
    fetchData();
    

    if (editInvoice) {

      const dueDate = new Date(editInvoice.due_date);
      const formattedDueDate = dueDate.toISOString().split('T')[0];
      
      setFormData({
        customer_id: editInvoice.customer_id,
        job_id: editInvoice.job_id || '',
        due_date: formattedDueDate,
        notes: editInvoice.metadata?.notes || '',
        items: editInvoice.items || [{ description: '', quantity: 1, unit_price: 0 }]
      });
    }
  }, [formData.customer_id, editInvoice]);


  useEffect(() => {
    let itemSubtotal = 0;
    formData.items.forEach(item => {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      itemSubtotal += isNaN(itemTotal) ? 0 : itemTotal;
    });
    
    const taxAmount = itemSubtotal * 0.15; 
    const totalAmount = itemSubtotal + taxAmount;
    
    setSubtotal(itemSubtotal);
    setTax(taxAmount);
    setTotal(totalAmount);
  }, [formData.items]);

  const handleCustomerChange = async (e) => {
    const customerId = e.target.value;
    setFormData({
      ...formData,
      customer_id: customerId,
      job_id: '' 
    });
    
    if (customerId) {
      try {
        const jobsResponse = await api.get(`/customers/${customerId}/jobs`);
        setJobs(jobsResponse.data);
      } catch (err) {
        console.error('Error loading jobs:', err);
      }
    } else {
      setJobs([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(field === 'quantity' ? value : updatedItems[index].quantity);
      const unitPrice = parseFloat(field === 'unit_price' ? value : updatedItems[index].unit_price);
      updatedItems[index].amount = (quantity * unitPrice).toFixed(2);
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        items: updatedItems
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      setError('Please select a customer');
      return;
    }
    
    if (!formData.due_date) {
      setError('Please set a due date');
      return;
    }
    
    const validItems = formData.items.filter(item => 
      item.description.trim() && item.quantity > 0 && item.unit_price > 0
    );
    
    if (validItems.length === 0) {
      setError('Please add at least one valid item with description, quantity and price');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        customer_id: formData.customer_id,
        job_id: formData.job_id || null,
        due_date: formData.due_date,
        notes: formData.notes,
        items: validItems
      };
      
      let response;
      
      if (editInvoice) {

        response = await api.put(`/financial/invoices/${editInvoice.id}`, payload);
      } else {
        response = await api.post('/financial/invoices', payload);
      }
      
      onInvoiceCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.response?.data?.error || 'Failed to create invoice. Please try again.');
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


  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);
  const defaultDueDateFormatted = defaultDueDate.toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {editInvoice ? 'Edit Invoice' : 'Create New Invoice'}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer *
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleCustomerChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Related Job (Optional)
            </label>
            <select
              name="job_id"
              value={formData.job_id}
              onChange={handleChange}
              disabled={!formData.customer_id || jobs.length === 0}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">None</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} ({new Date(job.scheduled_start).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Issue Date
            </label>
            <input
              type="date"
              value={today}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date *
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date || defaultDueDateFormatted}
              onChange={handleChange}
              min={today}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Line Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus size={16} className="mr-1" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => {
                  const itemTotal = item.quantity * item.unit_price;
                  
                  return (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          step="1"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          min="0"
                          step="0.01"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {isNaN(itemTotal) ? '$0.00' : formatCurrency(itemTotal)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length <= 1}
                          className={`text-red-600 hover:text-red-900 ${formData.items.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-sm text-right font-medium">Subtotal:</td>
                  <td className="px-4 py-2 text-sm font-medium">{formatCurrency(subtotal)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-sm text-right font-medium">GST (15%):</td>
                  <td className="px-4 py-2 text-sm font-medium">{formatCurrency(tax)}</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan="3" className="px-4 py-2 text-right font-bold">Total:</td>
                  <td className="px-4 py-2 font-bold">{formatCurrency(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
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
            {loading ? 'Saving...' : (editInvoice ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;