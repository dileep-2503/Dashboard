import axios from 'axios';

const API_BASE_URL = 'https://commercialhub.cholainsurance.com/dynamic_rater_backend';

// Function to handle login
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Function to register a new user
export const register = async (name, username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, { name, username, password });
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  } catch (error) {
    
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const fetchCategory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/category`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add user');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Update an existing user
export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Delete a user
export const deleteUser = async (userId, deleteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Function to fetch packages
export const fetchProduct = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/product`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

// Function to fetch Pincode details
export const fetchPincodeDetails = async (pincode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pincodes`, { params: { pincode } });
    return response.data;
  } catch (error) {
    console.error('Error fetching pincode details:', error);
    throw error;
  }
};

export const addPincodeDetails = async (pincodeData) => {
  try {
    const formattedData = {
      ...pincodeData,
      state: pincodeData.state.toUpperCase(),
      district: pincodeData.district.toUpperCase(),
      area: pincodeData.area.toUpperCase()
    };
    
    const response = await axios.post(`${API_BASE_URL}/pincodes/add`, formattedData);
    return response.data;
  } catch (error) {
    console.error('Error adding pincode details:', error);
    throw error;
  }
};

export const updatePincodeDetails = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pincodes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update pincode');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// New function for deleting a pincode
export const deletePincodeDetails = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pincodes/${id}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete pincode');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchPincode = async (skip = 0, take = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pincode`, {
      params: {
        skip,
        take
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pincode details:', error);
    throw error;
  }
};

export const fetchState = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/state`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segment details:', error);
    throw error;
  }
};

// Function to fetch occupancy details
export const fetchOccupancy = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/occupancy`);
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy details:', error);
    throw error;
  }
};

export const fetchSegment = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/segment`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segment details:', error);
    throw error;
  }
};

export const fetchUserLevel = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user-level`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segment details:', error);
    throw error;
  }
};


export const fetchOccupancyColumns = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/occupancy/get_columns`);
    return response.data.columns;
  } catch (error) {
    console.error('Error fetching occupancy columns:', error);
    throw error;
  }
};

export const addOccupancyRate = async (rateData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/occupancy_rate/add`, rateData);
    return response.data;
  } catch (error) {
    console.error('Error adding occupancy rate:', error);
    throw error;
  }
};

export const updateOccupancyRate = async (id, rateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/occupancy_rate/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rateData),
    });

    return await response.json();
  } catch (error) {
    throw new Error(`Error updating occupancy rate: ${error.message}`);
  }
};

// Delete occupancy rate
export const deleteOccupancyRate = async (id, deleteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/occupancy_rate/${id}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete occupancy rate');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error deleting occupancy rate: ${error.message}`);
  }
};

export const fetchOccupancies = async (skip = 0, take = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/occupancies`, {
      params: {
        skip,
        take
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy details:', error);
    throw error;
  }
};

export const uploadOccupancyCSV = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/occupancies/upload`, {
      method: 'POST',
      body: formData,
      // No Content-Type header needed as it will be set automatically for FormData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload CSV');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const addTableColumns = async (columns) => {
  try {
    const response = await fetch(`${API_BASE_URL}/occupancy/columns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ columns }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add columns');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchSection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/section`);
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy details:', error);
    throw error;
  }
};

export const fetchSectionByProduct = async (product) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/section`, { product });
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy details:', error);
    throw error;
  }
};

export const fetchOccupancyRate = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/occupancy_rate`);
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy details:', error);
    throw error;
  }
};

export const fetchComponents = async (skip = 0, take = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/components`, {
      params: { skip, take }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};

export const fetchComponent = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/component`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};

// Function to submit product data
export const submitProductData = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/section-mapping`, data);
    return response.data;
  } catch (error) {
    console.error('Error submitting product data:', error);
    throw error;
  }
};

export const updateProductSection = async (name, newSection) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/product-section`, { 
      name, 
      section: newSection // newSection will be undefined for new sections
    });
    return response.data;
  } catch (error) {
    console.error('Error updating product section:', error);
    throw error;
  }
};

export const deleteProductSection = async (sectionName) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/product-section/${sectionName}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product section:', error);
    throw error;
  }
};

export const updateSection = async (sectionId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/section-mapping/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

// Function to submit product mapping data
export const submitProductMapping = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/product-mapping`, formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting product mapping:', error);
    throw error;
  }
};

// Function to update existing product mapping
export const updateProductMapping = async (id, formData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/product-mapping/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error updating product mapping:', error);
    throw error;
  }
};

// Function to delete existing product mapping
export const deleteProductMapping = async (id, deleteData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/product-mapping/${id}/delete`, deleteData);
    return response.data;
  } catch (error) {
    console.error('Error deleting product mapping:', error);
    throw error;
  }
};

export const deleteSectionMapping = async (id, deleteData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/section-mapping/${id}/delete`, deleteData);
    return response.data;
  } catch (error) {
    console.error('Error deleting product mapping:', error);
    throw error;
  }
};

// api.js
export const savePolicy = async (submittedAddresses, currentUser, title, addressesJSON, time) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        title,
        addressesJSON,
        time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save policy');
    }
    
    return data;
  } catch (error) {
    console.error("Error saving policy:", error);
    throw error;
  }
};

export const saveQuote = async (submittedAddresses, currentUser, title, time) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        title,
        time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save policy');
    }
    
    return data;
  } catch (error) {
    console.error("Error saving policy:", error);
    throw error;
  }
};

export const updatePolicy = async (summaryId, submittedAddresses, currentUser, title, addressesJSON, time, updatedBy) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-summary/${summaryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        title,
        addressesJSON,
        time,
        updated_by: updatedBy,
        updated_time: time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update policy');
    }
    
    return data;
  } catch (error) {
    console.error("Error updating policy:", error);
    throw error;
  }
};

export const updateQuote = async (quoteId, submittedAddresses, currentUser, title, time, updatedBy) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-quote/${quoteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        title,
        time,
        updated_by: updatedBy,
        updated_time: time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update quote');
    }
    
    return data;
  } catch (error) {
    console.error("Error updating quote:", error);
    throw error;
  }
};

export const savePendingQuote = async (
  submittedAddresses, 
  currentUser, 
  clientName, 
  deviationType, 
  status, 
  raisedBy, 
  raisedOn, 
  addressesJSON, 
  time
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-pending-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        client_name: clientName,
        deviation_type: deviationType,
        status,
        raised_by: raisedBy,
        raised_on: raisedOn,
        addressesJSON,
        time
      })
    });
   
    const data = await response.json();
   
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save pending quote');
    }
   
    return data;
  } catch (error) {
    console.error("Error saving pending quote:", error);
    throw error;
  }
};

export const updatePendingQuote = async (
  pendingId, 
  submittedAddresses, 
  currentUser, 
  clientName, 
  deviationType, 
  status, 
  raisedBy, 
  raisedOn, 
  addressesJSON, 
  time, 
  updatedBy
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-pending-quote/${pendingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        client_name: clientName,
        deviation_type: deviationType,
        status,
        raised_by: raisedBy,
        raised_on: raisedOn,
        addressesJSON,
        time,
        updated_by: updatedBy,
        updated_time: time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update pending quote');
    }
    
    return data;
  } catch (error) {
    console.error("Error updating pending quote:", error);
    throw error;
  }
};

export const fetchQuotes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quote`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const fetchDrafts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/draft`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const fetchAddon = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/addon`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const fetchPendingQuotes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pending-quotes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const fetchRiskFactor = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/risk-factor`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const fetchEquipments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/equipments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const addRiskFactor = async (riskFactorData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/risk-factors/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riskFactorData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add risk factor');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Update an existing risk factor
export const updateRiskFactor = async (id, riskFactorData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/risk-factors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riskFactorData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update risk factor');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Delete a risk factor (soft delete)
export const deleteRiskFactor = async (id, deleteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/risk-factors/${id}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete risk factor');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const updateComponent = async (componentId, componentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/components/${componentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update component');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating component:', error);
    throw error;
  }
};

export const deleteComponent = async (componentId, deleteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/components/${componentId}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete component');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting component:', error);
    throw error;
  }
};

export const addComponent = async (componentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/components/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add component');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding component:', error);
    throw error;
  }
};

export const fetchSectionslist = async (skip = 0, take = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sections`, {
      params: { skip, take }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sections:', error);
    throw error;
  }
};


export const fetchSectionList = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sections-list`);
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy details:', error);
    throw error;
  }
};

export const updateSectionList = async (sectionId, sectionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sections/${sectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sectionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update section');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

export const deleteSection = async (sectionId, deleteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sections/${sectionId}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete section');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
};

export const addSection = async (sectionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sections/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sectionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add section');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding section:', error);
    throw error;
  }
};


export const addAddonCover = async (riskFactorData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addon-covers/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riskFactorData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add risk factor');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Update an existing risk factor
export const updateAddonCover = async (id, riskFactorData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addon-covers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riskFactorData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update risk factor');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Delete a risk factor (soft delete)
export const deleteAddonCover = async (id, deleteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/addon-covers/${id}/delete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete risk factor');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const saveDraft = async (submittedAddresses, currentUser, currentStep, addressesJSON, time) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        current_step: currentStep,
        addressesJSON,
        time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save draft');
    }
    
    return data;
  } catch (error) {
    console.error("Error saving draft:", error);
    throw error;
  }
};

export const updateDraft = async (draftId, submittedAddresses, currentUser, currentStep, addressesJSON, time, updatedBy) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-draft/${draftId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submittedAddresses,
        user: currentUser,
        current_step: currentStep,
        addressesJSON,
        time,
        updated_by: updatedBy,
        updated_time: time
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update draft');
    }
    
    return data;
  } catch (error) {
    console.error("Error updating draft:", error);
    throw error;
  }
};

export const deleteDraft = async (draftId, deletedBy, time) => {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-draft/${draftId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deleted_by: deletedBy,
        deleted_time: time
      })
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete draft');
    }
    
    return data;
  } catch (error) {
    console.error("Error deleting draft:", error);
    throw error;
  }
};
