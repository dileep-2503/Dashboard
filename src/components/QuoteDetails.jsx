import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { savePolicy, updatePendingQuote } from '../api/api';
import '../styles/QuoteDetails.css';

const QuoteDetails = ({ user, userLevel }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quoteData, setQuoteData] = useState(null);
  const [parsedSummary, setParsedSummary] = useState(null);

  const isAssignedToMe = quoteData?.status === `Pending with ${userLevel}`;

  
  useEffect(() => {
    // Check if quote data is available from navigation state
    if (location.state?.quoteData) {
      setQuoteData(location.state.quoteData);
      
      try {
        // Parse the full_summary JSON
        const parsed = JSON.parse(location.state.quoteData.full_summary);
        setParsedSummary(parsed[0]); // Get first address data
      } catch (error) {
        console.error('Error parsing quote summary:', error);
      }
    } else {
      // Redirect to pending quotes if no data is available
      navigate('/pending-quotes');
    }
  }, [location, navigate]);

  const goBack = () => {
    navigate(-1);
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

  const newStatus = `Approved by ${userLevel}`;

  const handleRecommend = () => {
    console.log("Recommend");
  }

  const handleApprove = async () => {
    try {
      const addressData = [parsedSummary];
      await savePolicy(
        addressData,
        user,
        parsedSummary.title,
        quoteData.full_summary,
        formatDate(new Date().toISOString())
      );
      await updatePendingQuote(
      quoteData.pending_id,
      addressData,
      user,
      quoteData.client_name,
      quoteData.diviation_type,
      newStatus,
      user,
      quoteData.raised_on,
      quoteData.full_summary,
      formatDate(new Date().toISOString()),
      user
    );
      navigate('/pending-quotes');
    } catch (error) {
      console.error('Error approving policy:', error);
      alert('Failed to approve the policy. Please try again.');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return `₹${parseInt(value).toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
  };

  if (!quoteData || !parsedSummary) {
    return <div className="loading">Loading quote details...</div>;
  }

  return (
    <div className="quote-details-container">
      <div className="details-header">
        <button className="back-button" onClick={goBack}>← Back to Pending Quotes</button>
        <h2>Quote Details - {quoteData.pending_id}</h2>
        <div className="status-badge-large pending">
          {quoteData.status}
        </div>
      </div>

      {/* Customer Details Section */}
      <div className="details-section">
        <div className="section-header">
          <h3>Customer Details</h3>
        </div>
        <div className="details-grid">
          <div className="detail-item">
            <label>Request ID</label>
            <div className="detail-value">{quoteData.pending_id}</div>
          </div>
          <div className="detail-item">
            <label>Customer Name</label>
            <div className="detail-value">{quoteData.client_name}</div>
          </div>
          <div className="detail-item full-width">
            <label>Insured Address</label>
            <div className="detail-value address-value">
              {parsedSummary.addressLine1 || 
              `${parsedSummary.state ? parsedSummary.state + ', ' : ''}
              ${parsedSummary.districtCity ? parsedSummary.districtCity + ', ' : ''}
              ${parsedSummary.areaVillage ? parsedSummary.areaVillage + ', ' : ''}
              ${parsedSummary.pincode ? parsedSummary.pincode : ''}`}
            </div>
          </div>
          <div className="detail-item">
            <label>Period Model</label>
            <div className="detail-value">
              {parsedSummary.policyPeriod ? 'Annual' : 'N/A'}
            </div>
          </div>
          <div className="detail-item">
            <label>Tenure</label>
            <div className="detail-value">1</div>
          </div>
          <div className="detail-item">
            <label>Policy Start Date</label>
            <div className="detail-value">
              {parsedSummary.policyPeriod ? new Date(parsedSummary.policyPeriod).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : 'N/A'}
            </div>
          </div>
          <div className="detail-item">
            <label>Policy End Date</label>
            <div className="detail-value">
              {parsedSummary.policyEndPeriod ? new Date(parsedSummary.policyEndPeriod).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : 'N/A'}
            </div>
          </div>
          <div className="detail-item">
            <label>Product Name</label>
            <div className="detail-value">{parsedSummary.title || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <label>Department Name</label>
            <div className="detail-value">
              {parsedSummary.selectedpackages?.includes('SFSP-FIRE') ? 'Fire' : 'General'}
            </div>
          </div>
          <div className="detail-item">
            <label>Quotation No</label>
            <div className="detail-value">{quoteData.quote_number || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <label>Proposal Mode</label>
            <div className="detail-value">E-Policy Portal</div>
          </div>
          <div className="detail-item">
            <label>Premium Including GST</label>
            <div className="detail-value">{formatCurrency(quoteData.premium)}</div>
          </div>
          <div className="detail-item">
            <label>Premium Excluding GST</label>
            <div className="detail-value">
              {formatCurrency(Math.round(parseInt(quoteData.premium) / 1.18))}
            </div>
          </div>
          <div className="detail-item">
            <label>Total Sum Insured</label>
            <div className="detail-value">{formatCurrency(quoteData.sum_insured)}</div>
          </div>
          <div className="detail-item">
            <label>Discount(%)</label>
            <div className="detail-value">{quoteData.discount || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <label>Testing Applicability</label>
            <div className="detail-value">Y</div>
          </div>
          <div className="detail-item">
            <label>Floater Policy</label>
            <div className="detail-value">N</div>
          </div>
        </div>
      </div>

      {/* Deviations Section */}
      <div className="details-section">
        <div className="section-header">
          <h3>List of Deviations on this Policy</h3>
        </div>
        <table className="deviations-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Request Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>DEVIATION - {quoteData.diviation_type}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Risk Location Details Section */}
      <div className="details-section">
        <div className="section-header">
          <h3>Risk Location Details</h3>
        </div>
        <table className="risk-table">
          <thead>
            <tr>
              <th>Risk Location Address</th>
              <th>Occupancy</th>
              <th>Nature Of Occupancy</th>
              <th>Grade</th>
              <th>Retention Limit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Block - 1 - {parsedSummary.addressLine1 || 
                  `${parsedSummary.state ? parsedSummary.state + ', ' : ''}
                  ${parsedSummary.districtCity ? parsedSummary.districtCity + ', ' : ''}
                  ${parsedSummary.areaVillage ? parsedSummary.areaVillage + ', ' : ''}
                  ${parsedSummary.pincode ? parsedSummary.pincode : ''}`}
              </td>
              <td>{parsedSummary.occupancyType || 'N/A'}</td>
              <td>
                {parsedSummary.selectedComponents?.join(', ') || 
                 Object.keys(parsedSummary.componentCovers || {}).join(', ') || 'N/A'}
              </td>
              <td>Grade {Math.floor(Math.random() * 5) + 1}</td>
              <td>{formatCurrency(Math.round(parseInt(quoteData.sum_insured) * 0.25))}</td>
            </tr>
          </tbody>
        </table>
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
              <td>{quoteData.created_time || 'N/A'}</td>
              <td>{quoteData.created_by || 'N/A'}</td>
              <td>test@gmail.com</td>
              <td>Created by {quoteData.created_by}</td>
            </tr>
            <tr>
              <td>{formatDate(new Date().toISOString()) || 'N/A'}</td>
              <td>{quoteData.updated_by || "sample"}</td>
              <td>sample@gamil.com</td>
              <td>{quoteData.status || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>


      {/* Package Details Section */}
      {parsedSummary.selectedpackages && parsedSummary.selectedpackages.length > 0 && (
        <div className="details-section">
          <div className="section-header">
            <h3>Package Details</h3>
          </div>
          <table className="package-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Component</th>
                <th>Sum Insured</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {parsedSummary.selectedpackages.map((pkg, index) => {
                const packageData = parsedSummary.packageComponentValues[pkg] || {};
                const packageSum = parsedSummary.packageSumInsured[pkg] || 0;
                const packagePrem = parsedSummary.sections[pkg]?.premium || 0;
                
                return Object.keys(packageData).filter(key => !key.includes('_premium')).map((component, compIndex) => (
                  <tr key={`${pkg}-${component}-${index}-${compIndex}`}>
                    {compIndex === 0 ? (
                      <td rowSpan={Object.keys(packageData).filter(key => !key.includes('_premium')).length}>
                        {pkg}
                      </td>
                    ) : null}
                    <td>{component}</td>
                    <td>{formatCurrency(packageData[component])}</td>
                    <td>{compIndex === 0 ? formatCurrency(packagePrem) : ''}</td>
                  </tr>
                ));
              })}
              <tr className="total-row">
                <td colSpan="2"><strong>Total</strong></td>
                <td><strong>{formatCurrency(parsedSummary.totalSumInsured)}</strong></td>
                <td><strong>{formatCurrency(parsedSummary.premium)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="action-buttons">
        <button 
          onClick={isAssignedToMe ? handleApprove : handleRecommend}
          className={`${isAssignedToMe ? 'approve-btn' : 'recommend-btn'}`}>
          {isAssignedToMe ? 'Approve' : 'Recommend'}
        </button>
        <button className="rework-btn">Rework</button>
        <button className="reject-btn">Decline</button>
        
      </div>
    </div>
  );
};

export default QuoteDetails;