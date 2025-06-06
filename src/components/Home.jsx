import React, { useEffect, useState, useRef } from 'react';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom';
import { fetchQuotes, fetchProduct, fetchDrafts, fetchPendingQuotes } from '../api/api';
import { FaFileAlt, FaQuoteRight, FaShieldAlt, FaChevronRight, FaHourglassHalf, FaExclamationCircle, FaPlus, FaEye, FaEdit, FaFileInvoice } from 'react-icons/fa';

const Home = ({ productAccess, user, userLevel }) => {
  const navigate = useNavigate();
  const [sectionsData, setSectionsData] = useState([]);
  const [quotes, setQuotes] = useState(0);
  const [drafts, setDrafts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedPending, setAssignedPending] = useState(0);
  const [createdPending, setCreatedPending] = useState(0);
  const [pendingAuthorities, setPendingAuthorities] = useState([]);
  // New state for popup menu
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const popupRef = useRef(null);
  
  // Parse product access string into an array
  const accessibleProducts = productAccess ? productAccess.split(',').map(p => p.trim()) : [];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsData, quotesData, draftData, pendingData] = await Promise.all([
          fetchProduct(),
          fetchQuotes(),
          fetchDrafts(),
          fetchPendingQuotes()
        ]);

        const authorities = pendingData
        .filter(quote => quote.raised_by === user)
        .map(quote => quote.status.replace('Pending with ', ''))
        .filter((value, index, self) => self.indexOf(value) === index);

        const assignedQuotes = pendingData.filter(quote => 
          quote.status === `Pending with ${userLevel}`
        ).length;
        
        const createdQuotes = pendingData.filter(quote => 
          quote.raised_by === user
        ).length;
        
        setSectionsData(productsData);
        setQuotes(quotesData.length);
        setDrafts(draftData.length);
        setAssignedPending(assignedQuotes);
        setCreatedPending(createdQuotes);
        setPendingAuthorities(authorities);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Add click event listener to close popup when clicking outside
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPopupVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProductClick = (e, name) => {
    e.stopPropagation();
    
    // Calculate position to show popup above cursor
    // Get popup height (estimated) and ensure it appears above cursor
    const popupHeight = 200; // Estimated height of popup
    const offset = 10; // Extra offset from cursor
    
    // Position popup above and centered on cursor
    const top = e.clientY - popupHeight - offset;
    const left = e.clientX - 110; // Half of popup width (220/2)
    
    setPopupPosition({ 
      top: top + window.scrollY, 
      left: Math.max(10, left) // Prevent popup from going off-screen on the left
    });
    
    setSelectedProduct(name);
    setPopupVisible(true);
  };

  const handleOptionClick = (action) => {
    const section = sectionsData.find(sec => sec.name === selectedProduct);
    if (section) {
      const items = section.section.split(', ').map(item => item.trim());
      
      switch(action) {
        case 'new':
          navigate('/package', { 
            state: { 
              title: section.name, 
              items,
              action: 'new' 
            } 
          });
          break;
        case 'view-quote':
          navigate('/quotes', { 
            state: { 
              productFilter: section.name
            } 
          });
          break;
        case 'modify-quote':
          navigate('/quotes', { 
            state: { 
              productFilter: section.name,
              editMode: true
            } 
          });
          break;
        case 'view-policy':
          navigate('/policies', { 
            state: { 
              productFilter: section.name
            } 
          });
          break;
        default:
          break;
      }
    }
    setPopupVisible(false);
  };

  // Function to check if user has access to a specific product
  const hasAccess = (productName) => {
    return accessibleProducts.includes(productName) || accessibleProducts.includes('FULL');
  };

  // Get all accessible products without categorization
  const getAccessibleProducts = () => {
    return sectionsData.filter(section => hasAccess(section.name));
  };
  
  const accessibleProductsList = getAccessibleProducts();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading insurance data...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Manage products and quotes</p>
      </div>
      
      <div className="stats-container">
        <div className="stat-card" onClick={() => navigate('/drafts')}>
          <div className="stat-icon draft-icon">
            <FaFileAlt />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Drafts</h3>
            <p className="stat-number">{drafts}</p>
            <p className="stat-description">In progress documents</p>
          </div>
          <div className="stat-arrow">
            <FaChevronRight />
          </div>
        </div>

        <div className="stat-card pending-card" onClick={() => navigate('/pending-quotes')}>
          <div className="stat-icon pending-icon">
            <FaHourglassHalf />
          </div>
          <div className="stat-content">
            <div className="pending-header">
              <h3 className="stat-title">Pending Quotes</h3>
              {assignedPending > 0 && <span className="pending-badge">{assignedPending}</span>}
            </div>
            
            <div className="pending-details">
              {assignedPending > 0 ? (
                <div className="pending-approval">
                  <FaExclamationCircle className="approval-icon" />
                  <p className='pending-text'>
                    {assignedPending === 1 
                      ? '1 approval' 
                      : `${assignedPending} approvals`}
                  </p>
                </div>
              ) : (
                <p className="stat-description">No approvals</p>
              )}
              
              {createdPending > 0 && (
                <div className="pending-others">
                  <p>
                    <span className="pending-count">{createdPending} </span> 
                    pending
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="stat-arrow">
            <FaChevronRight />
          </div>
        </div>
        
        <div className="stat-card" onClick={() => navigate('/quotes')}>
          <div className="stat-icon quote-icon">
            <FaQuoteRight />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Quotes</h3>
            <p className="stat-number">{quotes}</p>
            <p className="stat-description">Generated quotations</p>
          </div>
          <div className="stat-arrow">
            <FaChevronRight />
          </div>
        </div>
      </div>
      
      <div className="products-section">
        <div className="section-header">
          <h2><FaShieldAlt className="section-icon" /> Products</h2>
          <p>All available products</p>
        </div>
        
        {accessibleProductsList.length > 0 ? (
          <div className="product-grid">
            {accessibleProductsList.map(section => (
              <div 
                key={section.name}
                className="product-card" 
                onClick={(e) => handleProductClick(e, section.name)}
              >
                <div className="product-icon">
                  <FaShieldAlt />
                </div>
                <div className="product-details">
                  <h4>{section.name}</h4>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <p>No insurance products are currently available for your account.</p>
          </div>
        )}
      </div>
      
      {/* Popup Menu */}
      {popupVisible && (
        <div 
          className="product-popup-menu" 
          ref={popupRef}
          style={{ 
            top: `${popupPosition.top}px`, 
            left: `${popupPosition.left}px` 
          }}
        >
          <div className="popup-title">{selectedProduct}</div>
          <div className="popup-options">
            <div className="popup-option" onClick={() => handleOptionClick('new')}>
              <FaPlus className="option-icon" />
              <span>New Proposal</span>
            </div>
            <div className="popup-option" onClick={() => handleOptionClick('view-quote')}>
              <FaEye className="option-icon" />
              <span>View Quote</span>
            </div>
            {/* <div className="popup-option" onClick={() => handleOptionClick('modify-quote')}>
              <FaEdit className="option-icon" />
              <span>Modify Quote</span>
            </div>
            <div className="popup-option" onClick={() => handleOptionClick('view-policy')}>
              <FaFileInvoice className="option-icon" />
              <span>View Policy</span>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;