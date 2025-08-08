import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../../utils/api';
import { Clock, User, MapPin, Building } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const containerStyle = {
  width: '100%',
  height: '500px'
};
const defaultCenter = {
  lat: -41.2865, 
  lng: 174.7762
};

const mapOptions = {
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};
const WORKER_ICON = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#4F46E5" stroke="white" stroke-width="2"/>
      <text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">W</text>
    </svg>
  `),
  scaledSize: { width: 40, height: 40 }
};

const JOB_ICON = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <path d="M18 2 L34 18 L18 34 L2 18 Z" fill="#EF4444" stroke="white" stroke-width="2"/>
      <text x="18" y="22" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">J</text>
    </svg>
  `),
  scaledSize: { width: 36, height: 36 }
};

const ACTIVE_JOB_ICON = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <path d="M18 2 L34 18 L18 34 L2 18 Z" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <text x="18" y="22" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">J</text>
    </svg>
  `),
  scaledSize: { width: 36, height: 36 }
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-NZ', { 
    hour: 'numeric', 
    minute: 'numeric',
    day: '2-digit',
    month: 'short'
  }).format(date);
};

const calculateTimeSince = (timestamp) => {
  if (!timestamp) return 'unknown time';
  
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  
  const minutes = Math.floor(diffMs / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const MapView = ({ selectedWorker, showAllWorkers = false, height = '500px' }) => {
  const mapRef = useRef(null);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });
  const fetchLocations = useCallback(async () => {
    try {
      console.log("Fetching location data", { selectedWorker, showAllWorkers });
      setLoading(true);
      setError('');
      let workersData = [];
      if (selectedWorker) {
        console.log(`Fetching single worker location for ID: ${selectedWorker}`);
        const response = await api.get(`/location/worker/${selectedWorker}`);
        console.log("Worker location response:", response.data);
        const workerDetailsResponse = await api.get(`/workers/${selectedWorker}`);
        console.log("Worker details response:", workerDetailsResponse.data);
        
        if (response.data && response.data.latitude) {
          workersData = [{
            id: selectedWorker,
            name: workerDetailsResponse.data?.name || 'Worker',
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            accuracy: response.data.accuracy,
            batteryLevel: response.data.battery_level,
            recordedAt: response.data.recorded_at
          }];
          
          console.log("Worker location data:", workersData);
        } else {
          console.log("No location data found for worker");
        }
      } else if (showAllWorkers) {
        console.log("Fetching all worker locations");
        const response = await api.get('/location/workers');
        console.log("All workers location response:", response.data);
        
        workersData = response.data.map(worker => ({
          id: worker.user_id,
          name: worker.worker_name,
          latitude: worker.latitude,
          longitude: worker.longitude,
          accuracy: worker.accuracy,
          batteryLevel: worker.battery_level,
          recordedAt: worker.recorded_at
        }));
      }
      
      setWorkers(workersData);
      console.log("Fetching job locations");
      let jobsData = [];
      if (selectedWorker) {
        const workerJobsResponse = await api.get(`/workers/${selectedWorker}/jobs`);
        console.log("Worker jobs response:", workerJobsResponse.data);
        jobsData = workerJobsResponse.data.filter(job => job.location);
      } else {
        const jobsResponse = await api.get('/location/jobs');
        console.log("Jobs location response:", jobsResponse.data);
        jobsData = jobsResponse.data;
      }
      
      setJobs(jobsData);
      if (workersData.length > 0) {
        console.log("Centering map on worker");
        setCenter({
          lat: parseFloat(workersData[0].latitude),
          lng: parseFloat(workersData[0].longitude)
        });
      } else if (jobsData.length > 0 && jobsData[0].location) {
        console.log("Centering map on job");
        const [lat, lng] = jobsData[0].location.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCenter({ lat, lng });
        }
      } else {
        console.log("Using default center for map");
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      setError('Failed to load map data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedWorker, showAllWorkers]);
  useEffect(() => {
    console.log("Map component mounted/updated");
    fetchLocations();
    const interval = setInterval(fetchLocations, 60000);
    
    return () => {
      console.log("Map component unmounting, clearing interval");
      clearInterval(interval);
    };
  }, [fetchLocations]);
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      console.log("Map loaded, triggering resize");
      setTimeout(() => {
        if (window.google && window.google.maps && mapRef.current) {
          window.google.maps.event.trigger(mapRef.current, 'resize');
        }
      }, 200);
    }
  }, [isLoaded]);
  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Error loading Google Maps: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: height, width: '100%' }}>
      {loading && (
        <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow z-10 flex items-center">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm">Updating...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-red-100 text-red-600 p-2 rounded shadow z-10">
          {error}
        </div>
      )}

      {/* Data status indicators */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        <div className={`text-xs px-2 py-1 rounded-full ${workers.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          Workers: {workers.length}
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${jobs.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          Jobs: {jobs.length}
        </div>
      </div>
      
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height }}
        center={center}
        zoom={showAllWorkers ? 10 : 14}
        options={mapOptions}
        onLoad={map => {
          console.log("Map loaded");
          mapRef.current = map;
        }}
      >
        {/* Worker markers */}
        {workers.map(worker => {
          const customWorkerIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#4F46E5" stroke="white" stroke-width="2"/>
                <text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${worker.name ? worker.name[0] : 'W'}</text>
              </svg>
            `),
            scaledSize: { width: 40, height: 40 }
          };
          
          return (
            <Marker
              key={`worker-${worker.id}`}
              position={{ lat: parseFloat(worker.latitude), lng: parseFloat(worker.longitude) }}
              icon={customWorkerIcon}
              onClick={() => setSelectedMarker({ type: 'worker', data: worker })}
            />
          );
        })}
        
        {/* Job markers */}
        {/* {jobs.map(job => {
          if (!job.location) return null;
          
          const [lat, lng] = job.location.split(',').map(Number);
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <Marker
              key={`job-${job.id}`}
              position={{ lat, lng }}
              icon={job.status === 'in_progress' ? ACTIVE_JOB_ICON : JOB_ICON}
              onClick={() => setSelectedMarker({ type: 'job', data: job })}
            />
          );
        })} */}
        {jobs.map(job => {
  let jobLocations = [];
  
  try {
    if (typeof job.location === 'string') {
      const parsed = JSON.parse(job.location);
      if (Array.isArray(parsed)) {
        jobLocations = parsed;
      } else if (parsed && typeof parsed === 'object') {
        jobLocations = [parsed]; // Single location object
      }
    }
  } catch (e) {
    if (job.location && typeof job.location === 'string' && job.location.includes(',')) {
      const [lat, lng] = job.location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        jobLocations = [{ address: 'Unknown Address', lat, lng }];
      }
    }
  }
  return jobLocations.map((location, locIndex) => {
    const lat = location.lat || parseFloat(location.latitude);
    const lng = location.lng || parseFloat(location.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    const locationNumber = jobLocations.length > 1 ? locIndex + 1 : '';
    const customJobIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <path d="M18 2 L34 18 L18 34 L2 18 Z" fill="${job.status === 'in_progress' ? '#3B82F6' : '#EF4444'}" stroke="white" stroke-width="2"/>
          <text x="18" y="18" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">J${locationNumber}</text>
        </svg>
      `),
      scaledSize: { width: 36, height: 36 }
    };
    
    return (
      <Marker
        key={`job-${job.id}-location-${locIndex}`}
        position={{ lat, lng }}
        icon={customJobIcon}
        onClick={() => setSelectedMarker({ 
          type: 'job', 
          data: {
            ...job,
            currentLocation: location,
            locationIndex: locIndex,
            totalLocations: jobLocations.length
          }
        })}
      />
    );
  });
})}
        
        {/* Info windows */}
        {selectedMarker && selectedMarker.type === 'job' && (
  <InfoWindow
    position={{
      lat: selectedMarker.data.currentLocation.lat || parseFloat(selectedMarker.data.currentLocation.latitude),
      lng: selectedMarker.data.currentLocation.lng || parseFloat(selectedMarker.data.currentLocation.longitude)
    }}
    onCloseClick={() => setSelectedMarker(null)}
  >
    <div className="p-1 max-w-xs">
      <div className="font-medium mb-1 flex items-center">
        <MapPin size={16} className="mr-1 text-red-600" />
        <span>{selectedMarker.data.title}</span>
      </div>
      {selectedMarker.data.totalLocations > 1 && (
        <div className="text-xs font-medium text-primary-600 mb-1">
          Location {selectedMarker.data.locationIndex + 1} of {selectedMarker.data.totalLocations}
        </div>
      )}
      <div className="text-sm text-gray-600 mb-1">
        <span className="capitalize">{selectedMarker.data.status}</span>
        {' • '}
        <span>{formatTime(selectedMarker.data.scheduled_start)}</span>
      </div>
      <div className="text-sm text-gray-600 flex items-center mb-1">
        <Building size={14} className="mr-1" />
        <span>{selectedMarker.data.customer_name || 'Unknown Customer'}</span>
      </div>
      {selectedMarker.data.currentLocation.address && (
        <div className="text-sm text-gray-600 mb-1">
          <strong>Address:</strong> {selectedMarker.data.currentLocation.address}
        </div>
      )}
      {selectedMarker.data.currentLocation.details && (
        <div className="text-sm text-gray-600 mb-1">
          <strong>Details:</strong> {selectedMarker.data.currentLocation.details}
        </div>
      )}
      {selectedMarker.data.worker_name && (
        <div className="text-sm text-gray-600 flex items-center">
          <User size={14} className="mr-1" />
          <span>Assigned to {selectedMarker.data.worker_name}</span>
        </div>
      )}
    </div>
  </InfoWindow>
)}
        {selectedMarker && (
          <InfoWindow
            position={
              selectedMarker.type === 'worker' 
                ? { 
                    lat: parseFloat(selectedMarker.data.latitude), 
                    lng: parseFloat(selectedMarker.data.longitude) 
                  }
                : { 
                    lat: parseFloat(selectedMarker.data.location.split(',')[0]), 
                    lng: parseFloat(selectedMarker.data.location.split(',')[1]) 
                  }
            }
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-1 max-w-xs">
              {selectedMarker.type === 'worker' ? (
                <>
                  <div className="font-medium mb-1 flex items-center">
                    <User size={16} className="mr-1 text-primary-600" />
                    <span>{selectedMarker.data.name || 'Worker'}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center mb-1">
                    <Clock size={14} className="mr-1" />
                    <span>Updated {calculateTimeSince(selectedMarker.data.recordedAt)}</span>
                  </div>
                  {selectedMarker.data.batteryLevel && (
                    <div className="text-sm text-gray-600">
                      Battery: {selectedMarker.data.batteryLevel}%
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-medium mb-1 flex items-center">
                    <MapPin size={16} className="mr-1 text-red-600" />
                    <span>{selectedMarker.data.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="capitalize">{selectedMarker.data.status}</span>
                    {' • '}
                    <span>{formatTime(selectedMarker.data.scheduled_start)}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center mb-1">
                    <Building size={14} className="mr-1" />
                    <span>{selectedMarker.data.customer_name || 'Unknown Customer'}</span>
                  </div>
                  {selectedMarker.data.worker_name && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <User size={14} className="mr-1" />
                      <span>Assigned to {selectedMarker.data.worker_name}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapView;