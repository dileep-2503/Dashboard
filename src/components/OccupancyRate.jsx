import React, { useState, useEffect } from 'react';
import { fetchOccupancyRate, fetchOccupancyColumns, addOccupancyRate, updateOccupancyRate, deleteOccupancyRate } from '../api/api';
import Select from 'react-select';
import '../styles/OccupancyRate.css';

const OccupancyRate = (user) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [eqZoneRateConcept, setEqZoneRateConcept] = useState('');
  const [headerOptions, setHeaderOptions] = useState([]);
  const [eqZoneCovers, setEqZoneCovers] = useState([
    { zone: 'I', cover: '' },
    { zone: 'II', cover: '' },
    { zone: 'III', cover: '' },
    { zone: 'IV', cover: '' }
  ]);

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

  const [newRate, setNewRate] = useState({
    rate_type: '',
    cover_titles: [],
    created_by: user.user,
    created_time: formatDate(new Date().toISOString()),
    eq_zone_rate_concept: '',
    eq_zone_covers: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchOccupancyRate();
        const columnsData = await fetchOccupancyColumns();
        setColumns(columnsData);
        setSelectOptions(columnsData.map(column => ({ value: column, label: column })));
        setData(response);
        
        // Set header options from first row if available
        if (response.length > 0 && response[0].header) {
          const headers = response[0].header.split(', ').map(header => ({
            value: header,
            label: header
          }));
          setHeaderOptions(headers);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const [coverMappings, setCoverMappings] = useState([]);


  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetchOccupancyRate();
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    const rateToEdit = data.find(rate => rate.occupancy_rate_id === id);
    if (rateToEdit) {
      // Convert comma-separated string to array for the select input
      const coverTitlesArray = rateToEdit.cover_title ? rateToEdit.cover_title.split(', ') : [];
      const headersArray = rateToEdit.header ? rateToEdit.header.split(', ') : [];

      const initialCoverMappings = coverTitlesArray.map((cover, index) => ({
        cover: cover,
        header: headersArray[index] || ''
      }));
      setCoverMappings(initialCoverMappings);

      let parsedEqZoneCovers = [
        { zone: 'I', cover: '' },
        { zone: 'II', cover: '' },
        { zone: 'III', cover: '' },
        { zone: 'IV', cover: '' }
      ];

      const parsedData = rateToEdit.eq_zone_data ? JSON.parse(rateToEdit.eq_zone_data) : '';

      if (rateToEdit.eq_zone_data !== null) {
        
        if (parsedData.concept === 'Direct') {
          parsedEqZoneCovers = [
            { zone: 'I', cover: parsedData.mappings['I'] || '' },
            { zone: 'II', cover: parsedData.mappings['II'] || '' },
            { zone: 'III', cover: parsedData.mappings['III'] || '' },
            { zone: 'IV', cover: parsedData.mappings['IV'] || '' }
          ];
        } else if (parsedData.concept === 'Loading Factor') {
          parsedEqZoneCovers = [
            { zone: 'I', cover: parsedData.cover },
            { zone: 'II', cover: parsedData.cover },
            { zone: 'III', cover: parsedData.cover },
            { zone: 'IV', cover: parsedData.cover }
          ];
        }
      }

      setSelectedRate(id);
      setNewRate({
        rate_type: rateToEdit.rate_type,
        header: rateToEdit.header,
        cover_titles: coverTitlesArray,
        updated_by: user.user,
        updated_time: formatDate(new Date().toISOString()),
        eq_zone_rate_concept: parsedData?.concept || '',
        eq_zone_covers: parsedEqZoneCovers
      });
      
      setEqZoneRateConcept(parsedData?.concept || '',);
      setEqZoneCovers(parsedEqZoneCovers);
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
      
      await deleteOccupancyRate(confirmDelete, deletePayload);
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
    setNewRate({
      rate_type: '',
      cover_titles: [],
      created_by: user.user,
      created_time: formatDate(new Date().toISOString()),
      eq_zone_rate_concept: '',
      eq_zone_covers: [
        { zone: 'I', cover: '' },
        { zone: 'II', cover: '' },
        { zone: 'III', cover: '' },
        { zone: 'IV', cover: '' }
      ]
    });
    setEqZoneRateConcept('');
    setEqZoneCovers([
      { zone: 'I', cover: '' },
      { zone: 'II', cover: '' },
      { zone: 'III', cover: '' },
      { zone: 'IV', cover: '' }
    ]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedRate(null);
    setNewRate({
      rate_type: '',
      cover_titles: [],
      created_by: user.user,
      created_time: formatDate(new Date().toISOString()),
      eq_zone_rate_concept: '',
      eq_zone_covers: [
        { zone: 'I', cover: '' },
        { zone: 'II', cover: '' },
        { zone: 'III', cover: '' },
        { zone: 'IV', cover: '' }
      ]
    });
    setEqZoneRateConcept('');
    setEqZoneCovers([
      { zone: 'I', cover: '' },
      { zone: 'II', cover: '' },
      { zone: 'III', cover: '' },
      { zone: 'IV', cover: '' }
    ]);
  };

  const handleInputChange = (e) => {
    setNewRate({
      ...newRate,
      rate_type: e.target.value
    });
  };

  const handleSelectChange = (selectedOptions) => {
    const selectedCoverTitles = selectedOptions ? selectedOptions.map(option => option.value) : [];
    
    const newCoverMappings = selectedCoverTitles.map(cover => ({
      cover: cover,
      header: ''
    }));
    setCoverMappings(newCoverMappings);
    
    // Clear eq zone concept if no covers selected or Direct selected with less than 4 covers
    if (selectedCoverTitles.length === 0 || 
        (eqZoneRateConcept === 'Direct' && selectedCoverTitles.length < 4)) {
      setEqZoneRateConcept('');
      setEqZoneCovers([
        { zone: 'I', cover: '' },
        { zone: 'II', cover: '' },
        { zone: 'III', cover: '' },
        { zone: 'IV', cover: '' }
      ]);
    }
  
    setNewRate(prev => ({
      ...prev,
      cover_titles: selectedCoverTitles,
      eq_zone_rate_concept: selectedCoverTitles.length === 0 ? '' : 
        (eqZoneRateConcept === 'Direct' && selectedCoverTitles.length < 4) ? '' : 
        prev.eq_zone_rate_concept,
      eq_zone_covers: selectedCoverTitles.length === 0 ? [
        { zone: 'I', cover: '' },
        { zone: 'II', cover: '' },
        { zone: 'III', cover: '' },
        { zone: 'IV', cover: '' }
      ] : prev.eq_zone_covers
    }));
  };

  const handleHeaderChange = (coverIndex, selectedOption) => {
    const updatedMappings = [...coverMappings];
    updatedMappings[coverIndex].header = selectedOption.value;
    setCoverMappings(updatedMappings);
  };

  const handleEqZoneRateConceptChange = (e) => {
    const concept = e.target.value;
    setEqZoneRateConcept(concept);
    setNewRate({
      ...newRate,
      eq_zone_rate_concept: concept
    });
  };

  const handleEqZoneCoverChange = (index, selectedOption) => {
    const updatedCovers = [...eqZoneCovers];
    updatedCovers[index].cover = selectedOption ? selectedOption.value : '';
    
    setEqZoneCovers(updatedCovers);
    setNewRate({
      ...newRate,
      eq_zone_covers: updatedCovers
    });
  };

  const getMappedHeader = (coverTitle) => {
    const mapping = coverMappings.find(m => m.cover === coverTitle);
    return mapping?.header || coverTitle;
  };

  const getAvailableCoverOptions = (currentIndex) => {
    const selectedCovers = eqZoneCovers
      .filter((cover, idx) => idx !== currentIndex && cover.cover)
      .map(cover => cover.cover);
    
    return newRate.cover_titles
      .filter(cover => !selectedCovers.includes(cover))
      .map(cover => ({
        value: cover,
        label: cover
      }));
  };

  const handleSubmit = async () => {
    try {

      const coverToHeaderMappings = coverMappings.reduce((acc, mapping) => {
        acc[mapping.cover] = mapping.header;
        return acc;
      }, {});

      let eq_zone_data = null;
      if (newRate.eq_zone_rate_concept) {
        if (eqZoneRateConcept === 'Direct') {
          eq_zone_data = {
            concept: 'Direct',
            mappings: eqZoneCovers.reduce((acc, zone) => {
              acc[zone.zone] = zone.cover;
              return acc;
            }, {}),
            coverMappings: coverToHeaderMappings
          };
        } else if (eqZoneRateConcept === 'Loading Factor') {
          eq_zone_data = {
            concept: 'Loading Factor',
            cover: eqZoneCovers[0].cover,
            coverMappings: coverToHeaderMappings
          };
        }
      }

      const submitData = {
        ...newRate,
        eq_zone_data: eq_zone_data ? JSON.stringify(eq_zone_data) : null
      };
      
      if (submitData.eq_zone_covers) delete submitData.eq_zone_covers;

      if (isEditMode && selectedRate) {
        await updateOccupancyRate(selectedRate, submitData);
      } else {
        await addOccupancyRate(submitData);
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
    <div className="occupancy-container">
      <button className="add-button" onClick={openModal}>Add Occupancy Rate</button>
      
      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditMode ? 'Edit Occupancy Rate' : 'Add New Occupancy Rate'}</h3>
            <div className="form-group">
              <label htmlFor="rate_type">Rate Type:</label>
              <input
                type="text"
                id="rate_type"
                value={newRate.rate_type}
                onChange={handleInputChange}
                placeholder="Enter rate type"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Cover Titles (Select Multiple):</label>
              <Select
                isMulti
                name="cover_titles"
                options={selectOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                onChange={handleSelectChange}
                placeholder="Select cover titles..."
                value={selectOptions.filter(option => newRate.cover_titles.includes(option.value))}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>

            <div className="form-group">
              {newRate.cover_titles.length > 0 && (
                <table className="cover-mapping-table">
                  <thead>
                    <tr>
                      <th>Cover Title</th>
                      <th>Header</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newRate.cover_titles.map((cover, index) => (
                      <tr key={index}>
                        <td>{cover}</td>
                        <td>
                          <Select
                            name={`header_${index}`}
                            options={headerOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            onChange={(selectedOption) => handleHeaderChange(index, selectedOption)}
                            value={coverMappings[index]?.header ? 
                              { value: coverMappings[index].header, label: coverMappings[index].header } : 
                              null}
                            placeholder="Select header..."
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Eq Zone Rate Concept fields appear only when exactly 4 covers are selected */}
            {newRate.cover_titles.length > 0 && (
              <div className="eq-zone-section">
                <div className="form-group">
                  <label htmlFor="eq_zone_rate_concept">Eq Zone Rate Concept:</label>
                  <select
                    id="eq_zone_rate_concept"
                    value={eqZoneRateConcept}
                    onChange={handleEqZoneRateConceptChange}
                    className="form-input"
                  >
                    <option value="">Select an option</option>
                    {newRate.cover_titles.length >= 4 && (
                      <option value="Direct">Direct</option>
                    )}
                    <option value="Loading Factor">Loading Factor</option>
                  </select>
                </div>
                
                {eqZoneRateConcept === 'Direct' && (
                  <div className="eq-zone-table">
                    <table className="eq-zone-mapping">
                      <thead>
                        <tr>
                          <th>Eq Zone</th>
                          <th>Cover Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eqZoneCovers.map((zone, index) => (
                          <tr key={zone.zone}>
                            <td>{zone.zone}</td>
                            <td>
                              <Select
                                name={`eq_zone_cover_${index}`}
                                options={getAvailableCoverOptions(index)}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                onChange={(selectedOption) => handleEqZoneCoverChange(index, selectedOption)}
                                placeholder="Select cover..."
                                value={zone.cover ? {
                                  value: zone.cover,
                                  label: zone.cover 
                                } : null}
                                menuPortalTarget={document.body}
                                styles={{
                                  menuPortal: base => ({ ...base, zIndex: 9999 })
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {eqZoneRateConcept === 'Loading Factor' && (
                  <div className="eq-zone-loading">
                    <div className="form-group">
                      <label>Select Earthquake Cover:</label>
                      <Select
                        name="earthquake_cover"
                        options={newRate.cover_titles
                          .map(cover => ({
                            value: cover,
                            label: cover
                          }))}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        onChange={(selectedOption) => {
                          const selectedCover = selectedOption?.value || '';
                          const updatedCovers = eqZoneCovers.map(zone => ({
                            ...zone,
                            cover: selectedCover
                          }));
                          setEqZoneCovers(updatedCovers);
                          setNewRate(prev => ({
                            ...prev,
                            eq_zone_covers: updatedCovers
                          }));
                        }}
                        value={eqZoneCovers[0].cover ? {
                          value: eqZoneCovers[0].cover,
                          label: eqZoneCovers[0].cover
                        } : null}
                        placeholder="Select cover..."
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: base => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
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
            <p>Are you sure you want to delete this occupancy rate?</p>
            <div className="modal-buttons">
              <button className="delete-button" onClick={confirmDeleteAction}>Delete</button>
              <button className="cancel-button" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <h2>Occupancy Rate</h2>
      <div className="table-container">
        <table className="occupancy-table">
          <thead>
            <tr className="table-header">
              <th>Rate Type</th>
              <th>Cover Titles</th>
              <th>Headers</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="table-cell">{row.rate_type}</td>
                <td className="table-cell">{row.cover_title}</td>
                <td className="table-cell">{row.header}</td>
                <td className="table-cell action-cell">
                  <button 
                    onClick={() => handleEdit(row.occupancy_rate_id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(row.occupancy_rate_id)}
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

export default OccupancyRate;