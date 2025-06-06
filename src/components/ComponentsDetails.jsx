import React, { useState, useEffect } from 'react';
import { fetchComponents, addComponent, updateComponent, deleteComponent } from '../api/api';
import '../styles/ComponentDetails.css';

const Components = (user) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

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

  const [newComponent, setNewComponent] = useState({
    component_name: '',
    created_by: user.user,
    created_time: formatDate(new Date().toISOString())
  });

  useEffect(() => {
    fetchAllData();
  }, [skip, take]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await fetchComponents(skip, take);
      
      // Handle the new response format
      if (response.data) {
        setData(response.data);
        if (response.pagination && response.pagination.total) {
          setTotalRecords(response.pagination.total);
        }
      } else {
        // Fallback for backwards compatibility
        setData(response);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    fetchAllData();
  };

  const handlePageChange = (newSkip) => {
    setSkip(newSkip);
  };

  const handlePageSizeChange = (event) => {
    setTake(parseInt(event.target.value));
    setSkip(0); // Reset to first page when changing page size
  };

  const handleEdit = (id) => {
    const componentToEdit = data.find(component => component.component_id === id);
    setSelectedComponent(id);
    if (componentToEdit) {
      setNewComponent({
        component_name: componentToEdit.component_name,
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
      
      await deleteComponent(confirmDelete, deletePayload);
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
    setNewComponent({
      component_name: '',
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedComponent(null);
    setNewComponent({
      component_name: '',
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewComponent({
      ...newComponent,
      [id]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode) {
        await updateComponent(selectedComponent, newComponent);
      } else {
        await addComponent(newComponent);
      }
      await refreshData();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalRecords / take);
  const currentPage = Math.floor(skip / take) + 1;

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <div className="user-details-container">
      <button className="add-button" onClick={openModal}>Add Component</button>
      
      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditMode ? 'Edit User' : 'Add New User'}</h3>
            
            <div className="form-group">
              <label htmlFor="empid">Component Name:</label>
              <input
                type="text"
                id="component_name"
                value={newComponent.component_name}
                onChange={handleInputChange}
                placeholder="Enter Component Name"
                className="form-input"
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
            <p>Are you sure you want to delete this Component?</p>
            <div className="modal-buttons">
              <button className="delete-button" onClick={confirmDeleteAction}>Delete</button>
              <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <h2>Component Details</h2>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr className="table-header">
              <th>Component ID</th>
              <th>Component Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.component_id} className="table-row">
                  <td className="table-cell">{row.component_id}</td>
                  <td className="table-cell">{row.component_name}</td>
                  <td className="table-cell action-cell">
                    <button 
                      onClick={() => handleEdit(row.component_id)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(row.component_id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">No Component found</td>
              </tr>
            )}
          </tbody>
        </table>  
      </div>
      <div className="pagination-controls">
        <div className="page-size-selector">
          <label htmlFor="pageSize">Items per page:</label>
          <select
            id="pageSize"
            value={take}
            onChange={handlePageSizeChange}
            className="page-size-select"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        
        <div className="page-navigation">
          <button
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(Math.max(0, skip - take))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(skip + take)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="pagination-button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange((totalPages - 1) * take)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="pagination-button"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default Components;