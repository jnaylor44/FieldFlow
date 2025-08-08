import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import client from '../../api/client';

const CustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await client.get('/customers');
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = (id, name) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/customers/${id}`);
              setCustomers(customers.filter(customer => customer.id !== id));
            } catch (err) {
              console.error('Error deleting customer:', err);
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        },
      ]
    );
  };

  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        {item.company_name && <Text style={styles.companyName}>{item.company_name}</Text>}
        
        <View style={styles.contactInfo}>
          {item.email && (
            <View style={styles.contactRow}>
              <MaterialIcons name="email" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{item.email}</Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.contactRow}>
              <MaterialIcons name="phone" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => navigation.navigate('CustomerJobs', { 
            customerId: item.id, 
            customerName: item.name 
          })}
        >
          <MaterialIcons name="assignment" size={18} color="#4F46E5" />
          <Text style={styles.viewButtonText}>Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditCustomer', { customer: item })}
        >
          <MaterialIcons name="edit" size={18} color="#059669" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCustomer(item.id, item.name)}
        >
          <MaterialIcons name="delete" size={18} color="#DC2626" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCustomers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('EditCustomer')}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  companyName: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  viewButton: {
    backgroundColor: '#EEF2FF',
  },
  viewButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#ECFDF5',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
});

export default CustomersScreen;