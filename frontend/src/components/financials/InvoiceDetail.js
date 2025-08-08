import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowLeft, Printer } from 'lucide-react';
import api from '../../utils/api';

const InvoiceDetail = ({ invoiceId, onBack, onAddPayment }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/financial/invoices/${invoiceId}`);
        setInvoice(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice details. Please try again.');
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-8">Loading invoice details...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!invoice) return <div className="text-center py-8">Invoice not found</div>;

  const isOverdue = invoice.payment_status !== 'paid' && new Date(invoice.due_date) < new Date();
  const dueDateClass = isOverdue ? 'text-red-600 font-medium' : 'text-gray-700';

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Invoices
          </button>
          <div className="flex space-x-2">
            {invoice.payment_status !== 'paid' && (
              <button
                onClick={() => onAddPayment(invoice)}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <DollarSign size={16} className="mr-1" />
                Record Payment
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
          <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Invoice {invoice.invoice_number}</h2>
            <div className="text-sm text-gray-500">
              <div>Created: {formatDate(invoice.created_at)}</div>
              <div className={dueDateClass}>Due: {formatDate(invoice.due_date)}</div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isOverdue ? 'bg-red-100 text-red-800' :
                  invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.payment_status === 'partial' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {isOverdue ? 'Overdue' : invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
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
            <h3 className="text-sm font-medium text-gray-900 mb-1">Bill To:</h3>
            <div className="text-sm text-gray-500">
              <div className="font-medium">{invoice.customer_name}</div>
              <div>{invoice.customer_email}</div>
            </div>
          </div>

          {invoice.job && (
            <div className="mt-4 md:mt-0">
              <h3 className="text-sm font-medium text-gray-900 mb-1">Related Job:</h3>
              <div className="text-sm text-gray-500">
                <div>{invoice.job.title}</div>
                <div>Date: {formatDate(invoice.job.scheduled_start)}</div>
                <div>Status: {invoice.job.status}</div>
              </div>
            </div>
          )}
        </div>

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
              {invoice.items && invoice.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan="3" className="px-6 py-4 text-sm text-right font-medium text-gray-500">Subtotal:</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(invoice.amount)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td colSpan="3" className="px-6 py-4 text-sm text-right font-medium text-gray-500">GST (15%):</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(invoice.tax_amount)}</td>
              </tr>
              <tr className="bg-gray-100">
                <td colSpan="3" className="px-6 py-4 text-right font-bold text-gray-900">Total:</td>
                <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment History</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(payment.payment_date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.payment_method?.replace('_', ' ') || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.reference_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan="1" className="px-6 py-4 text-sm text-right font-medium text-gray-500">Total Paid:</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(invoice.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0))}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="1" className="px-6 py-4 text-sm text-right font-medium text-gray-500">Balance Due:</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(
                        parseFloat(invoice.total_amount) - 
                        invoice.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
                      )}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {invoice.metadata?.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Notes:</h3>
            <div className="text-sm text-gray-500 border p-3 rounded-md bg-gray-50">
              {invoice.metadata.notes}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <div className="mb-1 font-medium">Payment Terms:</div>
          <div className="mb-4">
            Payment is due within {new Date(invoice.due_date).getDate() - new Date(invoice.created_at).getDate()} days of invoice date.
          </div>
          <div className="mb-1 font-medium">Payment Details:</div>
          <div>
            <div>Bank: Sample Bank</div>
            <div>Account Name: Your Business Ltd</div>
            <div>Account Number: 01-2345-6789012-00</div>
            <div>Reference: {invoice.invoice_number}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;