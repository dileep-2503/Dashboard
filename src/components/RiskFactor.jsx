import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { fetchRiskFactor, fetchOccupancyRate, fetchProduct, fetchSection, addRiskFactor, updateRiskFactor, deleteRiskFactor, fetchAddon } from '../api/api';
import '../styles/RiskFactor.css';
import { set } from 'date-fns';

const RiskFactor = (user) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eqZoneRate, setEqZoneRate] = useState(null);
  const [applyToOptions, setApplyToOptions] = useState([]);
  const [addonData, setAddonData] = useState([]);
  const [addonCoverOptions, setAddonCoverOptions] = useState([]);
  const [editingRiskFactorId, setEditingRiskFactorId] = useState(null);
  
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [sections, setSections] = useState([]);
  const [productData, setProductData] = useState([]);
  const [riskFactorItems, setRiskFactorItems] = useState([]);
  const [newRiskFactorItem, setNewRiskFactorItem] = useState('');
  const [newRiskFactor, setNewRiskFactor] = useState({
    productName: null,
    selectedSections: [],
    riskFactorName: '',
    factorType: null,
    calculationType: null,
    applyTo: [],
    addonCovers: [],
    type: null,
    remark: '',
    riskFactorListItem: null,
    minDisLoad: 0,
    maxDisLoad: 0,
    riskFactorList: '',
    riskFactorValues: {},
    zone1: '',
    zone2: '',
    zone3: '',
    zone4: ''
  });


  const getTypeOptions = () => {
    return [
      { value: 'Direct', label: 'Direct' },
      { value: 'Limit', label: 'Limit' },
      { value: 'Free Entry', label: 'Free Entry' },
      { value: 'Zone', label: 'Zone' }
    ];
  };

  const getFactorTypeOptions = () => {
    return [
      { value: 'Location', label: 'Location' },
      { value: 'Policy', label: 'Policy' }
    ];
  };
  
  const getCalculationTypeOptions = () => {
    return [
      { value: 'Multiply', label: 'Multiply' },
      { value: 'Add', label: 'Add' }
    ];
  };

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

  const handleRiskFactorItemKeyDown = (e) => {
    if (e.key === 'Enter' && newRiskFactorItem.trim()) {
      e.preventDefault();
      setRiskFactorItems([...riskFactorItems, {
        item: newRiskFactorItem.trim(),
        min: '',
        max: ''
      }]);
      setNewRiskFactorItem('');
    }
  };

  const handleItemValueChange = (index, field, value) => {
    const updatedItems = [...riskFactorItems];
    updatedItems[index][field] = value;
    setRiskFactorItems(updatedItems);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const riskFactorData = await fetchRiskFactor(); 
      setSummaries(riskFactorData);

      const productData = await fetchProduct();
      
      const productOptionsList = productData.map(product => ({
        value: product.product_id,
        label: product.name
      }));
      setProductOptions(productOptionsList);
      setProductData(productData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionsForProduct = async (productSections) => {
    try {
      const sectionsData = await fetchSection();
      const addonData = await fetchAddon();
      setAddonData(addonData);
      // Filter and map sections
      const productSectionList = productSections.split(', ');
      const filteredSections = sectionsData.filter(section => 
        productSectionList.includes(section.section_reference_name)
      );
      
      setSections(filteredSections);
      setApplyToOptions([]);

    } catch (err) {
      console.error('Failed to fetch sections', err);
      // Reset sections and apply to options if fetch fails
      setSections([]);
      setApplyToOptions([]);
    }
  };

  const handleSectionChange = async (selectedSections) => {
    setNewRiskFactor(prev => ({
      ...prev,
      selectedSections,
      applyTo: [],
      addonCovers: []
    }));
  
    if (selectedSections.length > 0) {
      try {
        const response = await fetchOccupancyRate();
        const eqZoneRate = response.find(rate => rate.eq_zone_data);
        setEqZoneRate(eqZoneRate);
        
        if (eqZoneRate && newRiskFactor.type?.value === 'Zone') {
          const eqZoneData = JSON.parse(eqZoneRate.eq_zone_data);
          
          if (eqZoneData.concept === 'Direct') {
            setApplyToOptions([]); // Clear options for Direct concept
          } else {
            // Show combined options for Loading Factor
            const coverOptions = Object.entries(eqZoneData.coverMappings).map(([coverCode, headerName]) => ({
              value: coverCode,
              label: `${coverCode}-${headerName}`
            }));
            setApplyToOptions(coverOptions);
          }
        } else {
          // Handle non-Zone types - show all section covers
          const selectedSectionNames = selectedSections.map(section => section.value);
          const covers = sections
            .filter(section => selectedSectionNames.includes(section.section_reference_name))
            .flatMap(section => section.covers.split(', '));
          
          const coverOptions = [...new Set(covers)].map(cover => ({
            value: cover,
            label: cover
          }));
          
          setApplyToOptions(coverOptions);
        }
        const selectedSectionNames = selectedSections.map(section => section.value);
       
        const addonCovers = addonData
          .filter(addon => selectedSectionNames.some(section => addon.sections.includes(section)))
          .map(addon => ({
            value: addon.addon_cover_name,
            label: addon.addon_cover_name
          }));
         
        setAddonCoverOptions(addonCovers);
      } catch (err) {
        console.error('Failed to fetch occupancy rate data:', err);
        setApplyToOptions([]);
        setAddonCoverOptions([]);
      }
    } else {
      setApplyToOptions([]);
      setAddonCoverOptions([]);
    }
  };

  // Initial data load
  useEffect(() => {
    loadInitialData();
    if (newRiskFactor.selectedSections?.length > 0) {
      handleSectionChange(newRiskFactor.selectedSections);
    }
  }, [newRiskFactor.type]);

  const handleEdit = async (summary) => {
    const product = productData.find(p => p.product_id === summary.product_id);
    
    if (product) {
      await fetchSectionsForProduct(product.section);
    }

    const zoneValues = summary.zone ? JSON.parse(summary.zone) : {};
  
    const items = summary.list ? summary.list.split(', ') : [];
    const values = summary.list_values ? JSON.parse(summary.list_values) : {};

    const formattedItems = items.map(item => ({
      item,
      min: values[item]?.min || '',
      max: values[item]?.max || ''
    }));

    setRiskFactorItems(formattedItems);
  
    setNewRiskFactor({
      factorType: { value: summary.factor_type, label: summary.factor_type },
      calculationType: summary.calculation_type ? 
        { value: summary.calculation_type, label: summary.calculation_type } : 
        null,
      productName: { value: summary.product_id, label: summary.product_name },
      selectedSections: summary.section_name.split(', ').map((cover, index) => ({
        value: index + 1,
        label: cover
      })),
      riskFactorName: summary.risk_factor_name,
      applyTo: summary.apply_to.split(', ').map((cover, index) => ({
        value: index + 1,
        label: cover
      })),
      addonCovers: summary.applied_addons ? summary.applied_addons.split(', ').map((cover, index) => ({
        value: index + 1,
        label: cover
      })) : [],
      type: { value: summary.type, label: summary.type },
      remark: summary.remark,
      riskFactorListItem: summary.list ? { value: summary.list, label: summary.list } : null,
      minDisLoad: summary.min,
      maxDisLoad: summary.max,
      zone1: zoneValues.zone1 || '',
      zone2: zoneValues.zone2 || '',
      zone3: zoneValues.zone3 || '',
      zone4: zoneValues.zone4 || '',
      riskFactorList: summary.list || '',
      riskFactorValues: values
    });
    
    setEditingRiskFactorId(summary.risk_factor_id);
    setIsAddPopupOpen(true);
  };

  // Open Add Popup
  const handleOpenAddPopup = () => {
    setIsAddPopupOpen(true);
  };

  // Close Add Popup
  const handleCloseAddPopup = () => {
    setIsAddPopupOpen(false);
    setEditingRiskFactorId(null);
    // Reset form
    setNewRiskFactor({
      productName: null,
      riskFactorName: '',
      applyTo: [],
      type: null,
      remark: '',
      riskFactorListItem: null,
      minDisLoad: 0,
      maxDisLoad: 0,
      zone1: '',
      zone2: '',
      zone3: '',
      zone4: ''

    });
  };

  // Handle Input Changes
  const handleInputChange = (name, value) => {
    setNewRiskFactor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRemoveItem = (indexToRemove) => {
    setRiskFactorItems(prevItems => 
      prevItems.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleProductChange = (selectedProduct) => {
    // Update product name in form
    setNewRiskFactor(prev => ({
      ...prev,
      productName: selectedProduct
    }));

    // Fetch sections for the selected product
    if (selectedProduct) {
      const product = productData.find(p => p.product_id === selectedProduct.value);
      fetchSectionsForProduct(product.section);
    } else {
      // Reset sections and apply to options
      setSections([]);
      setApplyToOptions([]);
    }
  };

  // Handle delete risk factor
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this risk factor?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get current timestamp and user info
      const now = formatDate(new Date().toISOString());
       // Replace with actual user info from your auth system
      
      const deleteData = {
        deleted_by: user.user,
        deleted_time: now
      };
      
      await deleteRiskFactor(id, deleteData);
      alert('Risk factor deleted successfully!');
      
      // Reload risk factors
      await loadInitialData();
    } catch (error) {
      console.error('Error deleting risk factor:', error);
      alert(`Failed to delete risk factor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Form Submit
  const handleSubmit = async () => {
    // Validate form
    if (!newRiskFactor.productName || !newRiskFactor.riskFactorName || !newRiskFactor.type) {
      alert('Please fill in required fields');
      return;
    }


    // Get current timestamp and user info
    const now = formatDate(new Date().toISOString());

    const itemsList = riskFactorItems.map(item => item.item).join(', ');
    const itemsValues = riskFactorItems.reduce((acc, item) => {
      acc[item.item] = {
        min: item.min,
        ...(newRiskFactor.type?.value === 'Limit' ? { max: item.max } : {})
      };
      return acc;
    }, {});

    const zoneValues = newRiskFactor.type?.value === 'Zone' ? {
      zone1: newRiskFactor.zone1,
      zone2: newRiskFactor.zone2,
      zone3: newRiskFactor.zone3,
      zone4: newRiskFactor.zone4
    } : null;

    // Prepare data for submission
    const submissionData = {
      risk_factor_name: newRiskFactor.riskFactorName,
      type: newRiskFactor.type.value,
      product_id: newRiskFactor.productName.value,
      factor_type: newRiskFactor.factorType.value,
      calculation_type: newRiskFactor.factorType.value === 'Policy' ? newRiskFactor.calculationType.value : null,
      product_name: newRiskFactor.productName.label,
      section_name: newRiskFactor.selectedSections.map(section => section.label).join(', '),
      apply_to: newRiskFactor.applyTo.map(item => item.label).join(', '),
      applied_addons: newRiskFactor.addonCovers.map(item => item.label).join(', '),
      list: itemsList || null,
      min: newRiskFactor.minDisLoad,
      max: newRiskFactor.maxDisLoad || 0,
      remark: newRiskFactor.remark,
      list_values: JSON.stringify(itemsValues),
      zone: zoneValues ? JSON.stringify(zoneValues) : null
    };

    try {
      setLoading(true);
      
      if (editingRiskFactorId) {
        // Update existing risk factor
        submissionData.updated_by = user.user;
        submissionData.updated_time = now;
        
        await updateRiskFactor(editingRiskFactorId, submissionData);
        alert('Risk factor updated successfully!');
      } else {
        // Add new risk factor
        submissionData.created_by = user.user;
        submissionData.created_time = now;
        
        await addRiskFactor(submissionData);
        alert('Risk factor added successfully!');
      }
      
      // Reload risk factors
      await loadInitialData();
      
      // Close popup and reset form
      handleCloseAddPopup();
    } catch (error) {
      console.error(`Error ${editingRiskFactorId ? 'updating' : 'adding'} risk factor:`, error);
      alert(`Failed to ${editingRiskFactorId ? 'update' : 'add'} risk factor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-message">Loading risk factors...</div>;
  
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="table-container">
      <div className="table-header-container">
        <h2 className="table-title">Risk Factor</h2>
        <button 
          onClick={handleOpenAddPopup} 
          className="add-button"
        >
          + Add Risk Factor
        </button>
      </div>
      
      {summaries.length === 0 ? (
        <p className="empty-message">No Risk Factor found.</p>
      ) : (
        <table className="quote-table">
          <thead className="table-header">
            <tr>
              <th>ID</th>
              <th>Risk Factor Name</th>
              <th>Product Name</th>
              <th>Type</th>
              <th>Applied Covers</th>
              <th>Min Risk %</th>
              <th>Max Risk %</th>
              <th>Remark</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.risk_factor_id} className="table-row">
                <td className="table-cell">{summary.risk_factor_id}</td>
                <td className="table-cell">{summary.risk_factor_name}</td>
                <td className="table-cell">{summary.product_name}</td>
                <td className="table-cell">{summary.type}</td>
                <td className="table-cell">{summary.apply_to}</td>
                <td className="table-cell">{summary.min}</td>
                <td className="table-cell">{summary.max}</td>
                <td className="table-cell">{summary.remark}</td>
                <td className="table-cell actions-cell">
                  <button
                    onClick={() => handleEdit(summary)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(summary.risk_factor_id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add/Edit Risk Factor Popup */}
      {isAddPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>{editingRiskFactorId ? 'Edit Risk Factor' : 'Add Risk Factor'}</h3>
            
            <div className="form-group">
              <label>Product Name</label>
              <Select
                value={newRiskFactor.productName}
                onChange={handleProductChange}
                options={productOptions}
                placeholder="Select Product"
              />
            </div>

            <div className="form-group">
              <label>Section Name</label>
              <Select
                isMulti
                value={newRiskFactor.selectedSections}
                onChange={handleSectionChange}
                options={sections.map(section => ({
                  value: section.section_reference_name,
                  label: section.section_reference_name
                }))}
                placeholder="Select Sections"
                isDisabled={!newRiskFactor.productName}
              />
            </div>

            <div className="form-group">
              <label>Factor Type</label>
              <Select
                value={newRiskFactor.factorType}
                onChange={(selected) => handleInputChange('factorType', selected)}
                options={getFactorTypeOptions()}
                placeholder="Select Factor Type"
              />
            </div>

            {newRiskFactor.factorType?.value === 'Policy' && (
              <div className="form-group">
                <label>Calculation Type</label>
                <Select
                  value={newRiskFactor.calculationType}
                  onChange={(selected) => handleInputChange('calculationType', selected)}
                  options={getCalculationTypeOptions()}
                  placeholder="Select Calculation Type"
                />
              </div>
            )}

            <div className="form-group">
              <label>Risk Factor Name</label>
              <input
                type="text"
                value={newRiskFactor.riskFactorName}
                onChange={(e) => handleInputChange('riskFactorName', e.target.value)}
                placeholder="Enter Risk Factor Name"
              />
            </div>
            <div className="form-group">
              <label>Risk Factor Type</label>
              <Select
                value={newRiskFactor.type}
                onChange={(selected) => handleInputChange('type', selected)}
                options={getTypeOptions(newRiskFactor.applyTo)}
                placeholder="Select Type"
              />
            </div>
            
            {!(newRiskFactor.type?.value === 'Zone' && 
              eqZoneRate?.eq_zone_data && 
              JSON.parse(eqZoneRate.eq_zone_data).concept === 'Direct') && (
              <div className="form-group">
                <label>Apply To</label>
                <Select
                  isMulti
                  value={newRiskFactor.applyTo}
                  onChange={(selected) => handleInputChange('applyTo', selected)}
                  options={applyToOptions}
                  placeholder="Select Applied Covers"
                  isDisabled={!newRiskFactor.selectedSections?.length}
                />
              </div>
            )}
            <div className="form-group">
              <label>Addon Covers</label>
              <Select
                isMulti
                value={newRiskFactor.addonCovers}
                onChange={(selected) => handleInputChange('addonCovers', selected)}
                options={addonCoverOptions}
                placeholder="Select Addon Covers"
                isDisabled={!newRiskFactor.selectedSections?.length}
              />
            </div>
            {(newRiskFactor.type?.value === 'Direct' || newRiskFactor.type?.value === 'Limit') && (
              <div className="form-group">
                <label>Risk Factor Items</label>
                <input
                  type="text"
                  value={newRiskFactorItem}
                  onChange={(e) => setNewRiskFactorItem(e.target.value)}
                  onKeyDown={handleRiskFactorItemKeyDown}
                  placeholder="Type item and press Enter"
                  className="risk-factor-item-input"
                />
                
                {riskFactorItems.length > 0 && (
                  <table className="risk-factor-items-table">
                    <thead>
                      <tr>
                        <th>Risk Factor Item</th>
                        {newRiskFactor.type?.value !== 'Zone' && <th>Min Dis/Load</th>}
                        {newRiskFactor.type?.value === 'Limit' && <th>Max Dis/Load</th>}
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskFactorItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.item}</td>
                          <td>
                            <input
                              type="number"
                              value={item.min}
                              onChange={(e) => handleItemValueChange(index, 'min', e.target.value)}
                              placeholder="Enter Min Value"
                            />
                          </td>
                          {newRiskFactor.type?.value === 'Limit' && (
                            <td>
                              <input
                                type="number"
                                value={item.max}
                                onChange={(e) => handleItemValueChange(index, 'max', e.target.value)}
                                placeholder="Enter Max Value"
                              />
                            </td>
                          )}
                          <td>
                            <button 
                              className="remove-item-button"
                              onClick={() => handleRemoveItem(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {newRiskFactor.type?.value === 'Zone' && eqZoneRate?.eq_zone_data && 
              JSON.parse(eqZoneRate.eq_zone_data).concept !== 'Direct' && (
              <div className="form-group earthquake-zones">
                <div className="zone-field">
                  <label>EQ Zone 1 Dis/Loading (%)</label>
                  <input
                    type="number"
                    value={newRiskFactor.zone1}
                    onChange={(e) => handleInputChange('zone1', e.target.value)}
                    placeholder="Enter Zone 1 value"
                  />
                </div>
                <div className="zone-field">
                  <label>EQ Zone 2 Dis/Loading (%)</label>
                  <input
                    type="number"
                    value={newRiskFactor.zone2}
                    onChange={(e) => handleInputChange('zone2', e.target.value)}
                    placeholder="Enter Zone 2 value"
                  />
                </div>
                <div className="zone-field">
                  <label>EQ Zone 3 Dis/Loading (%)</label>
                  <input
                    type="number"
                    value={newRiskFactor.zone3}
                    onChange={(e) => handleInputChange('zone3', e.target.value)}
                    placeholder="Enter Zone 3 value"
                  />
                </div>
                <div className="zone-field">
                  <label>EQ Zone 4 Dis/Loading (%)</label>
                  <input
                    type="number"
                    value={newRiskFactor.zone4}
                    onChange={(e) => handleInputChange('zone4', e.target.value)}
                    placeholder="Enter Zone 4 value"
                  />
                </div>
              </div>
            )}
            {newRiskFactor.type && (
              <div className="form-group">
                <table className="risk-factor-params-table">
                  <thead>
                    <tr>
                      {(newRiskFactor.type.value === 'Direct' || newRiskFactor.type.value === 'Limit') && (
                        <th>Risk Factor List</th>
                      )}
                      {newRiskFactor.type?.value !== 'Zone' && <th>Min Dis/Load</th>}
                      {(newRiskFactor.type.value === 'Limit' || newRiskFactor.type.value === 'Free Entry') && (
                        <th>Max Dis/Load</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                    {(newRiskFactor.type.value === 'Free Entry') && (
                        <td>
                          <input
                            type="number"
                            value={newRiskFactor.minDisLoad}
                            onChange={(e) => handleInputChange('minDisLoad', e.target.value)}
                            placeholder="Enter Min Value"
                          />
                        </td>
                      )}
                      {(newRiskFactor.type.value === 'Free Entry') && (
                        <td>
                          <input
                            type="number"
                            value={newRiskFactor.maxDisLoad}
                            onChange={(e) => handleInputChange('maxDisLoad', e.target.value)}
                            placeholder="Enter Max Value"
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-group">
              <label>Remark</label>
              <textarea
                value={newRiskFactor.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                placeholder="Enter Remarks"
              />
            </div>

            <div className="popup-actions">
              <button 
                onClick={handleSubmit} 
                className="submit-button"
              >
                {editingRiskFactorId ? 'Update' : 'Submit'}
              </button>
              <button 
                onClick={handleCloseAddPopup} 
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskFactor;