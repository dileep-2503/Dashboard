import React, { useState, useEffect } from 'react';
import { fetchPincode, addPincodeDetails, updatePincodeDetails, deletePincodeDetails } from '../api/api';
import '../styles/Pincode.css';

const Pincode = (user) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPincode, setSelectedPincode] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pagination, setPagination] = useState({
    skip: 0,
    take: 10,
    total: 0,
    hasMore: false
  });

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

  const [newPincode, setNewPincode] = useState({
    pincode: '',
    state: '',
    district: '',
    area: '',
    created_by: user.user,
    created_time: formatDate(new Date().toISOString())
  });

  const fetchData = async (skip, take) => {
    try {
      setLoading(true);
      const response = await fetchPincode(skip, take);
      setData(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.skip, pagination.take);
  }, [pagination.skip, pagination.take]);

  const handlePageChange = (newSkip) => {
    setPagination(prev => ({
      ...prev,
      skip: newSkip
    }));
  };

  const handlePageSizeChange = (event) => {
    const newTake = parseInt(event.target.value);
    setPagination(prev => ({
      ...prev,
      take: newTake,
      skip: 0
    }));
  };

  const handleEdit = (id) => {
    const pincodeToEdit = data.find(item => item.pincode_id === id);
    if (pincodeToEdit) {
      setSelectedPincode(id);
      setNewPincode({
        pincode: pincodeToEdit.pincode,
        state: pincodeToEdit.state,
        district: pincodeToEdit.district,
        area: pincodeToEdit.area,
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
      
      await deletePincodeDetails(confirmDelete, deletePayload);
      fetchData(pagination.skip, pagination.take);
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
    setNewPincode({
      pincode: '',
      state: '',
      district: '',
      area: '',
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedPincode(null);
    setNewPincode({
      pincode: '',
      state: '',
      district: '',
      area: '',
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPincode(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!newPincode.pincode || !newPincode.state || !newPincode.district || !newPincode.area) {
        setError('All fields are required');
        return;
      }

      if (isEditMode && selectedPincode) {
        await updatePincodeDetails(selectedPincode, newPincode);
      } else {
        await addPincodeDetails(newPincode);
      }
      fetchData(pagination.skip, pagination.take);
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Function to download all pincode data as CSV
  const downloadAllPincodes = async () => {
    try {
      setLoading(true);
      const response = await fetchPincode(0, pagination.total || 1000);
      const allData = response.data;
      
      const headers = ['Pincode', 'State', 'District', 'Area'];
      let csvContent = headers.join(',') + '\n';
      
      allData.forEach(item => {
        const row = [
          item.pincode,
          `"${item.state.replace(/"/g, '""')}"`,
          `"${item.district.replace(/"/g, '""')}"`,
          `"${item.area.replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'pincode_details.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      setError('Failed to download pincode data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  const totalPages = Math.ceil(pagination.total / pagination.take);
  const currentPage = Math.floor(pagination.skip / pagination.take) + 1;

  return (
    <div className="pincode-container">
      <div className="action-buttons">
        <button className="add-button" onClick={openModal}>
          Add Pincode
        </button>
        
        <button className="add-button" onClick={downloadAllPincodes}>
          Download as CSV
        </button>
      </div>
      
      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditMode ? 'Edit Pincode' : 'Add New Pincode'}</h3>
            
            <div className="form-group">
              <label htmlFor="pincode">Pincode:</label>
              <input
                type="number"
                id="pincode"
                name="pincode"
                value={newPincode.pincode}
                onChange={handleInputChange}
                placeholder="Enter pincode"
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="state">State:</label>
              <input
                type="text"
                id="state"
                name="state"
                value={newPincode.state}
                onChange={handleInputChange}
                placeholder="Enter state"
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="district">District:</label>
              <input
                type="text"
                id="district"
                name="district"
                value={newPincode.district}
                onChange={handleInputChange}
                placeholder="Enter district"
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="area">Area:</label>
              <input
                type="text"
                id="area"
                name="area"
                value={newPincode.area}
                onChange={handleInputChange}
                placeholder="Enter area"
                className="form-input"
                required
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
            <p>Are you sure you want to delete this pincode?</p>
            <div className="modal-buttons">
              <button className="delete-button" onClick={confirmDeleteAction}>Delete</button>
              <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <h2>Pincode Details</h2>
      <div className="table-container">
        <table className="pincode-table">
          <thead>
            <tr className="table-header">
              <th>Pincode</th>
              <th>State</th>
              <th>District</th>
              <th>Area</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="table-cell">{row.pincode}</td>
                <td className="table-cell">{row.state}</td>
                <td className="table-cell">{row.district}</td>
                <td className="table-cell">{row.area}</td>
                <td className="table-cell action-cell">
                  <button 
                    onClick={() => handleEdit(row.pincode_id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(row.pincode_id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-controls">
          <div className="page-size-selector">
            Show
            <select 
              value={pagination.take} 
              onChange={handlePageSizeChange}
              className="page-size-select"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            entries
          </div>

          <div className="pagination-buttons">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(pagination.skip - pagination.take)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.skip + pagination.take)}
              disabled={!pagination.hasMore}
              className="pagination-button"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange((totalPages - 1) * pagination.take)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pincode;