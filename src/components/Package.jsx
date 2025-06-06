import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchSection, fetchProduct } from '../api/api';
import '../styles/Package.css';

const Package = ({ setSelectedPackages, setProductExactName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, items } = location.state || { title: '', items: [] };

  const [checkedItems, setCheckedItems] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visibleIndices, setVisibleIndices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sectionsData, setSectionsData] = useState([]);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isChecked = (index) => {
    if (!productData || !productData.length) {
      return false;
    }
  
    const currentProduct = productData.find(product => product.name === title);
    if (!currentProduct || !currentProduct.mandatory_section) {
      return false;
    }
  
    const mandatorySections = currentProduct.mandatory_section.split(', ');
    const currentItem = items[index];
    return mandatorySections.includes(currentItem);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const sections = await fetchSection();
        setSectionsData(sections);
        const product = await fetchProduct(title);
        setProductData(product);
        if (product && product.length > 0) {
          const currentProduct = product.find(p => p.name === title);
          const exactName = currentProduct?.product_exact_name || title;
          setProductExactName(exactName);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [title]);

  useEffect(() => {
    if (items.length && productData) {
      setCheckedItems(items.map((item, index) => isChecked(index)));
      setErrorMessage('');
      updateVisibleIndices();
    }
  }, [title, items, productData]);

  useEffect(() => {
    if (items.length === 1) {
      setSelectedPackages(items);
      navigate('/general', { state: { title } });
    }
  }, [title, items, navigate, setSelectedPackages]);

  const getDisplayName = (item) => {
    const section = sectionsData.find(section => 
      section.section_reference_name === item
    );
    return section ? section.section_name : item;
  };

  const updateVisibleIndices = () => {
    const indices = [];
    items.forEach((item, index) => {
      if (index < 9 || checkedItems[index]) {
        indices.push(index);
      }
    });
    setVisibleIndices(indices);
  };

  useEffect(() => {
    updateVisibleIndices();
  }, [checkedItems]);

  const handleCheckboxChange = (index) => {
    setCheckedItems(prevCheckedItems => {
      const newCheckedItems = [...prevCheckedItems];
      newCheckedItems[index] = !newCheckedItems[index];
      setSelectAll(newCheckedItems.every(item => item));
      return newCheckedItems;
    });
  };

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleItems = visibleIndices.map(index => ({
    item: items[index],
    index: index
  }));

  const handleNextClick = () => {
    const selectedCount = checkedItems.filter(Boolean).length;
    
    if (title === 'IAR' && selectedCount < 3) {
      setErrorMessage('Please select at least three Section options.');
      return;
    }
    
    if (selectedCount < 1) {
      setErrorMessage('Please select at least one Section option.');
      return;
    }
    
    setSelectedPackages(items.filter((item, index) => checkedItems[index]));
    navigate('/general', { state: { title } });
  };

  const handleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    setCheckedItems(items.map((item, index) => {
      if (isChecked(index)) {
        return true;
      }
      return newValue;
    }));
  };

  const getSelectedCount = () => {
    return checkedItems.filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading package options...</p>
      </div>
    );
  }

  return (
    <div className="package-container">
      <div className="package-header">
        <h1>{title} Sections</h1>
        <p className="package-subtitle">Select the Sections you want to include in your Product</p>
      </div>
      
      <div className="package-actions">
        <div className="select-all-container">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            <span>Select All Options</span>
          </label>
          <span className="selected-count">{getSelectedCount()} selected</span>
        </div>
        
        {items.length > 9 && (
          <button 
            className="add-more-button" 
            onClick={() => setShowPopup(true)}
          >
            View All Options
          </button>
        )}
      </div>
      
      {errorMessage && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          {errorMessage}
        </div>
      )}
      
      <div className="coverage-options-grid">
        {visibleItems.map(({ item, index }) => (
          <div 
            key={index} 
            className={`coverage-option ${checkedItems[index] ? 'selected' : ''} ${isChecked(index) ? 'mandatory' : ''}`}
          >
            <div className="option-checkbox">
              <input
                type="checkbox"
                id={`option-${index}`}
                checked={checkedItems[index]}
                onChange={() => handleCheckboxChange(index)}
                disabled={isChecked(index)}
              />
              <label htmlFor={`option-${index}`} className="checkbox-label"></label>
            </div>
            <div className="option-content">
              <label htmlFor={`option-${index}`} className="option-name">
                {getDisplayName(item)}
              </label>
              <span className={`tag ${isChecked(index) ? 'mandatory-tag' : 'optional-tag'}`}>
                {isChecked(index) ? 'Required' : 'Optional'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="package-footer">
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
        <button 
          className="next-button" 
          onClick={handleNextClick}
          disabled={getSelectedCount() === 0}
        >
          Continue to Next Step
        </button>
      </div>
      
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>All Sections</h2>
              <button className="close-modal" onClick={() => setShowPopup(false)}>×</button>
            </div>
            
            <div className="modal-search">
              <input
                type="text"
                placeholder="Search Sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="modal-options-list">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const itemIndex = items.indexOf(item);
                  return (
                    <div 
                      key={itemIndex} 
                      className={`modal-option ${checkedItems[itemIndex] ? 'selected' : ''} ${isChecked(itemIndex) ? 'mandatory' : ''}`}
                    >
                      <input
                        type="checkbox"
                        id={`modal-option-${itemIndex}`}
                        checked={checkedItems[itemIndex]}
                        onChange={() => handleCheckboxChange(itemIndex)}
                        disabled={isChecked(itemIndex)}
                      />
                      <label htmlFor={`modal-option-${itemIndex}`}>
                        {getDisplayName(item)}
                        <span className={`tag ${isChecked(itemIndex) ? 'mandatory-tag' : 'optional-tag'}`}>
                          {isChecked(itemIndex) ? 'Required' : 'Optional'}
                        </span>
                      </label>
                    </div>
                  );
                })
              ) : (
                <p className="no-results">No matching Section found</p>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="apply-button" 
                onClick={() => setShowPopup(false)}
              >
                Apply Selections
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Package;