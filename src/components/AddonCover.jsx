import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { fetchAddon, fetchProduct, fetchSection, addAddonCover, updateAddonCover, deleteAddonCover } from '../api/api';
import '../styles/AddonCover.css';

const AddonCover = (user) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAddonCover, setSelectedAddonCover] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  
  // State to track all covers and components
  const [allCovers, setAllCovers] = useState([]);
  const [allComponents, setAllComponents] = useState([]);

  const [form, setForm] = useState({
    product_name: null,
    sections: [],
    addon_cover_name: '',
    si_limit: '',
    rate_limit: '',
    type: null,
    cover_rate: [],
    si_limit_per: '',
    rate_limit_per: '',
    free_cover_si: '',
    free_cover_si_per: '',
    excess: '',
    remark: '',
    aoa_percentage: '',
    aoa_limit: '',
    aoy_percentage: '',
    aoy_limit: '',
    component_restriction: [],
    component_only_for: []
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

  // Fetch initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [addonData, productData] = await Promise.all([
        fetchAddon(),
        fetchProduct()
      ]);
      
      setSummaries(addonData);
      setProducts(productData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sections when a product is selected
  const fetchSectionsForProduct = async (sections) => {
    try {
      const sectionsData = await fetchSection();
      
      const productSections = sections.split(', ');
      const filteredSections = sectionsData.filter(section => 
        productSections.includes(section.section_reference_name)
      );
      
      setSections(filteredSections);
      // Clear covers and components when sections change
      setAllCovers([]);
      setAllComponents([]);
      
    } catch (err) {
      console.error('Failed to fetch sections', err);
      setSections([]);
      setAllCovers([]);
      setAllComponents([]);
    }
  };

  const handleSectionChange = (selectedOptions) => {
    setForm(prev => ({
      ...prev,
      sections: selectedOptions || [],
      cover_rate: [], // Reset cover selections
      component_restriction: [], // Reset component selections
      component_only_for: [] // Reset component selections
    }));
  
    // Update covers and components based on selected sections
    if (selectedOptions && selectedOptions.length > 0) {
      const selectedSectionNames = selectedOptions.map(option => option.value);
      
      // Filter sections and get their covers and components
      const selectedSectionData = sections.filter(section => 
        selectedSectionNames.includes(section.section_reference_name)
      );
  
      // Update covers
      const sectionCovers = selectedSectionData.flatMap(section => 
        section.covers.split(', ').filter(Boolean)
      );
      setAllCovers([...new Set(sectionCovers)].map(cover => ({
        value: cover,
        label: cover
      })));
  
      // Update components
      const sectionComponents = selectedSectionData.flatMap(section => 
        section.components.split(', ').filter(Boolean)
      );
      setAllComponents([...new Set(sectionComponents)].map(component => ({
        value: component,
        label: component
      })));
    } else {
      setAllCovers([]);
      setAllComponents([]);
    }
  };

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle product selection
  const handleProductChange = (selectedProduct) => {
    setForm(prev => ({
      ...prev,
      product_name: selectedProduct,
      sections: [],
      cover_rate: []
    }));
    if (selectedProduct) {
      fetchSectionsForProduct(products.find( product => product.name === selectedProduct.label).section);
    } else {
      // Reset sections, covers, and components if no product selected
      setSections([]);
      setAllCovers([]);
      setAllComponents([]);
    }
  };

  // Prepare product options for react-select
  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle multiselect changes
  const handleMultiSelectChange = (name) => (selectedOptions) => {
    setForm(prev => ({
      ...prev,
      [name]: selectedOptions
    }));
  };

  // Handle edit button click
  const handleEditClick = (addonCover) => {
    // Fetch product and section details first
    const selectedProduct = productOptions.find(p => p.label === addonCover.product_name);
    
    // Set initial form state with existing values
    setForm({
      product_name: selectedProduct,
      addon_cover_name: addonCover.addon_cover_name,
      si_limit: addonCover.si_limit || '',
      si_limit_per: addonCover.si_limit_per || '',
      free_cover_si: addonCover.free_cover_si || '',
      free_cover_si_per: addonCover.free_cover_si_per || '',
      type: addonCover.type ? { value: addonCover.type, label: addonCover.type === 'direct' ? 'Direct Rate' : 'Cover Based' } : null,
      rate_limit: addonCover.rate_limit || '',
      rate_limit_per: addonCover.rate_limit_per || '',
      aoa_percentage: addonCover.aoa_percentage || '',
      aoy_percentage: addonCover.aoy_percentage || '',
      aoa_limit: addonCover.aoa_limit || '',
      aoy_limit: addonCover.aoy_limit || '',
      sections: [],
      cover_rate: [],
      component_restriction: [],
      component_only_for: [],
      excess: addonCover.excess || '',
      remark: addonCover.remark || ''
    });
    
    // Set the selected addon cover to be edited
    setSelectedAddonCover(addonCover);
    
    // Open the modal
    setIsEditModalOpen(true);
    
    // Fetch sections for the selected product
    if (selectedProduct) {
      fetchSectionsForProduct(products.find(product => product.name === selectedProduct.label).section)
        .then(() => {
          // After sections are loaded, set the selected sections
          if (addonCover.sections) {
            const sectionNames = addonCover.sections.split(', ');
            const selectedSections = sectionNames.map(name => ({
              value: name,
              label: name
            }));
            
            // Set selected sections
            setForm(prev => ({
              ...prev,
              sections: selectedSections
            }));
            
            // This will trigger handleSectionChange which will load covers and components
            handleSectionChange(selectedSections);
            
            // After a short delay to ensure covers and components are loaded
            setTimeout(() => {
              // Set rate covers
              if (addonCover.cover_rate) {
                const coverNames = addonCover.cover_rate.split(', ');
                setForm(prev => ({
                  ...prev,
                  cover_rate: coverNames.map(name => ({
                    value: name,
                    label: name
                  }))
                }));
              }
              
              // Set component restrictions
              if (addonCover.component_restriction) {
                const compNames = addonCover.component_restriction.split(', ');
                setForm(prev => ({
                  ...prev,
                  component_restriction: compNames.map(name => ({
                    value: name,
                    label: name
                  }))
                }));
              }
              
              // Set component only for
              if (addonCover.component_only_for) {
                const compNames = addonCover.component_only_for.split(', ');
                setForm(prev => ({
                  ...prev,
                  component_only_for: compNames.map(name => ({
                    value: name,
                    label: name
                  }))
                }));
              }
            }, 500);
          }
        });
    }
  };

  // Handle delete button click
  const handleDeleteClick = (addonCover) => {
    setSelectedAddonCover(addonCover);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    const now = formatDate(new Date().toISOString());
       // Replace with actual user info from your auth system
      
      const deleteData = {
        deleted_by: user.user,
        deleted_time: now
      };
    try {
      await deleteAddonCover(selectedAddonCover.addon_cover_id, deleteData);
      
      // Reload data after successful deletion
      await loadInitialData();
      
      // Close modal and reset
      setIsDeleteModalOpen(false);
      setSelectedAddonCover(null);
      setDeleteReason('');
      
    } catch (err) {
      setError(`Failed to delete addon cover: ${err.message}`);
      console.error(err);
    }
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedAddonCover(null);
    setForm({
      product_name: null,
      sections: [],
      addon_cover_name: '',
      si_limit: '',
      rate_limit: '',
      type: null,
      cover_rate: [],
      si_limit_per: '',
      rate_limit_per: '',
      free_cover_si: '',
      free_cover_si_per: '',
      excess: '',
      remark: '',
      aoa_percentage: '',
      aoy_percentage: '',
      aoa_limit: '',
      aoy_limit: '',
      component_restriction: [],
      component_only_for: []
    });
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      // Transform form data for API
      const formData = {
        product_id: form.product_name.value,
        product_name: form.product_name.label,
        addon_cover_name: form.addon_cover_name,
        si_limit: form.si_limit,
        si_limit_per: form.si_limit_per,
        free_cover_si: form.free_cover_si,
        free_cover_si_per: form.free_cover_si_per,
        type: form.type?.value,
        rate_limit: form.rate_limit,
        rate_limit_per: form.rate_limit_per,
        cover_rate: form.cover_rate?.map(cover => cover.value).join(', '),
        sections: form.sections?.map(section => section.value).join(', '),
        aoa_percentage: form.aoa_percentage,
        aoy_percentage: form.aoy_percentage,
        aoa_limit: form.aoa_limit,
        aoy_limit: form.aoy_limit,
        component_restriction: form.component_restriction?.map(comp => comp.value).join(', '),
        component_only_for: form.component_only_for?.map(comp => comp.value).join(', '),
        excess: form.excess,
        remark: form.remark
      };
      
      let response;
      const now = formatDate(new Date().toISOString());
      
      if (selectedAddonCover) {
        formData.updated_by = user.user;
        formData.updated_time = now;
        // Update existing addon cover
        response = await updateAddonCover(selectedAddonCover.addon_cover_id, formData);
      } else {
        // Add new addon cover
        formData.created_by = user.user;
        formData.created_time = now;
        response = await addAddonCover(formData);
      }
      
      // Reload data after successful submission
      await loadInitialData();
      
      // Close modal and reset form
      closeModal();
      
    } catch (err) {
      setError(`Failed to ${selectedAddonCover ? 'update' : 'add'} addon cover: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="table-container">
      <div className="table-header-container">
        <h2 className="table-title">Addon Cover</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="add-button"
        >
          Add New Addon Cover
        </button>
      </div>
      
      {summaries.length === 0 ? (
        <p className="empty-message">No Addon Cover found.</p>
      ) : (
        <table className="quote-table">
          <thead className="table-header">
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>AddOn Cover Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.addon_cover_id} className="table-row">
                <td className="table-cell">{summary.addon_cover_id}</td>
                <td className="table-cell">{summary.product_name}</td>
                <td className="table-cell">{summary.addon_cover_name}</td>
                <td className="table-cell actions-cell">
                  <button 
                    className="edit-button" 
                    onClick={() => handleEditClick(summary)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button" 
                    onClick={() => handleDeleteClick(summary)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Addon Cover Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Addon Cover</h2>
              <button 
                className="modal-close-button"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {/* Product Name Dropdown */}
                <div className="form-group">
                  <label>Product Name</label>
                  <Select
                    value={form.product_name}
                    onChange={handleProductChange}
                    options={productOptions}
                    placeholder="Select Product"
                  />
                </div>

                <div className="form-group">
                  <label>Sections</label>
                  <Select
                    isMulti
                    value={form.sections}
                    onChange={handleSectionChange}
                    options={sections.map(section => ({
                      value: section.section_reference_name,
                      label: section.section_reference_name
                    }))}
                    placeholder="Select Sections"
                    isDisabled={!form.product_name}
                  />
                </div>

                {/* Addon Cover Name */}
                <div className="form-group">
                  <label>Addon Cover Name</label>
                  <input
                    type="text"
                    name="addon_cover_name"
                    value={form.addon_cover_name}
                    onChange={handleInputChange}
                    placeholder="Enter Addon Cover Name"
                  />
                </div>

                {/* Sum Insure Limit */}
                <div className='addon-cover-group'>
                  <div className="form-group">
                    <label>Sum Insure Limit</label>
                    <input
                      type="number"
                      name="si_limit"
                      value={form.si_limit}
                      onChange={handleInputChange}
                      placeholder="Enter Sum Insure Limit"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sum Insure Limit Percentage</label>
                    <input
                      type="number"
                      name="si_limit_per"
                      value={form.si_limit_per}
                      onChange={handleInputChange}
                      placeholder="Enter Percentage"
                    />
                  </div>
                </div>

                <div className='addon-cover-group'>
                  <div className="form-group">
                    <label>Free Addon Cover SI Limit</label>
                    <input
                      type="number"
                      name="free_cover_si"
                      value={form.free_cover_si}
                      onChange={handleInputChange}
                      placeholder="Enter Free Addon Cover SI Limit"
                    />
                  </div>

                  <div className="form-group">
                    <label>Free Addon Cover SI %</label>
                    <input
                      type="number"
                      name="free_cover_si_per"
                      value={form.free_cover_si_per}
                      onChange={handleInputChange}
                      placeholder="Enter Free Addon Cover SI %"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Rate Type</label>
                  <Select
                    value={form.type}
                    onChange={(selected) => handleInputChange({
                      target: { name: 'type', value: selected }
                    })}
                    options={[
                      { value: 'direct', label: 'Direct Rate' },
                      { value: 'cover', label: 'Cover Based' }
                    ]}
                    placeholder="Select Rate Type"
                  />
                </div>

                <div className='addon-cover-group'>
                  {form.type?.value === 'direct' && (
                    <div className="form-group">
                      <label>Rate Limit</label>
                      <input
                        type="number"
                        name="rate_limit"
                        value={form.rate_limit}
                        onChange={handleInputChange}
                        placeholder="Enter Rate Limit"
                      />
                    </div>
                  )}

                  {/* Show Covers dropdown only for Cover Based */}
                  {form.type?.value === 'cover' && (
                    <div className="form-group">
                      <label>Rate Covers</label>
                      <Select
                        isMulti
                        value={form.cover_rate}
                        onChange={handleMultiSelectChange('cover_rate')}
                        options={allCovers}
                        placeholder="Select Rate Covers"
                        isDisabled={!form.sections?.length}
                      />
                    </div>
                  )}

                  {form.type?.value === 'cover' && (
                    <div className="form-group">
                      <label>Rate Limit Percentage</label>
                      <input
                        type="text"
                        name="rate_limit_per"
                        value={form.rate_limit_per}
                        onChange={handleInputChange}
                        placeholder="Enter Percentage"
                      />
                    </div>
                  )}
                </div>

                <div className='addon-cover-group'>
                  <div className="form-group">
                    <label>AOA %</label>
                    <input
                      type="number"
                      name="aoa_percentage"
                      value={form.aoa_percentage}
                      onChange={handleInputChange}
                      placeholder="Enter AOA Percentage"
                    />
                  </div>

                  <div className="form-group">
                    <label>AOA Limit</label>
                    <input
                      type="number"
                      name="aoa_limit"
                      value={form.aoa_limit}
                      onChange={handleInputChange}
                      placeholder="Enter AOY Percentage"
                    />
                  </div>
                </div>

                <div className='addon-cover-group'>
                  <div className="form-group">
                    <label>AOY %</label>
                    <input
                      type="number"
                      name="aoy_percentage"
                      value={form.aoy_percentage}
                      onChange={handleInputChange}
                      placeholder="Enter AOA Percentage"
                    />
                  </div>

                  <div className="form-group">
                    <label>AOY Limit</label>
                    <input
                      type="number"
                      name="aoy_limit"
                      value={form.aoy_limit}
                      onChange={handleInputChange}
                      placeholder="Enter AOY Percentage"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Component Restriction</label>
                  <Select
                    isMulti
                    value={form.component_restriction}
                    onChange={handleMultiSelectChange('component_restriction')}
                    options={allComponents}
                    placeholder="Select Component Restrictions"
                  />
                </div>

                {/* Component Only For Multiselect */}
                <div className="form-group">
                  <label>Component Only For</label>
                  <Select
                    isMulti
                    value={form.component_only_for}
                    onChange={handleMultiSelectChange('component_only_for')}
                    options={allComponents}
                    placeholder="Select Components"
                  />
                </div>

                {/* Excess */}
                <div className="form-group">
                  <label>Excess</label>
                  <input
                    type="text"
                    name="excess"
                    value={form.excess}
                    onChange={handleInputChange}
                    placeholder="Enter Excess"
                  />
                </div>

                {/* Remark */}
                <div className="form-group">
                  <label>Remark</label>
                  <input
                    type="text"
                    name="remark"
                    value={form.remark}
                    onChange={handleInputChange}
                    placeholder="Enter Remark"
                  />
                </div>
                
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                onClick={handleSubmit}
              >
                {selectedAddonCover ? 'Update Addon Cover' : 'Add Addon Cover'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Delete Addon Cover</h2>
              <button 
                className="modal-close-button"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the addon cover: <strong>{selectedAddonCover?.addon_cover_name}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-button"
                onClick={confirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonCover;