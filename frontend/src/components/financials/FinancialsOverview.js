import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const FinancialsOverview = () => {
  const [financialData, setFinancialData] = useState({
    invoices: { total: 0, paid: 0, overdue: 0, pending: 0 },
    quotes: { total: 0, pending: 0, accepted: 0 },
    monthlyRevenue: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {

        const invoiceResponse = await api.get('/financial/invoices', {
          params: { limit: 1000 }
        });
        

        const quoteResponse = await api.get('/financial/quotes', {
          params: { limit: 1000 }
        });
        

        const invoices = invoiceResponse.data.invoices || [];
        const quotes = quoteResponse.data.quotes || [];
        

        const invoiceTotals = {
          total: invoices.length,
          paid: invoices.filter(inv => inv.payment_status === 'paid').length,
          overdue: invoices.filter(inv => 
            inv.payment_status !== 'paid' && 
            new Date(inv.due_date) < new Date()
          ).length,
          pending: invoices.filter(inv => 
            inv.payment_status === 'pending' || inv.payment_status === 'partial'
          ).length
        };

        const quoteTotals = {
          total: quotes.length,
          pending: quotes.filter(q => q.status === 'draft' || q.status === 'sent').length,
          accepted: quotes.filter(q => q.status === 'accepted').length
        };
        

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        

        const months = {};
        for (let i = 0; i <= 6; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          months[monthKey] = {
            name: d.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
            revenue: 0,
            invoices: 0
          };
        }
        

        invoices.forEach(invoice => {
          if (invoice.payment_status === 'paid' || invoice.payment_status === 'partial') {
            const date = new Date(invoice.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (months[monthKey]) {
              months[monthKey].revenue += parseFloat(invoice.total_amount);
              months[monthKey].invoices += 1;
            }
          }
        });

        const monthlyRevenue = Object.values(months).reverse();
        
        setFinancialData({
          invoices: invoiceTotals,
          quotes: quoteTotals,
          monthlyRevenue,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching financial overview:', error);
        setFinancialData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load financial data'
        }));
      }
    };
    
    fetchData();
  }, []);

  if (financialData.loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }
  
  if (financialData.error) {
    return <div className="text-center py-8 text-red-500">{financialData.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{financialData.invoices.total}</div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{financialData.invoices.paid}</div>
              <div className="text-sm text-gray-500">Paid</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{financialData.invoices.overdue}</div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{financialData.invoices.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{financialData.quotes.total}</div>
              <div className="text-sm text-gray-500">Total Quotes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{financialData.quotes.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{financialData.quotes.accepted}</div>
              <div className="text-sm text-gray-500">Accepted</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={financialData.monthlyRevenue}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue ($)" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FinancialsOverview;