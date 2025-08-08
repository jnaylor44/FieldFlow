import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { 
  X, 
  ArrowLeft, 
  Camera, 
  Trash2,
  Calendar, 
  Check
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import SignatureScreen from 'react-native-signature-canvas';
import reports from '../../api/report';
import client from '../../api/client';

const ReportGenerator = ({ jobId, customerId, onComplete, onCancel }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = template selection, 2 = fill form
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureField, setSignatureField] = useState(null);
  const signatureRef = useRef();
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos');
        }
      }
    })();
  }, []);
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await reports.getTemplates();
      setTemplates(response.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleTemplateSelect = async (templateId) => {
    try {
      setLoading(true);
      const response = await reports.getTemplate(templateId);
      setSelectedTemplate(response.data);
      const initialFormData = {};
      const sections = response.data.template_content?.sections || [];
      
      sections.forEach((section, index) => {
        if (section.type !== 'static') {
          if (section.type === 'checkbox') {
            initialFormData[`section_${index}`] = false;
          } else if (section.type === 'date') {
            initialFormData[`section_${index}`] = new Date().toISOString().split('T')[0];
          } else if (section.type === 'checklist') {
            initialFormData[`section_${index}`] = {};
          } else {
            initialFormData[`section_${index}`] = '';
          }
        }
      });
      
      setFormData(initialFormData);
      setStep(2);
    } catch (err) {
      console.error('Failed to load template:', err);
      setError('Failed to load template details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (sectionIndex, value, checkItemIndex = null, fieldType = null) => {
    if (checkItemIndex !== null) {
      const currentChecklist = {...(formData[`section_${sectionIndex}`] || {})};
      
      if (fieldType === 'note') {
        if (!currentChecklist.notes) currentChecklist.notes = {};
        currentChecklist.notes[checkItemIndex] = value;
      } else {
        currentChecklist[checkItemIndex] = value;
        if (!value && currentChecklist.notes && currentChecklist.notes[checkItemIndex]) {
          delete currentChecklist.notes[checkItemIndex];
        }
      }
      
      setFormData({
        ...formData,
        [`section_${sectionIndex}`]: currentChecklist
      });
    } else {
      setFormData({
        ...formData,
        [`section_${sectionIndex}`]: value
      });
    }
  };
  const handleDateSelect = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && datePickerField !== null) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      handleInputChange(datePickerField, formattedDate);
    }
  };
  const handleTakePhoto = async (sectionIndex) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const base64Photo = `data:image/jpeg;base64,${result.assets[0].base64}`;
        handleInputChange(sectionIndex, base64Photo);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChoosePhoto = async (sectionIndex) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const base64Photo = `data:image/jpeg;base64,${result.assets[0].base64}`;
        handleInputChange(sectionIndex, base64Photo);
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };
  const handleSignature = (sectionIndex) => {
    setSignatureField(sectionIndex);
    setShowSignature(true);
  };

  const handleSignatureComplete = (signature) => {
    if (signatureField !== null) {
      handleInputChange(signatureField, signature);
      setShowSignature(false);
      setSignatureField(null);
    }
  };

  const handleSignatureCancel = () => {
    setShowSignature(false);
    setSignatureField(null);
  };
  const compressImage = async (base64Image) => {
    return base64Image;
  };
  const processReportContent = async () => {
    if (!selectedTemplate || !selectedTemplate.template_content) {
      throw new Error('No template selected or template content is missing');
    }
    
    const sections = selectedTemplate.template_content.sections || [];
    const processedSections = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionValue = formData[`section_${i}`];
      
      if (section.type === 'checklist') {
        processedSections.push({
          ...section,
          value: sectionValue || {}, // Keep the raw values
        });
      } else if (section.type === 'photo' && sectionValue) {
        try {
          const compressedValue = await compressImage(sectionValue);
          processedSections.push({
            ...section,
            value: compressedValue
          });
        } catch (err) {
          console.error('Failed to compress image:', err);
          processedSections.push({
            ...section,
            value: sectionValue
          });
        }
      } else {
        processedSections.push({
          ...section,
          value: section.type !== 'static' ? sectionValue : section.content
        });
      }
    }
    
    return processedSections;
  };
  const handleSubmit = async () => {
    if (!selectedTemplate || !customerId) {
      setError('Missing required data');
      return;
    }
    let missingRequired = false;
    const sections = selectedTemplate.template_content?.sections || [];
    
    sections.forEach((section, index) => {
      if (section.required && section.type !== 'static' && !formData[`section_${index}`]) {
        missingRequired = true;
        setError(`Please fill in the required field: ${section.title}`);
      }
    });
    
    if (missingRequired) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const processedSections = await processReportContent();
      const reportContent = {
        logo: selectedTemplate.template_content?.logo || null,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        sections: processedSections,
        customer: {
          id: customerId,
          name: "Customer",
          company: "",
          email: ""
        },
        job: jobId ? {
          id: jobId,
          title: "Job",
          status: "in_progress",
          scheduled_start: new Date().toISOString(),
          scheduled_end: new Date().toISOString()
        } : null,
        created_at: new Date().toISOString()
      };
      const response = await reports.createReport({
        template_id: selectedTemplate.id,
        customer_id: customerId,
        job_id: jobId || null,
        report_content: reportContent
      });
      
      Alert.alert('Success', 'Report created successfully');
      onComplete(response.data);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.error || 'Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }
  if (step === 1) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Template</Text>
          <View style={{ width: 24 }}></View>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <ScrollView style={styles.templateList}>
          {templates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No templates available</Text>
              <Text style={styles.emptySubtext}>
                Templates can only be created in the web app
              </Text>
            </View>
          ) : (
            templates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleTemplateSelect(template.id)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDesc}>
                  {template.description || 'No description'}
                </Text>
                {!template.is_active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inactive</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
          <ArrowLeft size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedTemplate?.name}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      
      <ScrollView style={styles.formContainer}>
        {selectedTemplate?.template_content?.logo && (
          <Image
            source={{ uri: selectedTemplate.template_content.logo }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        
        {selectedTemplate?.template_content?.sections?.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.type === 'static' ? (
              <Text style={styles.staticText}>{section.content}</Text>
            ) : (
              <View style={styles.inputContainer}>
                {section.type === 'text' && (
                  <TextInput
                    style={styles.textInput}
                    value={formData[`section_${index}`] || ''}
                    onChangeText={(text) => handleInputChange(index, text)}
                    placeholder={section.placeholder || 'Enter text...'}
                  />
                )}
                
                {section.type === 'textarea' && (
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData[`section_${index}`] || ''}
                    onChangeText={(text) => handleInputChange(index, text)}
                    placeholder={section.placeholder || 'Enter text...'}
                    multiline
                    numberOfLines={4}
                  />
                )}
                
                {section.type === 'number' && (
                  <TextInput
                    style={styles.textInput}
                    value={formData[`section_${index}`] || ''}
                    onChangeText={(text) => handleInputChange(index, text)}
                    placeholder={section.placeholder || 'Enter number...'}
                    keyboardType="numeric"
                  />
                )}
                
                {section.type === 'checkbox' && (
                  <View style={styles.checkboxContainer}>
                    <Switch
                      value={formData[`section_${index}`] || false}
                      onValueChange={(value) => handleInputChange(index, value)}
                      trackColor={{ false: '#767577', true: '#4F46E5' }}
                      thumbColor="#f4f3f4"
                    />
                    <Text style={styles.checkboxLabel}>
                      {section.placeholder || 'Check if applicable'}
                    </Text>
                  </View>
                )}
                
                {section.type === 'select' && (
                  <View style={styles.pickerContainer}>
                    {/* In a real app, you'd use a proper dropdown/picker component */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {(section.options || []).map((option, optIndex) => (
                        <TouchableOpacity
                          key={optIndex}
                          style={[
                            styles.selectOption,
                            formData[`section_${index}`] === option && styles.selectedOption
                          ]}
                          onPress={() => handleInputChange(index, option)}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            formData[`section_${index}`] === option && styles.selectedOptionText
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {section.type === 'date' && (
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setDatePickerField(index);
                      setShowDatePicker(true);
                    }}
                  >
                    <Calendar size={20} color="#4F46E5" />
                    <Text style={styles.dateText}>
                      {formData[`section_${index}`] || 'Select date...'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {section.type === 'signature' && (
                  formData[`section_${index}`] ? (
                    <View style={styles.signaturePreview}>
                      <Image
                        source={{ uri: formData[`section_${index}`] }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleInputChange(index, '')}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.signatureButton}
                      onPress={() => handleSignature(index)}
                    >
                      <Text style={styles.signatureButtonText}>Add Signature</Text>
                    </TouchableOpacity>
                  )
                )}
                
                {section.type === 'photo' && (
                  formData[`section_${index}`] ? (
                    <View style={styles.photoPreview}>
                      <Image
                        source={{ uri: formData[`section_${index}`] }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleInputChange(index, '')}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoButtons}>
                      <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() => handleTakePhoto(index)}
                      >
                        <Camera size={20} color="#4F46E5" />
                        <Text style={styles.photoButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() => handleChoosePhoto(index)}
                      >
                        <Text style={styles.photoButtonText}>Choose from Library</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
                
                {section.type === 'checklist' && (
                  <View style={styles.checklistContainer}>
                    {section.checklistItems?.map((item, checkIndex) => (
                      <View key={checkIndex} style={styles.checklistItem}>
                        <View style={styles.checklistRow}>
                          <Switch
                            value={formData[`section_${index}`]?.[checkIndex] || false}
                            onValueChange={(value) => handleInputChange(index, value, checkIndex)}
                            trackColor={{ false: '#767577', true: '#4F46E5' }}
                            thumbColor="#f4f3f4"
                          />
                          <Text style={styles.checklistItemText}>{item}</Text>
                        </View>
                        
                        {section.allowNotes && formData[`section_${index}`]?.[checkIndex] && (
                          <TextInput
                            style={styles.noteInput}
                            value={formData[`section_${index}`]?.notes?.[checkIndex] || ''}
                            onChangeText={(text) => handleInputChange(index, text, checkIndex, 'note')}
                            placeholder="Add note..."
                          />
                        )}
                      </View>
                    ))}
                  </View>
                )}
                
                {section.required && (
                  <Text style={styles.requiredText}>* Required</Text>
                )}
              </View>
            )}
          </View>
        ))}
        
        <View style={styles.spacer} />
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Check size={20} color="white" />
              <Text style={styles.submitButtonText}>Create Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateSelect}
        />
      )}
      
      {/* Signature Modal */}
      {showSignature && (
        <View style={styles.modalContainer}>
          <View style={styles.signatureModal}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureHeaderText}>Signature</Text>
              <TouchableOpacity onPress={handleSignatureCancel}>
                <X size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.signaturePad}>
              <SignatureScreen
                ref={signatureRef}
                onOK={(signature) => handleSignatureComplete(signature)}
                onEmpty={() => Alert.alert('Error', 'Please sign before saving')}
                autoClear={false}
                imageType="image/png"
                minWidth={3}
                maxWidth={5}
                penColor="blue"
                webStyle={`.m-signature-pad--footer { display: none; }`}
              />
            </View>
            
            <View style={styles.signatureFooter}>
              <TouchableOpacity
                style={styles.signatureClearButton}
                onPress={() => signatureRef.current?.clearSignature()}
              >
                <Text style={styles.signatureClearText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.signatureSaveButton}
                onPress={() => signatureRef.current?.readSignature()}
              >
                <Text style={styles.signatureSaveText}>Save Signature</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
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
  templateList: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  inactiveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  inactiveText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  cancelButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    padding: 10,
    borderRadius: 6,
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  logo: {
    height: 60,
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  staticText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  inputContainer: {
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  pickerContainer: {
    marginVertical: 8,
  },
  selectOption: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  selectedOption: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  selectedOptionText: {
    color: 'white',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  signatureButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  signaturePreview: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    minHeight: 100,
  },
  signatureImage: {
    width: '100%',
    height: 100,
  },
  photoButtons: {
    flexDirection: 'column',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
  },
  photoButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  photoPreview: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
  },
  checklistContainer: {
    marginTop: 8,
  },
  checklistItem: {
    marginBottom: 8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  noteInput: {
    marginLeft: 36,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    fontSize: 12,
    color: '#6B7280',
    padding: 4,
  },
  requiredText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  spacer: {
    height: 100,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  signatureModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  signatureHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  signaturePad: {
    height: 300,
    width: '100%',
  },
  signatureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  signatureClearButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  signatureClearText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  signatureSaveButton: {
    backgroundColor: '#4F46E5',
    padding: 10,
    borderRadius: 6,
    flex: 2,
    alignItems: 'center',
  },
  signatureSaveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReportGenerator;