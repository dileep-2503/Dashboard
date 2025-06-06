import React, { useState, useEffect } from 'react';
import { fetchUsers, addUser, updateUser, deleteUser, fetchCategory, fetchProduct, fetchSegment, fetchUserLevel, fetchState } from '../api/api';
import Select from 'react-select';
import '../styles/UserDetails.css';

const UserDetails = (user) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [segmentOptions, setSegmentOptions] = useState([]);
  const [segmentDivisions, setSegmentDivisions] = useState({});
  const [selectedDivisions, setSelectedDivisions] = useState({});
  const [userLevelOptions, setUserLevelOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const [newUser, setNewUser] = useState({
    empid: '',
    name: '',
    username: '',
    password: '',
    segments: [],
    segment_divisions: {},
    product_access: [],
    user_category: '',
    userLevel: '',
    stateLocations: [],
    addition_product_accesss: [],
    product_restriction: [],
    created_by: user.user,
    created_time: formatDate(new Date().toISOString())
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch users, categories, and products in parallel
        const [usersResponse, categoriesResponse, productsResponse, segmentsResponse, userLevelResponse, stateResponse] = await Promise.all([
          fetchUsers(),
          fetchCategory(),
          fetchProduct(),
          fetchSegment(),
          fetchUserLevel(),
          fetchState()
        ]);
        
        // Set users data
        setData(usersResponse);
        
        // Process categories for the dropdown
        const categoryOpts = categoriesResponse.map(category => ({
          value: category.category,
          label: category.category
        }));
        setCategoryOptions(categoryOpts);
        
        // Process products for the dropdown
        const productOpts = productsResponse.map(product => ({
          value: product.name || product.product_name,
          label: product.name
        }));
        setProductOptions(productOpts);

        const segmentOpts = segmentsResponse.map(item => ({
          value: item.segment,
          label: item.segment
        }));
        setSegmentOptions(segmentOpts);
        
        // Store divisions for each segment
        const divisionMap = {};
        segmentsResponse.forEach(item => {
          divisionMap[item.segment] = item.division.split(', ').map(div => ({
            value: div,
            label: div
          }));
        });
        setSegmentDivisions(divisionMap);

        const userLevelOpts = userLevelResponse.map(level => ({
          value: level.level_name,
          label: level.level_name
        }));
        setUserLevelOptions(userLevelOpts);
        const stateOpts = stateResponse.map(state => ({
          value: state,
          label: state
        }));
        setStateOptions(stateOpts);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetchUsers();
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOptions = (currentField) => {
    const selectedProductAccess = new Set(newUser.product_access || []);
    const selectedAdditionalAccess = new Set(newUser.addition_product_accesss || []);
    const selectedRestrictions = new Set(newUser.product_restriction || []);
  
    return productOptions.filter(option => {
      switch(currentField) {
        case 'product_access':
          return !selectedAdditionalAccess.has(option.value) && 
                 !selectedRestrictions.has(option.value);
        case 'addition_product_accesss':
          return !selectedProductAccess.has(option.value) && 
                 !selectedRestrictions.has(option.value);
        case 'product_restriction':
          return !selectedProductAccess.has(option.value) && 
                 !selectedAdditionalAccess.has(option.value);
        default:
          return true;
      }
    });
  };

  const handleUserLevelChange = (selectedOption) => {
    setNewUser({
      ...newUser,
      userLevel: selectedOption ? selectedOption.value : ''
    });
  };

  const handleEdit = (id) => {
    const userToEdit = data.find(user => user.user_id === id);
    if (userToEdit) {
      const productAccessArray = userToEdit.product_access ? userToEdit.product_access.split(',') : [];
      const additionalProductsArray = userToEdit.addition_product_accesss ? userToEdit.addition_product_accesss.split(',') : [];
      const restrictionsArray = userToEdit.product_restriction ? userToEdit.product_restriction.split(',') : [];
      const stateLocationsArray = userToEdit.state_location ? userToEdit.state_location.split(',') : [];
      
      // Parse the segment_divisions JSON and extract segments
      const segmentDivisionsObj = userToEdit.segments ? 
        JSON.parse(userToEdit.segments) : {};
      const segmentsArray = Object.keys(segmentDivisionsObj);
  
      setSelectedDivisions(segmentDivisionsObj);
      
      setSelectedUser(id);
      setNewUser({
        empid: userToEdit.empid,
        name: userToEdit.name,
        username: userToEdit.username,
        password: '',
        segments: segmentsArray,
        segment_divisions: segmentDivisionsObj,
        product_access: productAccessArray,
        user_category: userToEdit.user_category,
        userLevel: userToEdit.user_level,
        stateLocations: stateLocationsArray,
        addition_product_accesss: additionalProductsArray,
        product_restriction: restrictionsArray,
        updated_by: user.user,
        updated_time: formatDate(new Date().toISOString())
      });
      setIsEditMode(true);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    try {
      const deletePayload = {
        deleted_by: user.user,
        deleted_time: formatDate(new Date().toISOString())
      };
      
      await deleteUser(confirmDelete, deletePayload);
      await refreshData();
      setConfirmDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setNewUser({
      empid: '',
      name: '',
      username: '',
      password: '',
      segments: [],
      segment_divisions: {},
      product_access: [],
      user_category: '',
      userLevel: '',
      stateLocations: [],
      addition_product_accesss: [],
      product_restriction: [],
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUser(null);
    setNewUser({
      empid: '',
      name: '',
      username: '',
      password: '',
      segments: [],
      segment_divisions: {},
      product_access: [],
      user_category: '',
      stateLocations: [],
      userLevel: '',
      addition_product_accesss: [],
      product_restriction: [],
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewUser({
      ...newUser,
      [id]: value
    });
  };

  const handleSelectChange = (selectedOptions, actionMeta) => {
    const fieldName = actionMeta.name;
    setNewUser({
      ...newUser,
      [fieldName]: selectedOptions ? selectedOptions.map(option => option.value) : []
    });
  };

  const handleCategoryChange = (selectedOption) => {
    setNewUser({
      ...newUser,
      user_category: selectedOption ? selectedOption.value : ''
    });
  };

  const handleSubmit = async () => {
    try {
      const userData = {
        ...newUser,
        segments: JSON.stringify(newUser.segment_divisions),
        stateLocations: newUser.stateLocations.join(',')
      };
      
      if (isEditMode && selectedUser) {
        await updateUser(selectedUser, userData);
      } else {
        await addUser(userData);
      }
      await refreshData();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <div className="user-details-container">
      <button className="add-button" onClick={openModal}>Add New User</button>
      
      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditMode ? 'Edit User' : 'Add New User'}</h3>
            
            <div className="form-group">
              <label htmlFor="empid">Employee ID:</label>
              <input
                type="text"
                id="empid"
                value={newUser.empid}
                onChange={handleInputChange}
                placeholder="Enter employee ID"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={newUser.name}
                onChange={handleInputChange}
                placeholder="Enter name"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={newUser.username}
                onChange={handleInputChange}
                placeholder="Enter username"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={newUser.password}
                onChange={handleInputChange}
                placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Segments:</label>
              <Select
                isMulti
                name="segments"
                options={segmentOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={(selected, action) => {
                  handleSelectChange(selected, action);
                  // Initialize divisions for newly selected segments
                  const newSelectedDivisions = { ...selectedDivisions };
                  if (selected) {
                    selected.forEach(segment => {
                      if (!newSelectedDivisions[segment.value]) {
                        newSelectedDivisions[segment.value] = [];
                      }
                    });
                    // Remove divisions for unselected segments
                    Object.keys(newSelectedDivisions).forEach(segment => {
                      if (!selected.find(s => s.value === segment)) {
                        delete newSelectedDivisions[segment];
                      }
                    });
                  }
                  setSelectedDivisions(newSelectedDivisions);
                  setNewUser(prev => ({
                    ...prev,
                    segment_divisions: newSelectedDivisions
                  }));
                }}
                placeholder="Select segments..."
                value={segmentOptions.filter(option => 
                  newUser.segments && newUser.segments.includes(option.value)
                )}
              />
              
              {newUser.segments && newUser.segments.length > 0 && (
                <div className="segment-divisions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Segment</th>
                        <th>Divisions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newUser.segments.map(segment => (
                        <tr key={segment}>
                          <td>{segment}</td>
                          <td>
                            <Select
                              isMulti
                              name={`divisions-${segment}`}
                              options={segmentDivisions[segment] || []}
                              className="react-select-container"
                              classNamePrefix="react-select"
                              onChange={(selected) => {
                                const newSelectedDivisions = {
                                  ...selectedDivisions,
                                  [segment]: selected ? selected.map(option => option.value) : []
                                };
                                setSelectedDivisions(newSelectedDivisions);
                                setNewUser(prev => ({
                                  ...prev,
                                  segment_divisions: newSelectedDivisions
                                }));
                              }}
                              value={(segmentDivisions[segment] || []).filter(option => 
                                selectedDivisions[segment]?.includes(option.value)
                              )}
                              placeholder="Select divisions..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>User Category:</label>
              <Select
                name="user_category"
                options={categoryOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={handleCategoryChange}
                placeholder="Select user category..."
                value={categoryOptions.find(option => option.value === newUser.user_category) || null}
              />
            </div>

            <div className="form-group">
              <label>User Authority Level:</label>
              <Select
                name="userLevel"
                options={userLevelOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={handleUserLevelChange}
                placeholder="Select authority level..."
                value={userLevelOptions.find(option => option.value === newUser.userLevel) || null}
              />
            </div>

            <div className="form-group">
              <label>State Location:</label>
              <Select
                isMulti
                name="stateLocations"
                options={stateOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={(selected, action) => {
                  handleSelectChange(selected, action);
                }}
                placeholder="Select states..."
                value={stateOptions.filter(option => 
                  newUser.stateLocations && newUser.stateLocations.includes(option.value)
                )}
              />
            </div>
            
            <div className="form-group">
              <label>Product Access:</label>
              <Select
                isMulti
                name="product_access"
                options={getFilteredOptions('product_access')}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={handleSelectChange}
                placeholder="Select products..."
                value={productOptions.filter(option => newUser.product_access.includes(option.value))}
              />
            </div>
            
            <div className="form-group">
              <label>Additional Product Access:</label>
              <Select
                isMulti
                name="addition_product_accesss"
                options={getFilteredOptions('addition_product_accesss')}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={handleSelectChange}
                placeholder="Select additional products..."
                value={productOptions.filter(option => newUser.addition_product_accesss.includes(option.value))}
              />
            </div>
            
            <div className="form-group">
              <label>Product Restrictions:</label>
              <Select
                isMulti
                name="product_restriction"
                options={getFilteredOptions('product_restriction')}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={handleSelectChange}
                placeholder="Select product restrictions..."
                value={productOptions.filter(option => newUser.product_restriction.includes(option.value))}
              />
            </div>
            
            <div className="modal-buttons">
              <button className="submit-button" onClick={handleSubmit}>
                {isEditMode ? 'Update' : 'Add'}
              </button>
              <button className="cancel-button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog for Delete */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this user?</p>
            <div className="modal-buttons">
              <button className="delete-button" onClick={confirmDeleteAction}>Delete</button>
              <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <h2>User Details</h2>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr className="table-header">
              <th>User ID</th>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Product Access</th>
              <th>User Category</th>
              <th>Authority Level</th>
              <th>State Location</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.user_id} className="table-row">
                <td className="table-cell">{row.user_id}</td>
                <td className="table-cell">{row.empid}</td>
                <td className="table-cell">{row.name}</td>
                <td className="table-cell">{row.product_access}</td>
                <td className="table-cell">{row.user_category}</td>
                <td className="table-cell">{row.user_level}</td>
                <td className="table-cell">{row.state_location}</td>
                <td className="table-cell action-cell">
                  <button 
                    onClick={() => handleEdit(row.user_id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(row.user_id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDetails;