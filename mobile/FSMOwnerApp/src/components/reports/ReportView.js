import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  ArrowLeft,
  Mail,
  Download,
  Check,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react-native';
import reports from '../../api/report';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ReportView = ({ reportId, onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      if (!reportId) {
        setError('No report ID provided');
        setLoading(false);
        return;
      }
      setLoading(true);
      const response = await reports.getReport(reportId);
      setReport(response.data);
      if (response.data?.customer_email || 
         (response.data?.report_content?.customer?.email)) {
        const customerEmail = response.data.customer_email || 
                             response.data.report_content.customer.email;
        const customerName = response.data.customer_name || 
                            response.data.report_content.customer.name || 'Customer';
        
        setEmailData({
          email: customerEmail,
          subject: `Report: ${response.data.report_number}`,
          message: `Dear ${customerName},\n\nPlease find attached report ${response.data.report_number}.\n\nThank you,`
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!emailData.email) {
      Alert.alert('Error', 'Please provide an email address');
      return;
    }
  
    try {
      setSending(true); // Show loading state
      {sending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Sending email...</Text>
        </View>
      )}
      
      await reports.sendReport(reportId, emailData);
      
      setEmailSuccess(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(false);
        fetchReport();
      }, 2000);
    } catch (err) {
      console.error('Error sending report:', err);
      Alert.alert('Error', 'Failed to send report: ' + (err.message || ''));
    } finally {
      setSending(false); // Hide loading state
    }
  };
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await reports.generatePDF(reportId, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      const blob = response.data;
      if (blob.size === 0) {
        Alert.alert('Error', 'Generated PDF is empty. Please try again.');
        setDownloading(false);
        return;
      }
      const fileUri = `${FileSystem.documentDirectory}Report_${report?.report_number || reportId}.pdf`;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = reader.result;
          const base64Data = data.split(',')[1]; // Remove data URL prefix
          
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64
          });
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists || fileInfo.size === 0) {
            Alert.alert('Error', 'Failed to save PDF file. Please try again.');
            setDownloading(false);
            return;
          }
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share Report ${report?.report_number || ''}`
            });
          } else {
            Alert.alert('Error', 'Sharing is not available on this device');
          }
        } catch (err) {
          console.error('Error saving or sharing file:', err);
          Alert.alert('Error', 'Failed to download PDF: ' + err.message);
        } finally {
          setDownloading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        Alert.alert('Error', 'Failed to process PDF file');
        setDownloading(false);
      };
      
      reader.readAsDataURL(blob);
      
    } catch (err) {
      setDownloading(false);
      console.error('Error generating PDF:', err);
      Alert.alert('Error', 'Failed to generate PDF: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Report not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <ArrowLeft size={20} color="#4F46E5" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const reportContent = report.report_content || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
          <ArrowLeft size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report: {report.report_number}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowEmailModal(true)}
          >
            <Mail size={24} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? 
              <ActivityIndicator size="small" color="#7E22CE" /> : 
              <Download size={24} color="#7E22CE" />
            }
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          report.status === 'draft' ? styles.statusDraft : 
          report.status === 'sent' ? styles.statusSent : 
          styles.statusOther
        ]}>
          <Text style={styles.statusText}>{report.status}</Text>
        </View>
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Template:</Text>
            <Text style={styles.infoValue}>{report.template_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(report.created_at).toLocaleString()}
            </Text>
          </View>
          {report.sent_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sent:</Text>
              <Text style={styles.infoValue}>
                {new Date(report.sent_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {reportContent.customer?.name || report.customer_name || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>
              {reportContent.customer?.email || report.customer_email || 'N/A'}
            </Text>
          </View>
          {reportContent.job?.title && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job:</Text>
              <Text style={styles.infoValue}>{reportContent.job.title}</Text>
            </View>
          )}
        </View>

        {/* Report Logo */}
        {reportContent.logo && (
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: reportContent.logo }} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.reportContent}>
          <Text style={styles.reportContentTitle}>Report Content</Text>
          
          {reportContent.sections?.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {section.type === 'static' ? (
                <Text style={styles.staticText}>{section.content}</Text>
              ) : (
                <View style={styles.sectionContent}>
                  {section.type === 'checkbox' ? (
                    <View style={styles.checkboxItem}>
                      <View style={[
                        styles.checkbox,
                        section.value ? styles.checkboxChecked : {}
                      ]}>
                        {section.value && <Check size={16} color="white" />}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        {section.placeholder || 'Checked'}
                      </Text>
                    </View>
                  ) : section.type === 'photo' ? (
                    section.value ? (
                      <Image
                        source={{ uri: section.value }}
                        style={styles.photoImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.emptyValue}>No photo provided</Text>
                    )
                  ) : section.type === 'signature' ? (
                    section.value ? (
                      <Image
                        source={{ uri: section.value }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.emptyValue}>No signature provided</Text>
                    )
                  ) : section.type === 'checklist' ? (
                    <View style={styles.checklistContainer}>
                      {section.checklistItems && section.checklistItems.length > 0 ? (
                        section.checklistItems.map((item, checkIndex) => {
                          const isChecked = section.value && section.value[checkIndex];
                          const note = section.value?.notes && section.value.notes[checkIndex];
                          
                          return (
                            <View key={checkIndex} style={styles.checklistItem}>
                              <View style={styles.checklistRow}>
                                <View style={[
                                  styles.checkbox,
                                  isChecked ? styles.checkboxChecked : {}
                                ]}>
                                  {isChecked && <Check size={16} color="white" />}
                                </View>
                                <Text style={[
                                  styles.checklistItemText,
                                  isChecked ? styles.checklistItemChecked : {}
                                ]}>
                                  {item}
                                </Text>
                              </View>
                              
                              {note && (
                                <Text style={styles.checklistNote}>Note: {note}</Text>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.emptyValue}>No checklist items</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.sectionValue}>
                      {section.value || <Text style={styles.emptyValue}>No data provided</Text>}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {emailSuccess ? (
              <View style={styles.successContainer}>
                <CheckCircle size={60} color="#059669" style={styles.successIcon} />
                <Text style={styles.successTitle}>Email Sent Successfully</Text>
                <Text style={styles.successMessage}>
                  The report has been emailed to {emailData.email}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Send Report</Text>
                  <TouchableOpacity 
                    onPress={() => setShowEmailModal(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
                
                {error && (
                  <View style={styles.modalError}>
                    <AlertCircle size={20} color="#EF4444" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                <View style={styles.formContainer}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Recipient Email *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={emailData.email}
                      onChangeText={(text) => setEmailData({...emailData, email: text})}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Subject *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={emailData.subject}
                      onChangeText={(text) => setEmailData({...emailData, subject: text})}
                      placeholder="Enter subject"
                    />
                  </View>
                  
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Message</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={emailData.message}
                      onChangeText={(text) => setEmailData({...emailData, message: text})}
                      placeholder="Enter message"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowEmailModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={handleSendReport}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.sendButtonText}>Send Email</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButtonContainer: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  statusContainer: {
    padding: 16,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusSent: {
    backgroundColor: '#D1FAE5',
  },
  statusOther: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#111827',
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    height: 60,
    width: '100%',
  },
  reportContent: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
  },
  reportContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  staticText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  sectionContent: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  sectionValue: {
    fontSize: 14,
    color: '#111827',
  },
  emptyValue: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
  },
  signatureImage: {
    width: '100%',
    height: 100,
    borderRadius: 4,
  },
  checklistContainer: {
    marginTop: 4,
  },
  checklistItem: {
    marginBottom: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  checklistItemChecked: {
    color: '#111827',
    fontWeight: '500',
  },
  checklistNote: {
    marginLeft: 28,
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#4F46E5',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 12,
    margin: 16,
    borderRadius: 6,
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  formContainer: {
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    padding: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default ReportView;