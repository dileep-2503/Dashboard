import React, { useState, useEffect } from 'react';
import '../styles/ProductDetails.css';
import { useNavigate } from 'react-router-dom';
import { fetchProduct, deleteProductMapping } from '../api/api';

const ProductDetails = ({ productDataList, onEdit, user }) => {
  const navigate = useNavigate();
  const [expandedRow, setExpandedRow] = useState(null);
  const [normalizedProducts, setNormalizedProducts] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Helper function to normalize product data
  const normalizeProduct = (product) => {
    // Normalize sections data
    let normalizedSections = [];
    
    if (product.mappings) {
      normalizedSections = product.mappings;
    } else {
      // Handle comma-separated values from API
      if (product.section) {
        const sectionNames = product.section.split(',').map(s => s.trim());
        const restrictedComponents = product.component_restriction ? 
          product.component_restriction : '';
        const additionalComponents = product.additional_components ? 
          product.additional_components : '';
        normalizedSections = sectionNames.map((name) => ({
          sectionName: name,
          restrictedComponents: restrictedComponents || '',
          additionalComponents: additionalComponents || ''
        }));
      }
    }
    
    // Normalize workflow data
    const workflows = {
      workflow: product.workflow || '',
      workflow1: product.workflow1 || '',
      workflow2: product.workflow2 || '',
      workflow3: product.workflow3 || '',
      workflow4: product.workflow4 || '',
      workflow5: product.workflow5 || '',
      workflow6: product.workflow6 || ''
    };
    
    // Return normalized product object
    return {
      id: product.product_id,
      name: product.name,
      productName: product.product_exact_name || product.productName,
      uanNumber: product.UAN_number || product.uanNumber,
      userCategories: product.user_based_category || product.userCategories,
      mappings: normalizedSections,
      mandatorySections: product.mandatory_section,
      ...workflows  // Spread the workflow values into the object
    };
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

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setIsDeleting(true);
        setDeleteId(productId);
        
        const deleteData = {
          deleted_by: user, // Replace with actual user ID or username
          deleted_time: formatDate(new Date().toISOString())
        };
        
        await deleteProductMapping(productId, deleteData);
        
        // Remove the deleted product from the normalized products list
        setNormalizedProducts(normalizedProducts.filter(product => product.id !== productId));
        
      } catch (error) {
        console.error('Failed to delete product:', error);
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };
  
  useEffect(() => {
    if (productDataList && productDataList.length > 0) {
      const normalized = productDataList.map(product => normalizeProduct(product));
      setNormalizedProducts(normalized);
    } else {
      const handleProduct = async () => {
        try {
          const data = await fetchProduct();
          if (data && Array.isArray(data)) {
            const normalized = data.map(product => normalizeProduct(product));
            setNormalizedProducts(normalized);
          } else if (data) {
            const normalized = [normalizeProduct(data)];
            setNormalizedProducts(normalized);
          } else {
            setNormalizedProducts([]);
          }
        } catch (error) {
          console.error("Error fetching product data:", error);
          setNormalizedProducts([]);
        }
      };
      handleProduct();
    }
  }, [productDataList]);
  
  if (!normalizedProducts || normalizedProducts.length === 0) {
    return <div className="product-details-list">Loading product data...</div>;
  }

  const handleLocalEdit = (product) => {
    // Ensure all workflow fields are included in the navigation state
    const productWithWorkflows = {
      ...product,
      workflow: product.workflow || '',
      workflow1: product.workflow1 || '',
      workflow2: product.workflow2 || '',
      workflow3: product.workflow3 || '',
      workflow4: product.workflow4 || '',
      workflow5: product.workflow5 || '',
      workflow6: product.workflow6 || ''
    };

    if (onEdit) {
      onEdit(productWithWorkflows);
    } else {
      navigate('/product', { 
        state: { 
          editMode: true, 
          productData: productWithWorkflows
        } 
      });
    }
  };

  const handleCreateNew = () => {
    navigate('/product');
  }

  return (
    <div className="product-details-list">
      <h3>Product Details</h3>
      <button className="create-button" onClick={handleCreateNew}>
        Create New Product
      </button>
      <table className="details-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Product Name</th>
            <th>User Categories</th>
            <th>Sections</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {normalizedProducts.map((product, index) => {
            const userCategories = product.userCategories ? 
              (typeof product.userCategories === 'string' ? product.userCategories.split(', ') : [product.userCategories]) : 
              [];
            return (
              <React.Fragment key={index}>
                <tr className={expandedRow === index ? 'expanded-row' : ''}>
                  <td>{product.name}</td>
                  <td>{product.productName}</td>
                  <td>{userCategories.length > 0 ? `${userCategories.length} categories` : 'None'}</td>
                  <td>{product.mappings.length > 0 ? `${product.mappings.length} sections` : 'None'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="details-button"
                        onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                      >
                        {expandedRow === index ? 'Hide Details' : 'Show Details'}
                      </button>
                      <button 
                        className="edit-button"
                        onClick={() => handleLocalEdit(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(product.id)}
                        disabled={isDeleting && deleteId === product.id}
                      >
                        {isDeleting && deleteId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === index && (
                  <tr className="details-row">
                    <td colSpan="5">
                      <div className="expanded-details">
                        {/* Basic Information */}
                        <div className="details-card">
                          <h4>Basic Information</h4>
                          <table className="details-table">
                            <tbody>
                              <tr>
                                <td className="label">Name:</td>
                                <td>{product.name}</td>
                              </tr>
                              <tr>
                                <td className="label">Product Name:</td>
                                <td>{product.productName}</td>
                              </tr>
                              <tr>
                                <td className="label">UAN Number:</td>
                                <td>{product.uanNumber || 'N/A'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* User Categories */}
                        <div className="details-card">
                          <h4>User Categories</h4>
                          {userCategories.length > 0 ? (
                            <ul className="categories-list">
                              {userCategories.map((category, idx) => (
                                <li key={idx}>{category}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>No user categories assigned</p>
                          )}
                        </div>
                        
                        {/* Section Mappings */}
                        <div className="details-card">
                          <h4>Section Mappings</h4>
                          {product.mappings.length > 0 ? (
                            <table className="details-table">
                              <thead>
                                <tr>
                                  <th>Section Name</th>
                                  <th>Component Restriction</th>
                                  <th>Additional Component</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.mappings.map((section, idx) => (
                                  <tr key={idx}>
                                    <td>{section.sectionName}</td>
                                    <td>{section.restrictedComponents ? section.restrictedComponents : ''}</td>
                                    <td>{section.additionalComponents ? section.additionalComponents : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No sections mapped</p>
                          )}
                        </div>

                        {/* Workflow Information */}
                        <div className="details-card">
                          <h4>Workflow Information</h4>
                          <table className="details-table">
                            <tbody>
                              {['workflow', 'workflow1', 'workflow2', 'workflow3', 'workflow4', 'workflow5', 'workflow6'].map((workflowKey) => (
                                product[workflowKey] && (
                                  <tr key={workflowKey}>
                                    <td className="label">{workflowKey.charAt(0).toUpperCase() + workflowKey.slice(1)}:</td>
                                    <td>{product[workflowKey]}</td>
                                  </tr>
                                )
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductDetails;