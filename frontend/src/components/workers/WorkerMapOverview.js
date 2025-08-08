
import React, { useState } from 'react';
import { MapPin, Truck, RefreshCw } from 'lucide-react';
import MapView from '../maps/MapView';

const WorkerMapOverview = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Truck size={20} className="text-primary-600 mr-2" />
          <h2 className="text-lg font-medium">Worker Locations</h2>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          disabled={isRefreshing}
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="p-0">
        <MapView 
          showAllWorkers={true} 
          height="550px"
        />
      </div>
    </div>
  );
};

export default WorkerMapOverview;