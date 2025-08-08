const axios = require('axios');


const placesController = {
    async getPlaceAutocomplete(req, res) {
      try {
        console.log('Autocomplete request received:', req.query);
        const response = await axios({
          method: 'post',
          url: 'https://places.googleapis.com/v1/places:autocomplete',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.REACT_APP_GOOGLE_MAPS_API_KEY
          },
          data: {
            input: req.query.input,
            locationRestriction: {  // Changed from locationBias to locationRestriction
              rectangle: {
                low: { latitude: -47.0, longitude: 166.0 },
                high: { latitude: -34.0, longitude: 179.0 }
              }
            }
          }
        });
        
        console.log('Raw response preview:', 
          JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
const transformedResponse = {
    predictions: (response.data.suggestions || []).map(suggestion => ({
      place_id: suggestion.placePrediction?.placeId,
      description: suggestion.placePrediction?.text?.text
    })),
    status: response.data.suggestions?.length > 0 ? 'OK' : 'ZERO_RESULTS'
  };
        
        console.log('Places API response transformed');
        res.json(transformedResponse);
      } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        res.status(500).json({
          error: 'Error fetching place autocomplete',
          message: error.message
        });
      }
    },
  async getPlaceDetails(req, res) {
    try {
      const formattedPlaceId = req.query.place_id.startsWith('places/') 
        ? req.query.place_id 
        : `places/${req.query.place_id}`;
        
      const response = await axios({
        method: 'get',
        url: `https://places.googleapis.com/v1/${formattedPlaceId}`,
        headers: {
          'X-Goog-Api-Key': process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'displayName,formattedAddress,location'
        }
      });
      const transformedResponse = {
        result: {
          name: response.data.displayName,
          formatted_address: response.data.formattedAddress,
          geometry: {
            location: {
              lat: response.data.location?.latitude,
              lng: response.data.location?.longitude
            }
          }
        },
        status: 'OK'
      };
      
      res.json(transformedResponse);
    } catch (error) {
      console.error('Error fetching place details:', error.response?.data || error.message);
      res.status(500).json({
        error: 'Error fetching place details',
        message: error.message
      });
    }
  }
};

module.exports = placesController;