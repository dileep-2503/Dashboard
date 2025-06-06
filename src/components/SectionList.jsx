import React, { useState, useEffect } from 'react';
import { fetchSectionslist, addSection, updateSectionList, deleteSection } from '../api/api';
import '../styles/SectionList.css';

const SectionList = (user) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Pagination states
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

  const [newSection, setNewSection] = useState({
    section_name: '',
    created_by: user.user,
    created_time: formatDate(new Date().toISOString())
  });

  useEffect(() => {
    fetchAllData();
  }, [skip, take]); // Re-fetch when pagination params change

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await fetchSectionslist(skip, take);
      
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
    const sectionToEdit = data.find(section => section.section_id === id);
    setSelectedSection(id);
    if (sectionToEdit) {
      setNewSection({
        section_name: sectionToEdit.section_name,
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
      
      await deleteSection(confirmDelete, deletePayload);
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
    setNewSection({
      section_name: '',
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedSection(null);
    setNewSection({
      section_name: '',
      created_by: user.user,
      created_time: formatDate(new Date().toISOString())
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewSection({
      ...newSection,
      [id]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode) {
        await updateSectionList(selectedSection, newSection);
      } else {
        await addSection(newSection);
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

  if (loading && data.length === 0) {
    return <div className="loading-state">Loading...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <div className="user-details-container">
      <button className="add-button" onClick={openModal}>Add Section</button>
      
      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="section-modal-content">
            <h3>{isEditMode ? 'Edit Section' : 'Add New Section'}</h3>
            
            <div className="form-group">
              <label htmlFor="section_name">Section Name:</label>
              <input
                type="text"
                id="section_name"
                value={newSection.section_name}
                onChange={handleInputChange}
                placeholder="Enter Section Name"
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
          <div className="section-modal-content confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this Section?</p>
            <div className="modal-buttons">
              <button className="delete-button" onClick={confirmDeleteAction}>Delete</button>
              <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <h2>Section Details</h2>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr className="table-header">
              <th>Section ID</th>
              <th>Section Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.section_id} className="table-row">
                  <td className="table-cell">{row.section_id}</td>
                  <td className="table-cell">{row.section_name}</td>
                  <td className="table-cell action-cell">
                    <button 
                      onClick={() => handleEdit(row.section_id)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(row.section_id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">No sections found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
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

export default SectionList;