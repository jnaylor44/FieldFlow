import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import api from '../../utils/api';
import WorkerCard from './WorkerCard';
import AddWorkerForm from './AddWorkerForm';
import Modal from '../jobs/JobModal'; // Reusing the existing modal component

const WorkersView = ({ onSelectWorker }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workers');
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search workers..."
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button
          onClick={() => setShowAddWorkerModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md flex items-center"
        >
          <Plus size={18} className="mr-1" />
          Add Worker
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No workers found. Add a worker to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map(worker => (
            <WorkerCard 
              key={worker.id} 
              worker={worker} 
              onClick={() => onSelectWorker(worker.id)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showAddWorkerModal} onClose={() => setShowAddWorkerModal(false)}>
        <AddWorkerForm 
          onClose={() => setShowAddWorkerModal(false)}
          onWorkerAdded={() => {
            setShowAddWorkerModal(false);
            fetchWorkers();
          }}
        />
      </Modal>
    </div>
  );
};

export default WorkersView;