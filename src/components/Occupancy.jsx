import React, { useState, useEffect } from 'react';
import { fetchOccupancies, uploadOccupancyCSV, addTableColumns } from '../api/api';
import '../styles/Occupancy.css';

const Occupancy = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [pagination, setPagination] = useState({
    skip: 0,
    take: 10,
    total: 0,
    hasMore: false
  });

  // Column management states
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [columns, setColumns] = useState([]);
  const [newColumn, setNewColumn] = useState('');
  const [isAddingColumns, setIsAddingColumns] = useState(false);
  const [columnError, setColumnError] = useState(null);

  const fetchData = async (skip, take) => {
    try {
      setLoading(true);
      const response = await fetchOccupancies(skip, take);
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
      skip: 0 // Reset to first page when changing page size
    }));
  };

  const handleDelete = (id) => {
    console.log('Delete clicked for ID:', id);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadStatus('Uploading CSV file...');
      await uploadOccupancyCSV(formData);
      setUploadStatus('CSV file uploaded successfully!');
      // Refresh data after successful upload
      fetchData(pagination.skip, pagination.take);
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      // Clear status message after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // New function to fetch all data for download
  const fetchAllData = async () => {
    try {
      // Make an API call to get all data without pagination
      // Assuming the API supports a parameter to get all data
      // You may need to modify your API to support this or use a different endpoint
      const response = await fetchOccupancies(0, pagination.total || 1000, true);
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch all data: ${err.message}`);
    }
  };

  // Updated function to handle CSV download with all data
  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      setUploadStatus('Preparing download...');
      
      // Fetch all data from server
      const allData = await fetchAllData();
      
      if (allData.length === 0) {
        setUploadStatus("No data to download");
        return;
      }

      const headers = [
        'code',
        'name',
        'risk_category',
        'IIB_basic',
        'IIB_stfi',
        'IIB_eq1',
        'IIB_eq2',
        'IIB_eq3',
        'IIB_eq4',
        'IIB_terrorism'
      ];

      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add data rows
      allData.forEach(row => {
        const rowValues = headers.map(header => {
          // Handle values that might contain commas by wrapping in quotes
          const value = String(row[header] || '');
          return value.includes(',') ? `"${value}"` : value;
        });
        csvContent += rowValues.join(',') + '\n';
      });

      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `occupancy_data_full_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setUploadStatus('Download completed!');
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setDownloading(false);
      // Clear status message after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // Column management functions
  const handleAddColumnClick = () => {
    setShowColumnForm(true);
    setColumnError(null);
  };

  const handleColumnInputKeyDown = (e) => {
    if (e.key === 'Enter' && newColumn.trim()) {
      // Add column to the list
      setColumns([...columns, newColumn.trim()]);
      setNewColumn(''); // Clear input
      e.preventDefault();
    }
  };

  const handleRemoveColumn = (index) => {
    const updatedColumns = [...columns];
    updatedColumns.splice(index, 1);
    setColumns(updatedColumns);
  };

  const handleAddColumnsSubmit = async () => {
    if (columns.length === 0) {
      setColumnError('Please add at least one column');
      return;
    }

    try {
      setIsAddingColumns(true);
      setColumnError(null);
      
      // Use the API function from the api.js file
      await addTableColumns(columns);
      
      // Success - reset state and refresh data
      setColumns([]);
      setShowColumnForm(false);
      fetchData(pagination.skip, pagination.take);
      
    } catch (err) {
      setColumnError(err.message || 'Failed to add columns');
    } finally {
      setIsAddingColumns(false);
    }
  };

  const handleCancelAddColumns = () => {
    setShowColumnForm(false);
    setColumns([]);
    setNewColumn('');
    setColumnError(null);
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
    <div className="occupancy-container">
      <div className='occupancy-button-container'>
        <button className="upload-button">
          <label className="csv-upload-button">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </label>
        </button>
        
        {/* Download CSV button */}
        <button 
          className="add-button" 
          onClick={handleDownloadCSV}
          disabled={downloading}
        >
          {downloading ? 'Preparing Download...' : 'Download CSV'}
        </button>
        
        {/* Integrated column management */}
        {!showColumnForm ? (
          <button className="add-button" onClick={handleAddColumnClick}>
            Add Columns
          </button>
        ) : (
          <div className="column-form">
            <h3>Add New Columns</h3>
            <div className="input-container">
              <input
                type="text"
                value={newColumn}
                onChange={(e) => setNewColumn(e.target.value)}
                onKeyDown={handleColumnInputKeyDown}
                placeholder="Enter column name and press Enter"
                disabled={isAddingColumns}
                className="column-input"
              />
            </div>

            {columns.length > 0 && (
              <div className="columns-list">
                <h4>Columns to add:</h4>
                <ul>
                  {columns.map((col, index) => (
                    <li key={index} className="column-item">
                      {col}
                      <button 
                        onClick={() => handleRemoveColumn(index)}
                        className="remove-column-btn"
                        disabled={isAddingColumns}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {columnError && <div className="error-message">{columnError}</div>}

            <div className="column-form-buttons">
              <button 
                onClick={handleAddColumnsSubmit} 
                disabled={isAddingColumns || columns.length === 0}
                className="submit-columns-btn"
              >
                {isAddingColumns ? 'Adding...' : 'Add Columns'}
              </button>
              <button 
                onClick={handleCancelAddColumns} 
                disabled={isAddingColumns}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
      </div>
      
      <h2>Occupancy</h2>
      <div className="table-container">
        <table className="occupancy-table">
          <thead>
            <tr className="table-header">
              <th>Code</th>
              <th>Name</th>
              <th>Risk Category</th>
              <th>Basic</th>
              <th>STFI</th>
              <th>EQ1</th>
              <th>EQ2</th>
              <th>EQ3</th>
              <th>EQ4</th>
              <th>Terrorism</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="table-cell">{row.code}</td>
                <td className="table-cell">{row.name}</td>
                <td className="table-cell">{row.risk_category}</td>
                <td className="table-cell">{row.IIB_basic}</td>
                <td className="table-cell">{row.IIB_stfi}</td>
                <td className="table-cell">{row.IIB_eq1}</td>
                <td className="table-cell">{row.IIB_eq2}</td>
                <td className="table-cell">{row.IIB_eq3}</td>
                <td className="table-cell">{row.IIB_eq4}</td>
                <td className="table-cell">{row.IIB_terrorism}</td>
                <td className="table-cell action-cell">
                  <button 
                    onClick={() => handleDelete(row.id)}
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

export default Occupancy;