import { useState, useEffect } from 'react';
import '../styles/RetentionBreakdownPopup.css';

export default function RetentionBreakdownPopup({ isOpen, onClose, onContinue, sumInsured, productName }) {
  if (!isOpen) return null;

  // Set different values based on product type
  const maxRetentionLimit = productName === 'IAR' ? 275000000 : 50000000;
  // Use useState to make retentionLimit editable
  const [retentionLimit, setRetentionLimit] = useState(maxRetentionLimit);

  // Reset retention limit when product changes
  useEffect(() => {
    setRetentionLimit(maxRetentionLimit);
  }, [productName, maxRetentionLimit]);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const handleRetentionChange = (e) => {
    let value = e.target.value.replace(/,/g, '');
    // Ensure input is a number and not larger than maxRetentionLimit
    if (value === '' || isNaN(value)) {
      value = 0;
    } else {
      value = Math.min(Number(value), maxRetentionLimit);
    }
    setRetentionLimit(value);
  };

  const percentages = {
    obligatory: 4.00,
  };

  const minimums = {
    quotaShare: productName === 'IAR' ? 300000000 : 100000000
  };

  // Different quota share percentage based on product
  const quotaSharePercentage = productName === 'IAR' ? 25 : 30;
  const calculatedQuotaShare = (quotaSharePercentage / 100) * sumInsured;
  
  // For IAR: if sumInsured <= calculatedQuotaShare, use calculatedQuotaShare, else 0
  let quotaShareAmount;
  if (productName === 'IAR') {
    quotaShareAmount = sumInsured <= calculatedQuotaShare ? calculatedQuotaShare : 0;
  } else {
    // For CPM: use original logic
    quotaShareAmount = Math.min(calculatedQuotaShare, minimums.quotaShare);
  }
  
  const actualQuotaSharePercentage = (quotaShareAmount / sumInsured) * 100;

  const amounts = {
    obligatory: (percentages.obligatory / 100) * sumInsured,
    quotaShare: quotaShareAmount,
  };

  // Different net retention calculation for IAR
  let netRetentionAmount;
  const remainingAfterObligatoryAndQuota = sumInsured - amounts.obligatory - quotaShareAmount;
  
  if (productName === 'IAR') {
    if (remainingAfterObligatoryAndQuota < maxRetentionLimit) {
      netRetentionAmount = remainingAfterObligatoryAndQuota;
    } else {
      if (retentionLimit <= maxRetentionLimit) {
        netRetentionAmount = retentionLimit;
      } else {
        netRetentionAmount = maxRetentionLimit;
      }
    }
  } else {
    // Original CPM logic
    if (remainingAfterObligatoryAndQuota <= maxRetentionLimit) {
      if (retentionLimit < maxRetentionLimit) {
        netRetentionAmount = retentionLimit;
      } else {
        netRetentionAmount = remainingAfterObligatoryAndQuota;
      }
    } else {
      if (retentionLimit < maxRetentionLimit) {
        netRetentionAmount = retentionLimit;
      } else {
        netRetentionAmount = maxRetentionLimit;
      }
    }
  }

  const netRetentionPercentage = (netRetentionAmount / sumInsured) * 100;
  
  // Different surplus treaty calculation for IAR
  let surplusTreatyAmount = 0;
  const remainingAfterObligatoryNetQuota = sumInsured - amounts.obligatory - netRetentionAmount - quotaShareAmount;
  
  if (remainingAfterObligatoryNetQuota > 0) {
    if (productName === 'IAR') {
      // IAR uses 19x multiplier
      if (remainingAfterObligatoryNetQuota <= 19 * netRetentionAmount) {
        surplusTreatyAmount = remainingAfterObligatoryNetQuota;
      } else {
        surplusTreatyAmount = 19 * netRetentionAmount;
      }
    } else {
      // CPM uses 5x multiplier
      if (remainingAfterObligatoryNetQuota <= 5 * netRetentionAmount) {
        surplusTreatyAmount = remainingAfterObligatoryNetQuota;
      } else {
        surplusTreatyAmount = 5 * netRetentionAmount;
      }
    }
  } else {
    surplusTreatyAmount = 0;
  }

  const surplusTreatyPercentage = (surplusTreatyAmount / sumInsured) * 100;

  // Fac support calculation remains the same for both
  let facSupportAmount = 0;
  const remainingAfterAll = sumInsured - amounts.obligatory - netRetentionAmount - quotaShareAmount - surplusTreatyAmount;
  
  if (remainingAfterAll > 0) {
    facSupportAmount = remainingAfterAll;
  } else {
    facSupportAmount = 0;
  }
  
  const facSupportPercentage = (facSupportAmount / sumInsured) * 100;

  // Calculate total percentage to verify it adds up to 100%
  const totalPercentage = percentages.obligatory + 
                          netRetentionPercentage + 
                          actualQuotaSharePercentage + 
                          surplusTreatyPercentage + 
                          facSupportPercentage;

  return (
    <div className="retention-modal-overlay">
      <div className="retention-modal-container">
        <div className="retention-modal-header">
          <h2 className="retention-modal-title">Retention Breakdown - {productName}</h2>
          <button 
            onClick={onClose}
            className="retention-close-button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="retention-table-wrapper">
          <div className="retention-table">
            <div className="retention-table-row header-row">
              <div className="retention-cell header-cell left-cell">Total Sum Insured</div>
              <div className="retention-cell header-cell right-cell">{formatNumber(sumInsured)}</div>
            </div>
          </div>
        </div>

        <div className="retention-table-wrapper">
          <div className="retention-table">
            <div className="retention-table-row header-row">
              <div className="retention-cell header-cell left-cell">Maximum Retention Limit</div>
              <div className="retention-cell header-cell right-cell">{formatNumber(maxRetentionLimit)}</div>
            </div>
          </div>
        </div>

        <div className="retention-table-wrapper">
          <div className="retention-table">
            <div className="retention-table-row header-row">
              <div className="retention-cell header-cell left-cell">Retention Limit</div>
              <div className="retention-cell header-cell right-cell">
                <input
                  type="text"
                  value={formatNumber(retentionLimit)}
                  onChange={handleRetentionChange}
                  className="retention-input"
                  style={{
                    width: '100%',
                    textAlign: 'right',
                    border: '1px solid #ddd',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="retention-table">
          <div className="retention-table-row column-header">
            <div className="retention-cell header-cell left-cell"></div>
            <div className="retention-cell header-cell center-cell">Percentage</div>
            <div className="retention-cell header-cell right-cell">Amount</div>
          </div>
          
          <div className="retention-table-row">
            <div className="retention-cell left-cell highlight">Obligatory</div>
            <div className="retention-cell center-cell">{percentages.obligatory.toFixed(2)}%</div>
            <div className="retention-cell right-cell">{formatNumber(amounts.obligatory)}</div>
          </div>
          
          <div className="retention-table-row">
            <div className="retention-cell left-cell highlight">Net Retention</div>
            <div className="retention-cell center-cell">{netRetentionPercentage.toFixed(2)}%</div>
            <div className="retention-cell right-cell">{formatNumber(netRetentionAmount)}</div>
          </div>
          
          <div className="retention-table-row">
            <div className="retention-cell left-cell highlight">Quota Share</div>
            <div className="retention-cell center-cell">
              {actualQuotaSharePercentage.toFixed(2)}%
            </div>
            <div className="retention-cell right-cell">{formatNumber(amounts.quotaShare)}</div>
          </div>
          
          <div className="retention-table-row">
            <div className="retention-cell left-cell highlight">Surplus Treaty</div>
            <div className="retention-cell center-cell">{surplusTreatyPercentage.toFixed(2)}%</div>
            <div className="retention-cell right-cell">{formatNumber(surplusTreatyAmount)}</div>
          </div>
          
          <div className="retention-table-row">
            <div className="retention-cell left-cell highlight">Fac Support</div>
            <div className="retention-cell center-cell">{facSupportPercentage.toFixed(2)}%</div>
            <div className="retention-cell right-cell">{formatNumber(facSupportAmount)}</div>
          </div>
          
          <div className="retention-table-row total-row">
            <div className="retention-cell left-cell">Total</div>
            <div className="retention-cell center-cell">{totalPercentage.toFixed(2)}%</div>
            <div className="retention-cell right-cell">{formatNumber(sumInsured)}</div>
          </div>
        </div>

        <div className="retention-footer">
          <button
            onClick={onClose}
            className="retention-close-btn"
          >
            Close
          </button>
          <button
            onClick={onContinue}
            className="retention-close-btn"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}