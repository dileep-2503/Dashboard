import React, { useState, useEffect } from 'react';
import '../styles/SectionDetails.css';
import { useNavigate } from 'react-router-dom';
import { fetchSection, fetchOccupancyRate, deleteSectionMapping } from '../api/api';

const SectionDetails = ({ sectionDataList, onEdit, user }) => {
  const navigate = useNavigate();
  const [expandedRow, setExpandedRow] = useState(null);
  const [allSection, setAllSection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [occupancy, setOccupancy] = useState([]); 
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const handleSection = async () => {
      try {
        setIsLoading(true);
        if (sectionDataList && sectionDataList.length > 0) {
          setAllSection(sectionDataList);
        } else {
          const sections = await fetchSection();
          setAllSection(sections);
        }
        const occupancyRate = await fetchOccupancyRate();
        setOccupancy(occupancyRate);
      } catch (error) {
        console.error('Error fetching section data:', error);
        setError('Failed to load section data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    handleSection();
  }, [sectionDataList]);

  // Helper function to get cover properties
  const hasCoverProperty = (coverName, propertyString) => {
    if (!propertyString) return false;
    const items = propertyString.split(', ');
    return items.includes(coverName);
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

  const handleDelete = async (sectionId, section) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        setIsDeleting(true);
        setDeleteId(sectionId);
        const deleteData = {
          deleted_by: user.user, // Replace with actual user ID or username
          deleted_time: formatDate(new Date().toISOString())
        };
        
        await deleteSectionMapping(sectionId, deleteData);
        // Remove the deleted section from the sections list
        setAllSection(allSection.filter(section => section.section_id !== sectionId));
        
      } catch (error) {
        console.error('Failed to delete section:', error);
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  if (isLoading) {
    return <div className="section-details-list">Loading Section data...</div>;
  }

  if (error) {
    return <div className="section-details-list error">{error}</div>;
  }

  if (!allSection || allSection.length === 0) {
    return <div className="section-details-list">No section data available.</div>;
  }

  const handleLocalEdit = (section) => {
    occupancy.map((item) => {
      if(item.cover_title == section['occupancy_rate']){
        section.occupancy_rate = item.rate_type;
      }
      if(section.occupancy_min_rate){
        if(item.cover_title == section['occupancy_min_rate']){
          section.occupancy_min_rate = item.rate_type;
        }
      }
    });
    if (onEdit) {
      onEdit(section);
    } else {
      // Navigate to section component with state
      navigate('/section', { 
        state: { 
          editMode: true,
          showForm: true,
          sectionData: section 
        } 
      });
    }
  };

  const handleCreateNew = () => {
    navigate('/section');
  }

  return (
    <div className="section-details-list">
      <h3>Section Details</h3>
      <button className="create-button" onClick={handleCreateNew}>
        Create New Section
      </button>
      <table className="details-list-table">
        <thead>
          <tr>
            <th>Section Name</th>
            <th>Rate Type</th>
            <th>Components</th>
            <th>Covers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allSection.map((section, index) => {
            const components = section.components ? section.components.split(', ') : [];
            const covers = section.covers ? section.covers.split(', ') : [];
            
            return (
              <React.Fragment key={index}>
                <tr className={expandedRow === index ? 'expanded-row' : ''}>
                  <td>{section.section_name}</td>
                  <td>{section.rate_type === 'occupancy' ? 'Occupancy' : 'Direct'}</td>
                  <td>{components.length > 0 ? `${components.length} components` : 'None'}</td>
                  <td>{covers.length > 0 ? `${covers.length} covers` : 'None'}</td>
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
                        onClick={() => handleLocalEdit(section)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(section.section_id, section)}
                        disabled={isDeleting && deleteId === section.section_id}
                      >
                        {isDeleting && deleteId === section.section_id ? 'Deleting...' : 'Delete'}
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
                                <td className="label">Section Name:</td>
                                <td>{section.section_name}</td>
                              </tr>
                              <tr>
                                <td className="label">Rate Type:</td>
                                <td>{section.rate_type === 'occupancy' ? 'Occupancy' : 'Direct'}</td>
                              </tr>
                              {section.rate_type === 'occupancy' && (
                                <>
                                  <tr>
                                    <td className="label">Occupancy Rate:</td>
                                    <td>{section.occupancy_rate}</td>
                                  </tr>
                                  {section.occupancy_min_rate && (
                                    <tr>
                                      <td className="label">Min Occupancy Rate:</td>
                                      <td>{section.occupancy_min_rate}</td>
                                    </tr>
                                  )}
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Components List */}
                        <div className="details-card">
                          <h4>Components</h4>
                          {components.length > 0 ? (
                            <ul className="components-list">
                              {components.map((component, idx) => (
                                <li key={idx}>{component}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>No components added</p>
                          )}
                        </div>
                        
                        {/* Covers Information */}
                        <div className="details-card">
                          <h4>Covers</h4>
                          {covers.length > 0 ? (
                            <table className="details-table">
                              <thead>
                                <tr>
                                  <th>Cover</th>
                                  {section.rate_type === 'direct' && <th>Rate</th>}
                                  <th>Apply Min Rate</th>
                                  {section.rate_type === 'direct' && <th>Min Rate</th>}
                                  <th>Enterable</th>
                                  <th>Mandatory</th>
                                </tr>
                              </thead>
                              <tbody>
                                {covers.map((cover, idx) => {
                                  // Parse rates for the specific cover
                                  let directRate = '0';
                                  let minRate = '0';
                                  
                                  if (section.direct_rate) {
                                    const rateItems = section.direct_rate.split(', ');
                                    const item = rateItems.find(i => i.startsWith(`${cover}-`));
                                    if (item) {
                                      directRate = item.split('-')[1] || '0';
                                    }
                                  }
                                  
                                  if (section.direct_min_rate) {
                                    const rateItems = section.direct_min_rate.split(', ');
                                    const item = rateItems.find(i => i.startsWith(`${cover}-`));
                                    if (item) {
                                      minRate = item.split('-')[1] || '0';
                                    }
                                  }
                                  
                                  return (
                                    <tr key={idx}>
                                      <td>{cover}</td>
                                      {section.rate_type === 'direct' && <td>{directRate}</td>}
                                      <td>{hasCoverProperty(cover, section.apply_min_rate) ? 'Yes' : 'No'}</td>
                                      {section.rate_type === 'direct' && 
                                        <td>{hasCoverProperty(cover, section.apply_min_rate) ? minRate : '-'}</td>}
                                      <td>{hasCoverProperty(cover, section.enterable_rate) ? 'Yes' : 'No'}</td>
                                      <td>{hasCoverProperty(cover, section.mandatory_cover) ? 'Yes' : 'No'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <p>No covers added</p>
                          )}
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

export default SectionDetails;