import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingQuotes } from '../api/api';
import '../styles/PendingQuotes.css';
import Handlebars from 'handlebars';

const PendingQuotes = ({ user, userLevel }) => {
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('assigned');
  const [popupState, setPopupState] = useState({
    visible: false,
    position: { top: 0, left: 0 },
    quoteData: null
  });
  const [statusPreviewVisible, setStatusPreviewVisible] = useState(false);
  const popupRef = useRef(null);
  const statusPreviewRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPendingQuotes = async () => {
      try {
        const quotes = await fetchPendingQuotes();
        // Filter quotes that are pending with current user's level
        const relevantQuotes = quotes.filter(quote => 
          quote.status === `Pending with ${userLevel}` || quote.raised_by === user
        );
        setPendingQuotes(relevantQuotes);
      } catch (error) {
        console.error('Error loading pending quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPendingQuotes();
  }, [userLevel, user]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPopupState(prev => ({ ...prev, visible: false }));
      }
      if (statusPreviewRef.current && !statusPreviewRef.current.contains(event.target)) {
        setStatusPreviewVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleQuoteClick = (quote, event) => {
    // Prevent row click event from bubbling
    event.stopPropagation();
    
    // Get mouse coordinates
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setPopupState({
      visible: true,
      position: {
        top: mouseY + window.scrollY,
        left: mouseX + window.scrollX
      },
      quoteData: quote
    });
  };

  const handleOpenQuote = () => {
    if (popupState.quoteData) {
      navigate('/quote-details', {
        state: {
          quoteData: popupState.quoteData,
          isPending: true
        }
      });
    }
    setPopupState(prev => ({ ...prev, visible: false }));
  };

  const handleQuoteView = async() => {
    try {
      let template = await fetch("temp/Schedule_files/sheet001.htm");
      let htmlContent = await template.text();
  
      // Use the JSON data you provided
      const address = JSON.parse(popupState.quoteData.full_summary)[0];
      let terrorismValue = 0;
  
      // Format sections data based on selectedpackages and sections
      const sectionsData = address.selectedpackages.map((sectionName, index) => {
        const sectionData = address.sections[sectionName] || {};
        terrorismValue += sectionData.terrorism || 0;
        const packageValues = address.packageComponentValues[sectionName] || {};
        
        let components = [];
        // Get components and their values
        Object.keys(packageValues).forEach(key => {
          if (!key.includes('_premium')) {
            components.push({
              name: key,
              sumInsured: packageValues[key].toLocaleString('en-IN', {maximumFractionDigits: 2})
            });
          }
        });
  
        // Format address with available fields
        const formattedAddress = [
          address.addressLine1, 
          address.areaVillage, 
          address.districtCity, 
          address.state, 
          address.pincode !== 0 ? address.pincode : ''
        ].filter(Boolean).join(', ');
  
        return {
          romanNumeral: getRomanNumeral(index + 1),
          sectionName: sectionName,
          locationNumber: 1,
          locationAddress: formattedAddress || 'N/A',
          isFirstSection: index === 0,
          basisOfValuation: sectionData.basisOfValuation || '',
          occupancy: address.occupancyType || '',
          components: components,
          excess: sectionData.excess || ''
        };
      });
  
      // Replace sections placeholder with actual sections
      const sectionTemplate = htmlContent.match(/<div id="dynamic-sections">[\s\S]*?<\/div>/)[0];
      const compiledTemplate = Handlebars.compile(sectionTemplate);
      const renderedSections = compiledTemplate({ sections: sectionsData });
      
      htmlContent = htmlContent.replace(/<div id="dynamic-sections">[\s\S]*?<\/div>/, renderedSections);
  
      const coverageDetails = `
        <tr height=24>
          <td colspan=35 class=xl74><font class="font18">6. COVERAGE DETAILS</font></td>
        </tr>
        <tr height=24>
          <td colspan=2 class=xl119><font class="font20">Section Number</font></td>
          <td colspan=10 class=xl121><font class="font20">Section Description</font></td>
          <td colspan=8 class=xl124><font class="font20">Sum Insured (Rs.)</font></td>
          <td colspan=4 class=xl98><font class="font20">Premium Excluding Terrorism (Rs.)</font></td>
          <td colspan=7 class=xl113><font class="font20">Terrorism Premium (Rs.)</font></td>
          <td colspan=4 class=xl127><font class="font20">Total Premium (Rs.)</font></td>
        </tr>`;
  
      // Generate rows for each section
      const sectionRows = address.selectedpackages.map((sectionName, index) => {
        const sectionData = address.sections[sectionName] || {};
        const sumInsured = address.packageSumInsured[sectionName] || 0;
        const terrorismPremium = sectionData.terrorism || 0;
        const premiumExcludingTerrorism = sectionData.premium - terrorismPremium;
        const total = sectionData.premium;
  
        return `
          <tr height=24>
            <td colspan=2 class=xl130><font class="font13">${getRomanNumeral(index + 1)}</font></td>
            <td colspan=10 class=xl116><font class="font13">${sectionName}</font></td>
            <td colspan=8 class=xl80>${sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            <td colspan=4 class=xl80>${premiumExcludingTerrorism.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            <td colspan=7 class=xl80>${terrorismPremium.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            <td colspan=4 class=xl80>${total.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>`;
      }).join('');
  
      // Replace coverage section in template
      const coverageSection = coverageDetails + sectionRows;
      htmlContent = htmlContent.replace(
        /<tr height=24>\s*<td colspan=35.*?6\. COVERAGE DETAILS.*?(?=<tr height=7)/s,
        coverageSection
      );
  
      // Calculate gst amount and gross premium
      const totalPremium = address.premium;
      const gstRate = 0.18; // Assuming 18% GST
      const gstAmount = totalPremium * gstRate;
      const grossPremium = totalPremium + gstAmount;
  
      // Replace other dynamic values
      const replacements = {
        '{PRODUCT_TITLE}': address.title || '',
        'Policy No': '',
        '{UIN_NUMBER}': '',
        'Branch Office Address': '',
        'SAC Code': '',
        'SAC Description': '',
        '{{INSURED_NAME}}': address.name || 'N/A',
        '{{POLICY_DATE}}': new Date().toLocaleDateString(),
        'From Date': formatDate(address.policyPeriod) || '',
        'To Date': formatDate(address.policyEndPeriod) || '',
        '{PAN No}': address.panNumber || 'N/A',
        'phone': address.mobile || 'N/A',
        'premium exlcude terr': (totalPremium - terrorismValue).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        'terrorism opt': terrorismValue.toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{SGST}': (gstAmount/2).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{CGST}': (gstAmount/2).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{Gross Premium}': grossPremium.toLocaleString('en-IN', {maximumFractionDigits: 2})
      };
      
      Object.entries(replacements).forEach(([key, value]) => {
        htmlContent = htmlContent.replace(new RegExp(key, 'g'), value);
      });
  
      // Open preview in new window
      const previewWindow = window.open('', '_blank');
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
  
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Failed to generate preview");
    }
  };
  
  // Helper function to convert numbers to Roman numerals
  function getRomanNumeral(num) {
    const romanNumerals = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
      6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
    };
    return romanNumerals[num] || num.toString();
  }
  
  // Helper function to format dates
  function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  const handleStatusPreview = () => {
    // Show status preview popup
    setStatusPreviewVisible(true);
    // Hide the options popup
    setPopupState(prev => ({ ...prev, visible: false }));
  };

  const parseQuoteData = (quote) => {
    try {
      const parsedSummary = JSON.parse(quote.full_summary);
      return parsedSummary[0]; // Get first address data
    } catch (error) {
      console.error('Error parsing quote summary:', error);
      return null;
    }
  };

  const filteredQuotes = pendingQuotes.filter(quote => {
    if (viewMode === 'assigned') {
      return quote.status === `Pending with ${userLevel}`;
    } else {
      return quote.raised_by === user;
    }
  });

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'assigned' ? 'created' : 'assigned');
  };

  const closeStatusPreview = () => {
    setStatusPreviewVisible(false);
  };

  if (loading) {
    return <div className="loading">Loading pending quotes...</div>;
  }

  return (
    <div className="pending-quotes-container">
      <div className="header-container">
        <h2 className="title">Pending Quotes</h2>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'assigned' ? 'active' : ''}`}
            onClick={toggleViewMode}
          >
            Assigned to Me
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'created' ? 'active' : ''}`}
            onClick={toggleViewMode}
          >
            Created by Me
          </button>
        </div>
      </div>
      {filteredQuotes.length === 0 ? (
        <div className="no-quotes">
          No {viewMode === 'assigned' ? 'assigned' : 'created'} pending quotes found.
        </div>
      ) : (
        <div className="quotes-table-container">
          <table className="quotes-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Client Name</th>
                <th>Product</th>
                <th>Total Sum Insured</th>
                <th>Premium</th>
                <th>Deviation Type</th>
                <th>Raised By</th>
                <th>Raised On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const quoteData = parseQuoteData(quote);
                return (
                  <tr 
                    key={quote.pending_id} 
                    onClick={(e) => handleQuoteClick(quote, e)}
                    className="quote-row"
                  >
                    <td>{quote.pending_id}</td>
                    <td>{quote.client_name}</td>
                    <td>{quoteData?.title || 'N/A'}</td>
                    <td>₹{parseInt(quote.sum_insured).toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>₹{parseInt(quote.premium).toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>{quote.diviation_type}</td>
                    <td>{quote.raised_by}</td>
                    <td>{quote.raised_on}</td>
                    <td>
                      <span className="status-badge pending">
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Options Popup */}
      {popupState.visible && (
        <div 
          ref={popupRef}
          className="quote-action-popup"
          style={{
            position: 'absolute',
            top: `${popupState.position.top}px`,
            left: `${popupState.position.left}px`,
            zIndex: 1000
          }}
        >
          <ul>
            <li onClick={handleOpenQuote} className="popup-option">
              Open Quote
            </li>
            <li onClick={handleQuoteView} className="popup-option">
              Quote View
            </li>
            <li onClick={handleStatusPreview} className="popup-option">
              Status Preview
            </li>
          </ul>
        </div>
      )}

      {/* Status Preview Popup */}
      {statusPreviewVisible && popupState.quoteData && (
        <div className="status-preview-modal">
          <div className="status-preview-content" ref={statusPreviewRef}>
            <div className="status-preview-header">
              <h3>Status Preview</h3>
              <button onClick={closeStatusPreview} className="close-btn">&times;</button>
            </div>
            <div className="details-section">
              <div className="section-header">
                <h3>Pending History</h3>
              </div>
              <table className="pending-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Mail</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{popupState.quoteData.created_time || 'N/A'}</td>
                    <td>{popupState.quoteData.created_by || 'N/A'}</td>
                    <td>test@gmail.com</td>
                    <td>Created by {popupState.quoteData.created_by}</td>
                  </tr>
                  <tr>
                    <td>{formatDate(new Date().toISOString()) || 'N/A'}</td>
                    <td>{popupState.quoteData.updated_by || "sample"}</td>
                    <td>sample@gamil.com</td>
                    <td>{popupState.quoteData.status || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingQuotes;