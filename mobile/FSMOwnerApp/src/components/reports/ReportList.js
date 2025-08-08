import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  FileText, 
  Mail, 
  Download, 
  Eye, 
  Trash2, 
  Plus,
  ArrowLeft 
} from 'lucide-react-native';
import reports from '../../api/report';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ReportList = ({ jobId, onViewReport, onCreateReport, onBack }) => {
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [jobId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reports.getReportsForJob(jobId);
      setReportsList(response.data.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await reports.deleteReport(id);
              setReportsList(reportsList.filter(report => report.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete report');
              console.error(err);
            }
          }
        }
      ]
    );
  };

  const handleSendReport = async (id) => {
    try {
      const report = reportsList.find(r => r.id === id);
      if (!report) return;

      Alert.prompt(
        'Send Report',
        'Enter recipient email address:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async (email) => {
              if (!email || !email.includes('@')) {
                Alert.alert('Error', 'Please enter a valid email address');
                return;
              }

              try {
                const emailData = {
                  email: email,
                  subject: `Report: ${report.report_number}`,
                  message: `Please find attached report ${report.report_number}.`
                };

                await reports.sendReport(id, emailData);
                Alert.alert('Success', 'Report sent successfully');
                fetchReports(); // Refresh list to update status
              } catch (err) {
                Alert.alert('Error', 'Failed to send report');
                console.error(err);
              }
            }
          }
        ],
        'plain-text'
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send report');
      console.error(err);
    }
  };

const handleDownloadPDF = async (id) => {
  try {
    const report = reportsList.find(r => r.id === id);
    setDownloading(true);
    const response = await reports.generatePDF(id, {
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
    const fileUri = `${FileSystem.documentDirectory}Report_${report?.report_number || id}.pdf`;
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Back button */}
        {onBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
          >
            <ArrowLeft size={20} color="#4F46E5" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Reports</Text>
        <TouchableOpacity 
  style={styles.addButton}
  onPress={() => {
    console.log("Create report button pressed");
    if (onCreateReport) {
      onCreateReport();
    } else {
      console.error("onCreateReport prop is not defined");
    }
  }}
>
  <Plus size={16} color="white" />
  <Text style={styles.buttonText}>New Report</Text>
</TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {reportsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={48} color="#D1D5DB" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No reports found</Text>
          <Text style={styles.emptySubtext}>
            Create your first report for this job
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={onCreateReport}
          >
            <Plus size={16} color="white" />
            <Text style={styles.buttonText}>Create Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reportsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reportCard}>
              <TouchableOpacity 
                style={styles.reportInfo}
                onPress={() => onViewReport(item.id)}
              >
                <Text style={styles.reportNumber}>{item.report_number}</Text>
                <View style={styles.reportMeta}>
                  <Text style={styles.templateName}>{item.template_name}</Text>
                  <View style={[
                    styles.statusBadge, 
                    item.status === 'draft' ? styles.statusDraft : 
                    item.status === 'sent' ? styles.statusSent : 
                    styles.statusOther
                  ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.reportDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                    console.log("View button pressed for report:", item.id);
                    if (onViewReport) {
                    onViewReport(item.id);
                    } else {
                    console.error("onViewReport prop is not defined");
                    }
                }}
                >
                <Eye size={20} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleSendReport(item.id)}
                >
                  <Mail size={20} color="#059669" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDownloadPDF(item.id)}
                  disabled={downloading}
                >
                  {downloading ? 
                    <ActivityIndicator size="small" color="#7E22CE" /> : 
                    <Download size={20} color="#7E22CE" />
                  }
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDeleteReport(item.id)}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 6,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: '#B91C1C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  reportCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  reportInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: '500',
  },
  reportDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default ReportList;