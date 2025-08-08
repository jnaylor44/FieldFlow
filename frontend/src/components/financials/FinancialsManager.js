import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import Modal from '../jobs/JobModal';
import FinancialsOverview from './FinancialsOverview';
import InvoiceList from './InvoiceList';
import QuoteList from './QuoteList';
import InvoiceForm from './InvoiceForm';
import QuoteForm from './QuoteForm';
import PaymentForm from './PaymentForm';
import InvoiceDetail from './InvoiceDetail';
import QuoteDetail from './QuoteDetail';
import ConvertQuoteDialog from './ConvertQuoteDialog';

const FinancialsManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [viewingQuoteId, setViewingQuoteId] = useState(null);

  const handleInvoiceCreated = () => {
    setShowInvoiceForm(false);
    setActiveTab('invoices');
  };

  const handleQuoteCreated = () => {
    setShowQuoteForm(false);
    setActiveTab('quotes');
  };

  const handleAddPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const handlePaymentAdded = () => {
    setShowPaymentForm(false);
    if (viewingInvoiceId) {
    }
  };

  const handleViewInvoice = (invoiceId) => {
    setViewingInvoiceId(invoiceId);
    setActiveTab('invoiceDetail');
  };

  const handleViewQuote = (quoteId) => {
    setViewingQuoteId(quoteId);
    setActiveTab('quoteDetail');
  };

  const handleConvertToInvoice = (quote) => {
    setSelectedQuote(quote);
    setShowConvertDialog(true);
  };

  const handleConversionComplete = (invoice) => {
    setShowConvertDialog(false);
    setViewingInvoiceId(invoice.id);
    setActiveTab('invoiceDetail');
  };

  return (
    <div className="space-y-4">
      {activeTab === 'overview' || activeTab === 'invoices' || activeTab === 'quotes' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <FinancialsOverview />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceList 
              onViewInvoice={handleViewInvoice}
              onCreateInvoice={() => setShowInvoiceForm(true)}
              onAddPayment={handleAddPayment}
            />
          </TabsContent>

          <TabsContent value="quotes">
            <QuoteList 
              onViewQuote={handleViewQuote}
              onCreateQuote={() => setShowQuoteForm(true)}
              onConvertToInvoice={handleConvertToInvoice}
            />
          </TabsContent>
        </Tabs>
      ) : activeTab === 'invoiceDetail' ? (
        <InvoiceDetail 
          invoiceId={viewingInvoiceId}
          onBack={() => setActiveTab('invoices')}
          onAddPayment={handleAddPayment}
        />
      ) : activeTab === 'quoteDetail' ? (
        <QuoteDetail 
          quoteId={viewingQuoteId}
          onBack={() => setActiveTab('quotes')}
          onStatusChange={() => {}}
          onConvertToInvoice={handleConvertToInvoice}
        />
      ) : null}

      {/* Modals */}
      <Modal isOpen={showInvoiceForm} onClose={() => setShowInvoiceForm(false)}>
        <InvoiceForm 
          onClose={() => setShowInvoiceForm(false)} 
          onInvoiceCreated={handleInvoiceCreated} 
        />
      </Modal>

      <Modal isOpen={showQuoteForm} onClose={() => setShowQuoteForm(false)}>
        <QuoteForm 
          onClose={() => setShowQuoteForm(false)} 
          onQuoteCreated={handleQuoteCreated} 
        />
      </Modal>

      <Modal isOpen={showPaymentForm} onClose={() => setShowPaymentForm(false)}>
        <PaymentForm 
          invoice={selectedInvoice} 
          onClose={() => setShowPaymentForm(false)} 
          onPaymentAdded={handlePaymentAdded} 
        />
      </Modal>

      <Modal isOpen={showConvertDialog} onClose={() => setShowConvertDialog(false)}>
        <ConvertQuoteDialog 
          quote={selectedQuote} 
          onClose={() => setShowConvertDialog(false)} 
          onConversionComplete={handleConversionComplete} 
        />
      </Modal>
    </div>
  );
};

export default FinancialsManager;