import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PreviewPage.css';
import Select from 'react-select';
import Handlebars from 'handlebars';
import RetentionBreakdownPopup from './RetentionBreakdownPopup';
import { savePolicy, saveQuote, updatePolicy, updateQuote, fetchAddon, fetchSection, savePendingQuote, fetchRiskFactor } from '../api/api';
Handlebars.registerHelper('romanNumeral', function(num) {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
  return romanNumerals[num] || num.toString();
});

Handlebars.registerHelper('formatNumber', function(num) {
  return num.toLocaleString('en-IN');
});

Handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

const PreviewPage = ({user, userLevel}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRetentionPopup, setShowRetentionPopup] = useState(false);
  const submittedAddresses = location.state?.item || [];
  const title = location.state?.title || '';
  const currentStep = location.state?.currentStep || 0;
  const [marinePre, setMarinePre] =  useState(0);
  const [showPremiumBreakup, setShowPremiumBreakup] = useState(false);
  const [showAddonPopup, setShowAddonPopup] = useState(false);
  const [addonOptions, setAddonOptions] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [addonDetails, setAddonDetails] = useState([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [pendingChange, setPendingChange] = useState(null);
  const [warnedIndexes, setWarnedIndexes] = useState(new Set());
  const [totalAddonPremium, setTotalAddonPremium] = useState(0);
  const [deviationMatrix, setDeviationMatrix] = useState(null);
  const [appliedAddons, setAppliedAddons] = useState([]);
  const [marineRate, setMarineRate] = useState(0.15);
  const [isChecked, setIsChecked] = useState(false);
  const [terrorism, setTerrorism] = useState(0);
  const [showRiskInspectionPopup, setShowRiskInspectionPopup] = useState(false);
  const [topLocationSI, setTopLocationSI] = useState(0);
  const [machineryType, setMachineryType] = useState('New Machinery');


  useEffect(() => {
    const fetchDeviationMatrix = async () => {
      try {
        const sectionData = await fetchSection();
        const matrix = sectionData.find(section => 
          section.deviation_matrix)?.deviation_matrix;
          
        if (matrix) {
          setDeviationMatrix(JSON.parse(matrix));
        }
      } catch (error) {
        console.error('Error fetching deviation matrix:', error);
      }
    };

    const fetchTerrorismPremium = async () => {
      const premium = await getTerrorismPremium();
      setTerrorism(premium);
    };
    
    const highestSumInsured = submittedAddresses.reduce((highest, location) => {
      return location.totalSumInsured > highest ? location.totalSumInsured : highest;
    }, 0);

    setTopLocationSI(highestSumInsured)
    setShowRiskInspectionPopup(highestSumInsured > 1000000000);
    
    fetchTerrorismPremium();
    fetchDeviationMatrix();
  }, [submittedAddresses]);

  const validateSumInsuredLimit = () => {
    if (!deviationMatrix || !userLevel) return true;

    const userAuthority = deviationMatrix.authority_levels.find(
      level => level.level_name === userLevel
    );

    if (!userAuthority) return true;

    const sumInsuredLimits = userAuthority.settings.sum_insured;
    const minLimit = parseFloat(sumInsuredLimits.min) || 0;
    const maxLimit = parseFloat(sumInsuredLimits.max) || Infinity;

    let isValid = true;
    let exceededSections = [];

    submittedAddresses.forEach(address => {
      Object.entries(address.packageSumInsured).forEach(([section, sumInsured]) => {
        if (sumInsured > maxLimit || sumInsured < minLimit) {
          isValid = false;
          exceededSections.push({
            section,
            sumInsured,
            minLimit,
            maxLimit
          });
        }
      });
    });

    if (!isValid) {
      const message = exceededSections.map(item => 
        `Section ${item.section}: Sum Insured (₹${item.sumInsured.toLocaleString()}) exceeds your authority limit ` +
        `(Min: ₹${item.minLimit.toLocaleString()}, Max: ₹${item.maxLimit.toLocaleString()})`
      ).join('\n');

      setWarningMessage(message);
      setShowWarningPopup(true);
      return false;
    }

    return true;
  };

  const handleCheckboxChange = (event) => {
    const newCheckedValue = event.target.checked;
    setIsChecked(newCheckedValue);
    const marinePremium = totalSumInsured * (marineRate/100);
    setMarinePre(isChecked ? 0 : marinePremium);
  };

  const handleMarineRateChange = (value) => {
    setMarineRate(value);
    if (isChecked) {
      const marinePremium = totalSumInsured * (value / 100);
      setMarinePre(marinePremium);
    }
  };
  
  
  // Helper function to get location string
  const getLocationString = (address) => {
    return `${address.areaVillage}, ${address.districtCity}, ${address.state}`;
  };

  // Function to organize data by address and then by section
  const organizeData = () => {
    const organizedData = [];
    
    submittedAddresses.forEach((address, addressIndex) => {
      const addressData = {
        addressIndex: addressIndex + 1,
        location: getLocationString(address),
        sections: {}
      };
      
      // Group by sections
      const sections = Object.keys(address.packageComponentValues);
      
      sections.forEach(section => {
        addressData.sections[section] = [];
        
        // Get components for this section
        const components = Object.keys(address.packageComponentValues[section])
          .filter(key => !key.includes('_premium') && !key.includes('_terror')); // Filter out premium keys
        
        components.forEach(component => {
          const sumInsured = address.packageComponentValues[section][component];
          const premiumKey = `${component}_premium`;
          const terrorKey = `${component}_terror`;
          const terror = address.packageComponentValues[section][terrorKey];
          const premium = address.packageComponentValues[section][premiumKey];
          
          addressData.sections[section].push({
            component,
            premium,
            sumInsured,
            terror
          });
        });
      });
      
      organizedData.push(addressData);
    });
    
    return organizedData;
  };

  const handleRateBlur = (index) => {
    const updatedDetails = [...addonDetails];
    const detail = updatedDetails[index];
    const value = detail.rate;
    
    // Convert to number for validation
    const numValue = Number(value);
    
    // Get base rate (without risk factor applied)
    const riskFactorPercentage = submittedAddresses[0].riskFactor || 0;
    const baseDefaultRate = Number(detail.defaultRate) / (1 + (Number(riskFactorPercentage) / 100));
    
    // Check if empty or less than default rate
    if (value === '' || numValue < Number(detail.defaultRate)) {
      setWarningMessage(`Rate cannot be less than ${detail.defaultRate}`);
      setShowWarningPopup(true);
      setPendingChange({ index, field: 'rate', value: detail.defaultRate });
      
      // Update rate to default and calculate premium
      updatedDetails[index].rate = detail.defaultRate;
      const currentSI = Number(detail.sumInsured) || 0;
      updatedDetails[index].premium = (currentSI * Number(detail.defaultRate)) / 1000;
    } else {
      // Calculate premium with entered rate
      const currentSI = Number(detail.sumInsured) || 0;
      updatedDetails[index].premium = (currentSI * numValue) / 1000;
    }

    setAddonDetails(updatedDetails);
  };

  const handleAddonClick = async () => {
    try {
      const addonData = await fetchAddon();
      const riskFactors = await fetchRiskFactor();
      
      // Get the already applied addons from risk factors
      let appliedAddons = [];
      const matchingRiskFactor = riskFactors.find(factor => factor.product_name === title);
      
      if (matchingRiskFactor && matchingRiskFactor.applied_addons) {
        appliedAddons = matchingRiskFactor.applied_addons.split(', ').map(addon => addon.trim());
      }
      
      // Get unique sections from submitted addresses
      const selectedSections = new Set();
      submittedAddresses.forEach(address => {
        Object.keys(address.packageComponentValues).forEach(section => {
          selectedSections.add(section === 'SFSP-FIRE' ? 'FIRE' : 
            address.multiEquipment ? section.split('-')[2] : section);
        });
      });

      const filteredAddons = addonData.filter(addon => {
        if (addon.product_name !== title) return false;
        const addonSections = addon.sections.split(', ');
        return addonSections.some(section => selectedSections.has(section === "SFSP-FIRE" ? "FIRE" : section));
      });

      const options = filteredAddons.map(addon => ({
        value: addon.addon_cover_id,
        label: addon.addon_cover_name
      }));
  
      const appliedAddonsList = addonData
        .filter(addon => appliedAddons.includes(addon.addon_cover_name))
        .map(addon => ({
          value: addon.addon_cover_id,
          label: addon.addon_cover_name
        }));

      setAddonOptions(options);
      setAppliedAddons(appliedAddonsList);
      setShowAddonPopup(true);
    } catch (error) {
      console.error('Failed to fetch addon options:', error);
    }
  };

  const calculateSectionSumInsured = (sections, addonSections) => {
    let sectionSumInsured = 0;
    
    // Convert addon sections string to array and trim spaces
    const addonSectionArray = addonSections.split(',').map(s => s.trim());
    
    submittedAddresses.forEach(address => {
      Object.entries(address.packageComponentValues).forEach(([section, components]) => {
        const normalizedSection = section === address.multiEquipment ? section.split('-')[2] : section;
        if (addonSectionArray.includes(normalizedSection)) {
          // Sum up all non-premium values in this section
          Object.entries(components).forEach(([key, value]) => {
            if (!key.includes('_premium') && !key.includes('_terror')) {
              sectionSumInsured += Number(value) || 0;
            }
          });
        }
      });
    });
    
    return sectionSumInsured;
  };

  const calculateAOA = (sumInsured, percentage, limit) => {
    if (!sumInsured || !percentage) return '';
    
    const percentageAmount = (Number(sumInsured) * Number(percentage)) / 100;
    
    if (limit) {
      return Math.min(percentageAmount, Number(limit));
    }
    
    return percentageAmount;
  };

  const calculateAOY = (sumInsured, percentage, limit) => {
    if (!sumInsured || !percentage) return '';
    
    const percentageAmount = (Number(sumInsured) * Number(percentage)) / 100;
    
    if (limit) {
      return Math.min(percentageAmount, Number(limit));
    }
    
    return percentageAmount;
  };

  const handleAddonChange = async (selectedOptions) => {
    try {
      const addonData = await fetchAddon();
      
      // Get the risk factor percentage from submittedAddresses[0]
      const riskFactorPercentage = submittedAddresses.riskFactors || 0;
      
      const details = (selectedOptions || []).map(option => {
        const addonInfo = addonData.find(addon => addon.addon_cover_id === option.value);
        const sectionSumInsured = calculateSectionSumInsured(submittedAddresses, addonInfo.sections);
        
        let calculatedSumInsured = sectionSumInsured;
        // Existing sum insured calculation logic
        if (addonInfo.free_cover_si_per) {
          calculatedSumInsured = (sectionSumInsured * Number(addonInfo.free_cover_si_per)) / 100;
          
          if (addonInfo.free_cover_si && calculatedSumInsured > addonInfo.free_cover_si) {
            calculatedSumInsured = Math.min(calculatedSumInsured, Number(addonInfo.free_cover_si));
          }
        }
  
        // Apply SI percentage limit if exists
        if (addonInfo.si_limit_per) {
          const maxBySIPercentage = (sectionSumInsured * Number(addonInfo.si_limit_per)) / 100;
          calculatedSumInsured = Math.min(calculatedSumInsured, maxBySIPercentage);
        }
  
        // Apply absolute SI limit if exists
        if (addonInfo.si_limit) {
          calculatedSumInsured = Math.min(calculatedSumInsured, Number(addonInfo.si_limit));
        }
        
        if (addonInfo.free_cover_si && calculatedSumInsured > Number(addonInfo.free_cover_si)) {
          calculatedSumInsured = Number(addonInfo.free_cover_si);
        }
  
        // Calculate default rate
        let defaultRate = '0';
        if (addonInfo.cover_rate) {
          let combinedRate = calculateCombinedRate(addonInfo.cover_rate, submittedAddresses) * Number(addonInfo.rate_limit_per) / 100;
          defaultRate = combinedRate.toString();
        } else if (addonInfo.rate_limit) {
          defaultRate = addonInfo.rate_limit;
        }
        
        // Apply risk factor percentage to the rate
        const adjustedRate = Number(defaultRate) * (1 + (Number(riskFactorPercentage) / 100));
        const finalRate = adjustedRate.toString();
        
        // Calculate premium with adjusted rate
        const premium = addonInfo.free_cover_si ? 0 : (adjustedRate * calculatedSumInsured) / 1000;
  
        return {
          addonCoverId: option.value,
          addonCoverName: option.label,
          rate_limit: addonInfo.rate_limit,
          rate_limit_per: addonInfo.rate_limit_per,
          cover_rate: addonInfo.cover_rate,
          sections: addonInfo.sections,
          originalSumInsured: sectionSumInsured,
          sumInsured: calculatedSumInsured,
          freeCoverSiPer: addonInfo.free_cover_si_per,
          freeCoverSi: addonInfo.free_cover_si,
          si_limit: addonInfo.si_limit,
          si_limit_per: addonInfo.si_limit_per,
          defaultRate: defaultRate,
          rate: finalRate, // Store the adjusted rate
          premium: premium,
          aoa_percentage: addonInfo.aoa_percentage,
          aoa_limit: addonInfo.aoa_limit,
          aoa: calculateAOA(
            calculatedSumInsured,
            addonInfo.aoa_percentage,
            addonInfo.aoa_limit
          ),
          aoy_percentage: addonInfo.aoy_percentage,
          aoy_limit: addonInfo.aoy_limit,
          aoy: calculateAOY(
            calculatedSumInsured,
            addonInfo.aoy_percentage,
            addonInfo.aoy_limit
          ),
          riskFactorApplied: riskFactorPercentage // Store the applied risk factor for reference
        };
      });
      
      setSelectedAddons(selectedOptions || []);
      setAddonDetails(details);
      setWarnedIndexes(new Set());
    } catch (error) {
      console.error('Failed to process addon selection:', error);
    }
  };

  const calculateCombinedRate = (coverRates, submittedAddresses) => {
    let combinedRate = 0;
    
    // Split cover rates into array
    const coverList = coverRates.split(', ');
    
    // Go through each cover and get its rate from sectionCovers
    coverList.forEach(cover => {
      submittedAddresses.forEach(address => {
        Object.entries(address.sectionCovers).forEach(([section, covers]) => {
          const foundCover = covers.find(c => c.cover === cover);
          if (foundCover) {
            combinedRate += Number(foundCover.rate) || 0;
          }
        });
      });
    });
    
    return combinedRate;
  };

  const handleAddonDetailChange = (index, field, value) => {
    const updatedDetails = [...addonDetails];
    const detail = updatedDetails[index];
    const numValue = Number(value);
  
    // Helper function to calculate premium
    const calculateAddonPremium = (si, rate) => {
      return (Number(si) * Number(rate)) / 1000;
    };
  
    // Update field value initially
    updatedDetails[index][field] = value;

    if (field === 'aoa') {
      const sumInsured = Number(detail.sumInsured) || 0;
      const aoaPercentage = Number(detail.aoa_percentage) || 0;
      const aoaLimit = Number(detail.aoa_limit);
      const calculatedAOA = (sumInsured * aoaPercentage) / 100;
      const maxAllowedAOA = aoaLimit ? Math.min(calculatedAOA, aoaLimit) : calculatedAOA;
  
      if (numValue > maxAllowedAOA) {
        let message = `AOA cannot exceed ${aoaPercentage}% of sum insured (${calculatedAOA.toLocaleString()})`;
        if (aoaLimit) {
          message += ` or the absolute limit of ${aoaLimit.toLocaleString()}`;
        }
        message += `.\nValue will be capped at ${maxAllowedAOA.toLocaleString()}.`;
  
        setWarningMessage(message);
        setShowWarningPopup(true);
        setPendingChange({ index, field, value: maxAllowedAOA });
        
        updatedDetails[index].aoa = maxAllowedAOA;
        setAddonDetails(updatedDetails);
        return;
      }
    }

    if (field === 'aoy') {
      const sumInsured = Number(detail.sumInsured) || 0;
      const aoyPercentage = Number(detail.aoy_percentage) || 0;
      const aoyLimit = Number(detail.aoy_limit);
      const calculatedAOY = (sumInsured * aoyPercentage) / 100;
      const maxAllowedAOY = aoyLimit ? Math.min(calculatedAOY, aoyLimit) : calculatedAOY;
  
      if (numValue > maxAllowedAOY) {
        let message = `AOY cannot exceed ${aoyPercentage}% of sum insured (${calculatedAOY.toLocaleString()})`;
        if (aoyLimit) {
          message += ` or the absolute limit of ${aoyLimit.toLocaleString()}`;
        }
        message += `.\nValue will be capped at ${maxAllowedAOY.toLocaleString()}.`;
  
        setWarningMessage(message);
        setShowWarningPopup(true);
        setPendingChange({ index, field, value: maxAllowedAOY });
        
        updatedDetails[index].aoy = maxAllowedAOY;
        setAddonDetails(updatedDetails);
        return;
      }
    }
  
    if (field === 'sumInsured') {
      const originalSI = detail.originalSumInsured;
      
      // Calculate max allowed SI
      let maxAllowedBySIPercentage = originalSI;
      if (detail.si_limit_per) {
        maxAllowedBySIPercentage = (originalSI * Number(detail.si_limit_per)) / 100;
      }
  
      let maxAllowed = maxAllowedBySIPercentage;
      if (detail.si_limit) {
        maxAllowed = Math.min(maxAllowedBySIPercentage, Number(detail.si_limit));
      }
  
      // Check SI limit validations
      if (numValue > maxAllowed) {
        let message = '';
        if (numValue > maxAllowedBySIPercentage && detail.si_limit_per) {
          message = `Sum Insured exceeds the percentage limit of ${detail.si_limit_per}% (${maxAllowedBySIPercentage.toLocaleString()}).`;
        }
        if (detail.si_limit && numValue > Number(detail.si_limit)) {
          message += `\nSum Insured exceeds the absolute limit of ${Number(detail.si_limit).toLocaleString()}.`;
        }
        message += `\nValue will be capped at ${maxAllowed.toLocaleString()}.`;
  
        // Update SI to max allowed
        updatedDetails[index].sumInsured = maxAllowed;
        
        // Calculate premium with capped SI
        const currentRate = Number(detail.rate) || 0;
        updatedDetails[index].premium = calculateAddonPremium(maxAllowed, currentRate);
        updatedDetails[index].aoa = calculateAOA(
          maxAllowed,
          detail.aoa_percentage,
          detail.aoa_limit
        );
        updatedDetails[index].aoy = calculateAOY(
          maxAllowed,
          detail.aoy_percentage,
          detail.aoy_limit
        );
        setWarningMessage(message);
        setShowWarningPopup(true);
        setPendingChange({ index, field, value: maxAllowed });
        setAddonDetails(updatedDetails);
        return;
      }
  
      // Check free cover limit
      if (detail.freeCoverSi && 
          numValue > Number(detail.freeCoverSi) && 
          !warnedIndexes.has(index)) {
        setWarningMessage(`Sum Insured exceeds the free cover limit of ${Number(detail.freeCoverSi).toLocaleString()}. Premium will be charged for the excess amount.`);
        setShowWarningPopup(true);
        setPendingChange({ index, field, value });
        
        // Calculate premium even when exceeding free cover
        const currentRate = Number(detail.rate) || 0;
        updatedDetails[index].premium = calculateAddonPremium(numValue, currentRate);
        updatedDetails[index].aoa = calculateAOA(
          numValue,
          detail.aoa_percentage,
          detail.aoa_limit
        );
        updatedDetails[index].aoy = calculateAOY(
          maxAllowed,
          detail.aoy_percentage,
          detail.aoy_limit
        );
        setAddonDetails(updatedDetails);
        return;
      }
      const newAOA = calculateAOA(
        numValue,
        detail.aoa_percentage,
        detail.aoa_limit
      );
      const newAOY = calculateAOY(
        numValue,
        detail.aoy_percentage,
        detail.aoy_limit
      );
      updatedDetails[index].aoy = newAOY;
      updatedDetails[index].aoa = newAOA;
    }
  
    // For other fields or if no limits were exceeded
    if (field === 'sumInsured' || field === 'rate') {
      const si = Number(detail.sumInsured) || 0;
      const rate = Number(detail.rate) || 0;
      updatedDetails[index].premium = calculateAddonPremium(si, rate);
    }
  
    setAddonDetails(updatedDetails);
  };
  

  const handleWarningConfirm = () => {
    if (pendingChange) {
      const { index, field, value } = pendingChange;
      const updatedDetails = [...addonDetails];
      updatedDetails[index][field] = value;
      setAddonDetails(updatedDetails);
      
      // Add index to warned set
      setWarnedIndexes(prev => new Set([...prev, index]));
    }
    setShowWarningPopup(false);
    setPendingChange(null);
  };

  const handleCloseAddonPopup = () => {
    setShowAddonPopup(false);
    setSelectedAddons([]);
    setAddonDetails([]);
    setWarnedIndexes(new Set());
  };

  const handleAddonSubmit = () => {
    // Validate all fields have values
    const hasEmptyFields = addonDetails.some(detail => {
      const sumInsured = Number(detail.sumInsured);
      const rate = Number(detail.rate);
  
      return !sumInsured || !rate;
    });
  
    if (hasEmptyFields) {
      setWarningMessage('Please fill in all required fields for addon covers');
      setShowWarningPopup(true);
      return;
    }
  
    // Calculate total addon premium
    const addonPremium = addonDetails.reduce((total, detail) => {
      return total + (Number(detail.premium) || 0);
    }, 0);
  
    setTotalAddonPremium(addonPremium);
    setShowAddonPopup(false);
  };

  const organizedData = organizeData();

  // Calculate totals
  let totalPremium = submittedAddresses.reduce((total, address) => total + (address.premium || 0), 0) + marinePre;
  const gstAmount = (totalPremium + totalAddonPremium) * 0.18; // 18% GST
  const grossPremium = totalAddonPremium + totalPremium + gstAmount;
  const totalSumInsured = submittedAddresses.reduce((total, address) => total + (address.totalSumInsured || 0), 0);
  
  
  // Handle button clicks
  const formatDateTime = (isoString) => {
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

  const findNextAuthority = (matrix, addresses) => {
    // Get maximum sum insured from all addresses
    const maxSumInsured = addresses.reduce((max, address) => {
      const addressMax = Object.values(address.packageSumInsured)
        .reduce((sum, value) => Math.max(sum, parseFloat(value) || 0), 0);
      return Math.max(max, addressMax);
    }, 0);
  
    // Sort authority levels by max sum insured limit
    const sortedAuthorities = matrix.authority_levels
      .filter(auth => {
        const maxLimit = parseFloat(auth.settings.sum_insured.max);
        return !isNaN(maxLimit) && maxLimit >= maxSumInsured;
      })
      .sort((a, b) => {
        const aMax = parseFloat(a.settings.sum_insured.max) || Infinity;
        const bMax = parseFloat(b.settings.sum_insured.max) || Infinity;
        return aMax - bMax;
      });
  
    // Return the first authority level that can handle this sum insured
    return sortedAuthorities[0];
  };

  const handleSave = async () => {
    if(title === 'CPM' || title === 'IAR'){
      setShowRetentionPopup(true);
    }
    else {
      continueWithSave();
    }
  }

  const continueWithSave = async () => {
    try {
      submittedAddresses[0].addonDetails = addonDetails;
      submittedAddresses[0].isMarine = isChecked;
      submittedAddresses[0].marinePre = marinePre;
      submittedAddresses[0].machineryType = machineryType;
      if (!validateSumInsuredLimit()) {
        // Get current user's authority level and limits
        const userAuthority = deviationMatrix.authority_levels.find(
          level => level.level_name === userLevel
        );
  
        // Find next authority level that can handle the exceeded sum insured
        const nextAuthority = findNextAuthority(deviationMatrix, submittedAddresses);
        
        if (!nextAuthority) {
          alert("No authority level found that can handle this sum insured amount");
          return;
        }
       
  
        const now = formatDateTime(new Date().toISOString());
        const addressesJSON = JSON.stringify(submittedAddresses);
       
  
        // Save as pending quote
        await savePendingQuote(
          submittedAddresses,
          user,
          submittedAddresses[0].clientName || 'N/A',
          deviationMatrix.selected_types.join(', '), // deviationType from matrix
          `Pending with ${nextAuthority.level_name}`, // status with next authority
          user,
          now,
          addressesJSON,
          now
        );
  
        alert(`Quote saved for ${nextAuthority.level_name}'s approval`);
        return navigate('/home');
      }

      const currentUser = user;
      const addressesJSON = JSON.stringify(submittedAddresses);
      const time = formatDateTime(new Date().toISOString());

      if (submittedAddresses[0].isEdited) {
        await updatePolicy(submittedAddresses[0].editId, submittedAddresses, currentUser, title, addressesJSON, time, currentUser);
        await updateQuote(submittedAddresses[0].editId, submittedAddresses, currentUser, title, time, currentUser);
        alert("Quote updated successfully!");
        navigate('/home');
      }
      else {
        await savePolicy(submittedAddresses, currentUser, title, addressesJSON, time);
        await saveQuote(submittedAddresses, currentUser, title, time);
        alert("Quote saved successfully!");
        navigate('/home');
      }
      
    } catch (error) {
      alert(`Failed to save Quote: ${error.message}`);
    }
  };

  const calculatePremium = (sumInsured, rate) => {
    return (sumInsured * rate) / 1000;
  };

  const processSectionCovers = (sectionCovers, packageSumInsured) => {
    const coverPremiums = {};
    const coverSumInsured = {};
    
    Object.keys(sectionCovers).forEach(sectionKey => {
      const sumInsured = packageSumInsured[sectionKey] || 0;
      const covers = sectionCovers[sectionKey] || [];
      
      covers.forEach(coverInfo => {
        if (coverInfo.is_active) {
          const coverName = coverInfo.cover;
          const rate = coverInfo.rate;
          const premium = calculatePremium(sumInsured, rate);
          
          coverPremiums[coverName] = (coverPremiums[coverName] || 0) + premium;
          coverSumInsured[coverName] = (coverSumInsured[coverName] || 0) + sumInsured;
        }
      });
    });
    
    const result = Object.keys(coverPremiums).map(coverName => {
      return {
        name: coverName,
        sumInsured: coverSumInsured[coverName],
        rate: coverPremiums[coverName] / coverSumInsured[coverName] * 1000,
        premium: coverPremiums[coverName]
      };
    });
    
    return result;
  };

  const calculateFloaterPremium = (submittedAddresses) => {
    let totalFloaterPremium = 0;
  
    // Process each address
    for (let i = 0; i < submittedAddresses.length; i++) {
      const address = submittedAddresses[i];
      if (!address || !address.floater) continue; // Skip if address is undefined or not a floater
      
      const pkg = address.selectedpackages[0];
      
      // Process section covers and calculate values
      const coverPre = processSectionCovers(address.sectionCovers, address.packageSumInsured);
      
      // Calculate the base rate with risk factors consideration
      const baseRate = submittedAddresses.riskFactors ? 
        (coverPre[0].premium/coverPre[0].sumInsured*1000) * (1 + submittedAddresses.riskFactors/100) : 
        (coverPre[0].premium/coverPre[0].sumInsured*1000);
      
      // Calculate floater rate and premium
      const floaterRate = ((baseRate + address.sectionCovers[pkg][2].rate + 0.3)*10)/100;
      const addressFloaterPremium = (floaterRate * address.totalSumInsured)/1000;
      
      // Add to total
      totalFloaterPremium += addressFloaterPremium;
    }
    
    return totalFloaterPremium;
  }

  totalPremium += calculateFloaterPremium(submittedAddresses);

  function formatDate(dateString) {
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    return dateString;
  }

  const getTerrorismPremium = async () => {
    try {
      let totalTerrorPremium = 0;
      
      for (let i = 0; i < submittedAddresses.length; i++) {
        const address = submittedAddresses[i];
        if (!address) continue;
        const coverPre = processSectionCovers(address.sectionCovers, address.packageSumInsured);
        if (coverPre[3]) {
          totalTerrorPremium += coverPre[3].premium || 0;
        }
      }
      
      return totalTerrorPremium;
    } catch (error) {
      console.error("Error calculating terrorism premium:", error);
      return 0;
    }
  };

  const CPMPreview = async () => {
    try {
      let template = await fetch("temp/CPM_files/sheet002.htm");
      let htmlContent = await template.text();
      
      // Variables to store consolidated values
      let totalSumInsured = 0;
      let totalBasicPremium = 0;
      let totalSTFIPremium = 0;
      let totalEQPremium = 0;
      let totalTerrorPremium = 0;
      let totalPremiumBeforeGST = 0;
      let totalGST = 0;
      let totalGrossPremium = 0;
      let allEquipments = [];
      let allLocations = [];
      let floatRate = 0;
      let floatPre = 0;

      if(isChecked){
        totalPremiumBeforeGST += marinePre;
      }
      
      // Process all addresses to calculate combined totals
      for (let i = 0; i < submittedAddresses.length; i++) {
        const address = submittedAddresses[i];
        if (!address) continue; // Skip if address is undefined
        
        const pkg = address.selectedpackages[0];
        
        // Add location to consolidated locations list
        const locationAddress = address.locationAddress ? submittedAddresses.projectLocation : `${address.addressLine1}, ${address.areaVillage}, ${address.districtCity}, ${address.state}, ${address.pincode}`;
        if(submittedAddresses.length > 1){
          allLocations.push(`Location ${i+1}: ${locationAddress}`);
        }
        allLocations.push(locationAddress);
        
        // Add equipment details to consolidated equipment list
        if (address.equipmentDetails && address.equipmentDetails.length > 0) {
          address.equipmentDetails.forEach(item => {
            allEquipments.push(`${item.equipment} (Location ${i+1}: ${address.name})`);
          });
        }
        
        // Process section covers and calculate values
        const coverPre = processSectionCovers(address.sectionCovers, address.packageSumInsured);
        
        // Calculate floater details if applicable
        const baseRate = submittedAddresses.riskFactors ? 
        (coverPre[0].premium/coverPre[0].sumInsured*1000) * (1 + submittedAddresses.riskFactors/100) : 
        (coverPre[0].premium/coverPre[0].sumInsured*1000);
        const floaterRate = address.floater ? ((baseRate + address.sectionCovers[pkg][2].rate + 0.3)*10)/100 : '-';
        const floaterPremium = address.floater ? (floaterRate * address.totalSumInsured)/1000 : '-';
        const individualGST = address.floater ? 
          ((floaterPremium + address.premium) * 18)/100 : 
          ((address.premium) * 18)/100;
        
        // Add to consolidated totals
        totalSumInsured += address.totalSumInsured || 0;
        totalBasicPremium += coverPre[0].premium || 0;
        totalSTFIPremium += coverPre[1].premium || 0;
        totalEQPremium += coverPre[2].premium || 0;
        totalTerrorPremium += coverPre[3] ? coverPre[3].premium : 0;
        
        // Add premium before GST
        if (address.floater) {
          floatPre += floaterPremium;
          floatRate += floaterRate;
          totalPremiumBeforeGST += (floaterPremium + address.premium) || 0;
        } else {
          totalPremiumBeforeGST += address.premium || 0;
        }
        
        totalGST += individualGST || 0;
        
        // Add gross premium
        if (address.floater) {
          totalGrossPremium += (floaterPremium + address.premium + individualGST) || 0;
        } else {
          totalGrossPremium += (address.premium + individualGST) || 0;
        }
      }
      
      // Create consolidated addon rows
      let addonRows = "";
      const allAddons = {};

      const air = addonDetails.find(addon => addon.addonCoverName === "Air Freight");
      const express = addonDetails.find(addon => addon.addonCoverName === "Express freight");
      const custom = addonDetails.find(addon => addon.addonCoverName === "Additional Customs Duty");
      const isDredging = addonDetails.find(addon => addon.addonCoverName === "Waiver of Warranty for Dredging / Desilting/De-Dredging");
      // Combine addons from all addresses
        if (addonDetails && addonDetails.length > 0) {
          addonDetails.forEach(addon => {
            const addonKey = addon.addonCoverName || "N/A";
            if (!allAddons[addonKey]) {
              allAddons[addonKey] = {
                sumInsured: 0,
                premium: 0,
                rate: addon.rate || 0 // Use rate from first occurrence
              };
            }
            
            allAddons[addonKey].sumInsured += addon.sumInsured || 0;
            allAddons[addonKey].premium += addon.premium || 0;
          });
        }

      
      // Generate rows for consolidated addons
      Object.entries(allAddons).forEach(([addonName, data]) => {
        addonRows += `
          <tr height=19 style='height:14.5pt'>
            <td height=19 class=xl83 style='height:14.5pt;border-top:none'>${addonName}</td>
            <td class=xl81 colspan="4" style='border-top:none;border-left:none;text-align:right'><span
            style='mso-spacerun:yes'></span>${data.sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})}<span
            style='mso-spacerun:yes'></span></td>
            <td class=xl72 style='border-top:none;border-left:none;text-align:right'><span
            style='mso-spacerun:yes'></span>${data.premium.toLocaleString('en-IN', {maximumFractionDigits: 2})}<span
            style='mso-spacerun:yes'></span></td>
          </tr>`;
      });
      
      // Replace the template section with consolidated addon data
      htmlContent = htmlContent.replace(
        /<tr>New<\/tr>[\s\S]*?<tr>End<\/tr>/,
        addonRows
      );

      const floaterRow = `
      <tr height=58 style='height:43.5pt'>
        <td height=58 class=xl70 style='height:43.5pt;'>Marine
        Section</td>
        <td class=xl77 colspan="3" style='border-left:none'>Sum Insured (INR)</td>
        <td class=xl77 style='border-left:none'>Rate (%)</td>
        <td class=xl71 style='border-left:none'>Premium (INR)</td>
      </tr>
      <tr height=19 style='height:14.5pt'>
        <td height=19 class=xl83 style='height:14.5pt;'>Marine Cover</td>
        <td class=xl81 colspan="3" style='border-left:none;text-align:right'><span
        style='mso-spacerun:yes;text-align:right'></span>${totalSumInsured}<span
        style='mso-spacerun:yes'></span></td>
        <td class=xl82 style='border-left:none;text-align:right'><span
        style='mso-spacerun:yes;text-align:right'></span>${marineRate}<span
        style='mso-spacerun:yes'></span></td>
        <td class=xl72 style='border-left:none;text-align:right'><span
        style='mso-spacerun:yes;text-align:right'></span>${marinePre}<span
        style='mso-spacerun:yes'></span></td>
      </tr>
      <tr height=19 style='height:14.5pt'>
        <td colspan=3 height=19 class=xl135 style='border-right:1.0pt solid black;
        height:14.5pt'>Per Bottom</td>
        <td class=xl98 style='border-left:none;text-align:right'><span
        style='mso-spacerun:yes;text-align:right;text-align:right'></span>${totalSumInsured}<span
        style='mso-spacerun:yes'></span></td>
        <td colspan=2 height=19 class=xl135 style='border-right:1.0pt solid black;
        height:14.5pt'></td>
      </tr>
      <tr height=19 style='height:14.5pt'>
        <td colspan=3 height=19 class=xl135 style='border-right:1.0pt solid black;
        height:14.5pt'>Per Location</td>
        <td class=xl98 style='border-left:none;text-align:right'><span
        style='mso-spacerun:yes;text-align:right;text-align:right'></span>${totalSumInsured}<span
        style='mso-spacerun:yes'></span></td>
        <td colspan=2 height=19 class=xl135 style='border-right:1.0pt solid black;
        height:14.5pt'></td>
      </tr>
      <tr height=20 style='height:15.0pt'>
        <td height=20 class=xl69 style='height:15.0pt'>&nbsp;</td>
        <td class=xl69>&nbsp;</td>
        <td class=xl69>&nbsp;</td>
        <td class=xl69>&nbsp;</td>
      </tr>
      `;

      if(isChecked){htmlContent = htmlContent.replace(/<new>\s*<\/new>/, floaterRow);}

      
      // Get first address for some fields that won't be combined
      const firstAddress = submittedAddresses[0] || {};
      
      // Calculate average basic rate if needed
      let avgBasicRate = 0;
      if(submittedAddresses.riskFactors){
        totalBasicPremium += (totalBasicPremium * (parseInt(submittedAddresses.riskFactors)/100))
      }

      if (totalSumInsured > 0) {
        avgBasicRate = (totalBasicPremium / totalSumInsured) * 1000;
      }

      if(submittedAddresses.riskFactors){
        avgBasicRate = avgBasicRate 
      }

      const bankName = 'XXXXXXXXX';

      const newMachineryClauses = {
        clause1: "Inland Transit (Rail/Road/Air) Clause 'All Risk' - (2010).",
        clause2: "Strikes Riots and Civil Commotion Clause (Inland transit (including Air and Courier) not in conjunction with Ocean Going Voyage) 2010.",
        clause3: "Institute Radioactive Contamination, Chemical, Biological, Bio-Chemical, Electromagnetic Weapons Exclusion Clause CL.370 (10.11.03).",
        clause4: "Joint Excess Loss Cyber Losses Clause (JX2020-007).",
        clause5: "Private Carrier Limitation of Liability Clause.",
        clause6: "Termination of Transit Clause (Terrorism) JC 2009/056 (01/01/09).",
        clause7: "Cargo Termination of storage in transit clause (Amended).",
        clause8: "Institute Replacement Clause 1.1.1934 (New Machinery).",
        clause9: "Pair & Sets Clause (If applicable).",
        clause00: "Transit By Courier Clause (If applicable).",
        clause01: "Important Notice Clause.",
        clause02: "Sanction Limitation and Exclusion Clause (JC2010/014).",
        clause03: "Institute Standard Conditions for Cargo Contracts 1/4/82.",
        clause04: "JELC Communicable Disease Exclusion Clause (Cargo) (JC2020-011).",
        clause05: "Limit Per Sending (PSL) and Limit Per Location (PLL - In the Ordinary Course of Transit).",
        condition1: "Warranted vehicle clean and fit to carry cargo.",
        condition2: "Warranted policy covers new items only.",
        condition3: "Warranted that consignment is properly lashed and secured to the body of the multi axle low bed trailer with proper dunnage.",
        condition4: "Warranted Adequate Packing, Lashing, Stacking, Weight Distribution, Stowage, Securing Of Cargo On Carrying Conveyance/Container To Withstand The Intended Journey.",
        condition5: "Warranted The Load Carried By The Subject Carrying Vehicle Is Within The Permissible Carrying Capacity As Per Section 113, Subsection 3 Of MV Act 1988, As Per Notification S.O.3467(E) Dated 16.07.18, And Amendments Thereof. It Is Further Agreed That This This Warranty Shall Be Applicable Only Where Overloading Is The Proximate Cause Resulting In Loss Of Or Damage To Insured Cargo.",
        exclusions1: "Excluding loss of or damage to cargo due to rust, corrosion, oxidation, discoloration, mechanical, electrical, electronic derangement, denting, chipping and scratching, unless caused by ITC(B)perils.",
        exclusions2: "Excluding Over-dimensional cargo/Over-Weight Cargo. Over-dimensional Cargo/Over-Weight Cargo defined as: Any item which including packing does not fit inside a standard 40 container or equivalent road trailer, thus having dimensions in excess of 12 m. length and/or 2.5 m wide and/or 2.5 m height. Any item including packing with a weight in excess of 40 MT.",
        exclusions3: "Excluding Intentional Storage outside the ordinary course of transit.",
        exclusions4: "Excluding Loss Or Damage To The Subject Matter Insured Where Such Loss Or Damage As A Result Of The Carrying Vehicle Not Being A Roadworthy Condition.",
        exclusions5: "Excluding Tail End Risk.",
        exclusions6: "Excluding Machinery Moving In Own Power.",
        other1: "Provided always that in no case shall the liability of Underwriters exceed the insured value of the complete machine.",
        other2: "Excess : 1) Excess : 1% of consignment value subject to a minimum of Rs.50,000/- for each and every claim. 2) Excess for Non delivery/Loading & unloading Rs.1 lakh over and above regular excess.",
        other3: `The Name of the following financial institution is hereby included in the policy for their respective rights & interests: (Bank Name: ${bankName}).`,
        other4: "Basis of Valuation - Invoice Value.",
        other5: "Including the risk of Loading and Unloading subject to Lifting and Handing equipments are certified fit to perform the Loading & Unloading operations of the subject matter insured hereunder.",
        other6: "Loading and Unloading operations are performed in the presence of trained personnel of the insured.",
        other7: "Including the risk of Non delivery of the entire consignment.",
        other8: "Anywhere in the India to Anywhere in India including the risk of Multi Transit.",
        cancelClause: "This policy is subject to 30 days notice of cancellation by either party. In case the cancellation notice is served by the Insured this policy will refund the premium on the unexpired period on pro-rata basis subject to nil claims having been reported as on the date of cancellation. It is further agreed that all benefits under this policy shall stand forfeited from the date of notice of cancellation.",
        period: "This Policy to remain in force for a period as specified in the Schedule of the Policy unless cancelled either side as per the Cancellation Clause herein or Sum Insured is exhausted by declarations whichever is earlier."
      };

      const oldMachineryClauses = {
        clause1: "Inland Transit (Rail/Road) Clause 'Basic Risk' - (Named Perils) 2010.",
        clause2: "Strikes Riots and Civil Commotion Clause (Inland transit (including Air and Courier) not in conjunction with Ocean Going Voyage) 2010.",
        clause3: "Institute Radioactive Contamination, Chemical, Biological, Bio-Chemical, Electromagnetic Weapons Exclusion Clause CL.370 (10.11.03).",
        clause4: "Joint Excess Loss Cyber Losses Clause (JX2020-007).",
        clause5: "Private Carrier Limitation of Liability Clause.",
        clause6: "Termination of Transit Clause (Terrorism) JC 2009/056 (01/01/09).",
        clause7: "Cargo Termination of storage in transit clause (Amended).",
        clause8: "Second-hand Machinery Replacement Clause - Applicable for Second hand Machinery.",
        clause9: "Pair & Sets Clause (If applicable).",
        clause00: "Transit By Courier Clause (If applicable).",
        clause01: "Important Notice Clause.",
        clause02: "Sanction Limitation and Exclusion Clause (JC2010/014).",
        clause03: "Institute Standard Conditions for Cargo Contracts 1/4/82.",
        clause04: "JELC Communicable Disease Exclusion Clause (Cargo) (JC2020-011).",
        clause15: "Limit Per Sending (PSL) and Limit Per Location (PLL - In the Ordinary Course of Transit).",
        condition1: "Warranted vehicle clean and fit to carry cargo.",
        condition2: "Warranted that consignment is properly lashed and secured to the body of the multi axle low bed trailer with proper dunnage.",
        condition3: "Warranted Adequate Packing, Lashing, Stacking, Weight Distribution, Stowage, Securing Of Cargo On Carrying Conveyance/Container To Withstand The Intended Journey.",
        condition4: "Warranted The Load Carried By The Subject Carrying Vehicle Is Within The Permissible Carrying Capacity As Per Section 113, Subsection 3 Of MV Act 1988, As Per Notification S.O.3467(E) Dated 16.07.18, And Amendments Thereof. It Is Further Agreed That This This Warranty Shall Be Applicable Only Where Overloading Is The Proximate Cause Resulting In Loss Of Or Damage To Insured Cargo.",
        condition5: "For all consignments moving in insured's own vehicles or in absence of recovery rights settlement to be made on 75% basis.",
        exclusions1: "Excluding loss of or damage to cargo due to rust, corrosion, oxidation, discoloration, mechanical, electrical, electronic derangement, denting, chipping and scratching, unless caused by ITC(B)perils.",
        exclusions2: "Excluding Over-dimensional cargo/Over-Weight Cargo. Over-dimensional Cargo/Over-Weight Cargo defined as: Any item which including packing does not fit inside a standard 40 container or equivalent road trailer, thus having dimensions in excess of 12 m. length and/or 2.5 m wide and/or 2.5 m height. Any item including packing with a weight in excess of 40 MT.",
        exclusions3: "Excluding Intentional Storage outside the ordinary course of transit.",
        exclusions4: "Excluding Loss Or Damage To The Subject Matter Insured Where Such Loss Or Damage As A Result Of The Carrying Vehicle Not Being A Roadworthy Condition.",
        exclusions5: "Excluding Tail End Risk.",
        exclusions6: "Excluding Machinery Moving In Own Power.",
        other1: "Provided always that in no case shall the liability of Underwriters exceed the insured value of the complete machine.",
        other2: "Excess : 1) Excess : 1% of consignment value subject to a minimum of Rs.50,000/- for each and every claim. 2) Excess for Non delivery/Loading & unloading Rs.1 lakh over and above regular excess.",
        other3: `The Name of the following financial institution is hereby included in the policy for their respective rights & interests: (Bank Name: ${bankName}).`,
        other4: "Basis of Valuation - Depreciated Market Value for Used/Old Secondhand Machinery.",
        other5: "Including the risk of Loading and Unloading subject to Lifting and Handing equipments are certified fit to perform the Loading & Unloading operations of the subject matter insured hereunder.",
        other6: "Loading and Unloading operations are performed in the presence of trained personnel of the insured.",
        other7: "Including the risk of Non delivery of the entire consignment.",
        other8: "Anywhere in the India to Anywhere in India including the risk of Multi Transit.",
        cancelClause: "This policy is subject to 30 days notice of cancellation by either party. In case the cancellation notice is served by the Insured this policy will refund the premium on the unexpired period on pro-rata basis subject to nil claims having been reported as on the date of cancellation. It is further agreed that all benefits under this policy shall stand forfeited from the date of notice of cancellation.",
        period: "This Policy to remain in force for a period as specified in the Schedule of the Policy unless cancelled either side as per the Cancellation Clause herein or Sum Insured is exhausted by declarations whichever is earlier."
      };
      
      const selectedClauses = machineryType === 'New Machinery' ? newMachineryClauses : oldMachineryClauses;
      // Create consolidated replacements
      const replacements = {
        '{total}': Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{basic-sum}': Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{stfi-sum}': Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{eq-sum}': Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{float-sum}': Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{terror-sum}': totalTerrorPremium ? Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}) : '-',
        '{basic-rate}': Number(avgBasicRate.toFixed(4)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{eq-rate}': Number((firstAddress.sectionCovers && firstAddress.selectedpackages ? 
          firstAddress.sectionCovers[firstAddress.selectedpackages[0]][2].rate : 0).toFixed(4)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{basic-premium}': Number(totalBasicPremium.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{stfi-premium}': Number(totalSTFIPremium.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{eq-premium}': Number(totalEQPremium.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{equipments}': submittedAddresses.projectNature,
        '{hypo}': submittedAddresses.hypothecation,
        '{terror-premium}': totalTerrorPremium ? Number(totalTerrorPremium.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}) : '-',
        '{total-pre}': Number(totalPremiumBeforeGST.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{gst}': Number(totalGST.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{overall-pre}': Number(totalGrossPremium.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{name}': firstAddress.name, // Could be changed to a list of all names if preferred
        '{address}': `${firstAddress.addressLine1}, ${firstAddress.areaVillage}, ${firstAddress.districtCity}, ${firstAddress.state}, ${firstAddress.pincode}`, 
        '{location-address}': allLocations.join('\n'),
        '{from}': formatDate(firstAddress.policyPeriod) || '',
        '{to}': formatDate(firstAddress.policyEndPeriod) || '',
        '{terror}': totalTerrorPremium ? '0.5% of Sum insured Subject to Minimum of Rs. 1 lac and max of 10 Cr' :'Not Covered',
        '{group1}': Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{Discount}': Math.abs(submittedAddresses.riskFactors || 0),
        '{terror-rate}': totalTerrorPremium ? '0.21' : '-',
        '{air}': air ? '5 % of the air freight incurred per claim' :'Not Covered',
        '{express}': express ? 'Highest of the Excesses applicable to the Machineries insured' : 'Not Covered',
        '{custom}': custom ? '2% of Additional Customs Duty incurred per claim' : 'Not Covered',
        '{group2}': '-',
        '{group3}': '-',
        '{group4}': '-',
        '{group5}': '-',
        '{excess}': isDredging ? '2 times of Normal Excess ' : '-',
        '{exc}': isChecked ? selectedClauses.other2 : '',
        '{marin-condition}': isChecked ? 'Marine cover for 3 transits per Year' : '',
        '{claim}': submittedAddresses.claimExperience,
        '{floater-sum}': firstAddress.floater ? Number(totalSumInsured.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}) : '-',
        '{floater-rate}': firstAddress.floater ? Number(floatRate.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}) : '-', // Would need more complex calculation for consolidated rate
        '{floater-premium}': firstAddress.floater ? Number(floatPre.toFixed(2)).toLocaleString('en-IN', {maximumFractionDigits: 2}) :'-', // Would need more complex calculation for consolidated premium
        ...selectedClauses
      };
      
      // Apply all replacements
      Object.entries(replacements).forEach(([key, value]) => {
        htmlContent = htmlContent.replace(new RegExp(key, 'g'), value);
      });
  
      // Generate consolidated equipment table if needed
      let allEquipmentDetails = [];
      submittedAddresses.forEach((address, index) => {
        if (address && (address.multiEquipment || submittedAddresses.length > 1) && address.equipmentDetails && address.equipmentDetails.length > 0) {
          address.equipmentDetails.forEach(item => {
            const enhancedItem = {
              ...item,
              equipment: `${item.equipment}`,
              locationIndex: index,
              locationAddress: `${address.addressLine1}, ${address.areaVillage}, ${address.districtCity}, ${address.state}, ${address.pincode}`,
            };
            allEquipmentDetails.push(enhancedItem);
          });
        }
      });

      let fullEquipmentDetails = [];
      submittedAddresses.forEach((address, index) => {
        if (address && address.equipmentDetails && address.equipmentDetails.length > 0) {
          address.equipmentDetails.forEach(item => {
            const enhancedItem = {
              ...item,
              equipment: `${item.equipment}`,
              locationIndex: index
            };
            fullEquipmentDetails.push(enhancedItem);
          });
        }
      });

      function getEquipmentCode(equipmentDesc) {
        const codeMatch = equipmentDesc.match(/^(\d+)(?:-|\(.*?\))/);
        return codeMatch ? codeMatch[1] : null;
      }
      
      // Function to get sum insured for equipment based on its code
      function getEquipmentValue(item, addresses) {
        const equipmentCode = getEquipmentCode(item.equipment);
        if (!equipmentCode) return 0;
        
        // Get the address this equipment belongs to
        const address = addresses[item.locationIndex];
        if (!address || !address.packageSumInsured) return 0;
        // Find the matching packageSumInsured entry
        for (const key in address.packageSumInsured) {
          if (address.multiEquipment && key.startsWith(`${equipmentCode}-`)) {
            return address.packageSumInsured[key];
          }
          else if(!address.multiEquipment) {
            return address.packageSumInsured["Contractor's Plant and Machinery"];
          }
        }
        return 0;
      }

      if (fullEquipmentDetails.length > 0) {
        const propertyDescriptionPattern = /<tr height=19 style='height:14\.5pt'>\s*<td colspan=5 height=19 class=xl70 style='height:14\.5pt'>Property Description<\/td>[\s\S]*?<tr height=20 style='height:15\.0pt'>\s*<td colspan=5 height=20 class=xl149 style='height:15\.0pt'>Total Sum Insured[\s\S]*?<\/tr>/;
        
        // Calculate total equipment value
        let totalEquipmentValue = 0;
        fullEquipmentDetails.forEach(item => {
          const value = getEquipmentValue(item, submittedAddresses);
          totalEquipmentValue += value;
        });
        
        const equipmentTable = `
          <tr height=19 style='height:14.5pt'>
            <td height=19 class=xl70 style='height:14.5pt'>Equipment Name</td>
            <td class=xl70 style='height:14.5pt'>Make</td>
            <td class=xl70 style='height:14.5pt'>Model</td>
            <td class=xl70 style='height:14.5pt'>Serial No</td>
            <td class=xl70 style='height:14.5pt'>YOM</td>
            <td class=xl71 style='border-left:none'>Sum Insured (INR)</td>
          </tr>
          ${fullEquipmentDetails.map(item => {
            const value = getEquipmentValue(item, submittedAddresses);
            return `
              <tr height=19 style='height:14.5pt'>
                <td height=19 class=xl147 style='height:14.5pt'>${item.equipment || ''}</td>
                <td class=xl147 style='height:14.5pt'>${item.make || ''}</td>
                <td class=xl147 style='height:14.5pt'>${item.model || ''}</td>
                <td class=xl147 style='height:14.5pt'>${item.serialNo || ''}</td>
                <td class=xl147 style='height:14.5pt'>${item.yom || ''}</td>
                <td class=xl72 style='border-top:none;border-left:none;text-align:right'>${Number(value).toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              </tr>`;
          }).join('')}
          <tr height=20 style='height:15.0pt'>
            <td colspan=5 height=20 class=xl149 style='height:15.0pt'>Total Equipment Value (INR)</td>
            <td class=xl73 style='border-top:none;border-left:none;text-align:right'>${Number(totalEquipmentValue).toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>`;
        
        htmlContent = htmlContent.replace(propertyDescriptionPattern, equipmentTable);
      }
      
      if (allEquipmentDetails.length > 0) {
        const equipmentTable = generateEquipmentAnnexureTable(allEquipmentDetails, firstAddress.packageSumInsured);
        
        const hasXlsxScript = htmlContent.includes('XLSX');
        
        if (!hasXlsxScript) {
          const xlsxScript = `<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>`;
          htmlContent = htmlContent.replace('</head>', `${xlsxScript}</head>`);
        }
        
        htmlContent = htmlContent.replace('id="multilEquipment"', 'id="multilEquipment">' + equipmentTable);
      }

      htmlContent = htmlContent.replace(/id="multilEquipment">/g, '');
      htmlContent = htmlContent.replace(/id="multilEquipment"/g, '');
      
      // Open a single window with consolidated data
      const newWindow = window.open("", "_blank", "width=700,height=600,title=Consolidated CPM Preview");
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    
    } catch (error) {
      console.error("Error generating consolidated preview:", error);
      alert("Failed to generate consolidated preview: " + error.message);
    }
  }

  function getEquipmentCode(equipmentDesc) {
    const codeMatch = equipmentDesc.match(/^(\d+)(?:-|\(.*?\))/);
    return codeMatch ? codeMatch[1] : null;
  }
  
  // Function to get sum insured for equipment based on its code
  function getEquipmentValue(item, addresses) {
    const equipmentCode = getEquipmentCode(item.equipment);
    if (!equipmentCode) return 0;
    
    // Get the address this equipment belongs to
    const address = addresses[item.locationIndex];
    if (!address || !address.packageSumInsured) return 0;
    // Find the matching packageSumInsured entry
    for (const key in address.packageSumInsured) {
      if (address.multiEquipment && key.startsWith(`${equipmentCode}-`)) {
        return address.packageSumInsured[key];
      }
      else if(!address.multiEquipment) {
        return address.packageSumInsured["Contractor's Plant and Machinery"];
      }
    }
    return 0;
  }

  function generateEquipmentAnnexureTable(equipmentDetails, packageSumInsured) {
    if (!equipmentDetails || equipmentDetails.length === 0) return '';
    
    let tableHtml = `
    <div class="equipment-annexure" style="margin-top: 20px;">
      <h3>Equipment Annexure</h3>
      <table id="equipmentTable" border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <th>Location</th>
          <th>Equipment Name</th>
          <th>Make</th>
          <th>Model</th>
          <th>Serial No</th>
          <th>YOM</th>
          <th>SI Value</th>
        </tr>`;
    
    equipmentDetails.forEach(item => {
      // Extract equipment name
      const equipmentName = item.equipment;
      // Create the key to look up the sum insured
      const sumInsured = getEquipmentValue(item, submittedAddresses);
      
      tableHtml += `
        <tr>
          <td>${item.locationAddress}</td>
          <td>${equipmentName}</td>
          <td>${item.make || '-'}</td>
          <td>${item.model || '-'}</td>
          <td>${item.serialNo || '-'}</td>
          <td>${item.yom || '-'}</td>
          <td>${sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
        </tr>`;
    });
    
    tableHtml += `
      </table>
      <button onclick="downloadEquipmentExcel()" style="margin-top: 10px;">Equipment Annexure Download as Excel</button>
    </div>
    <script>
      function downloadEquipmentExcel() {
        try {
          if (typeof XLSX === 'undefined') {
            alert("Excel library not loaded. Please try again after page fully loads.");
            return;
          }
          
          var wb = XLSX.utils.table_to_book(document.getElementById('equipmentTable'), {sheet: "Equipment Annexure"});
          XLSX.writeFile(wb, 'Equipment_Annexure.xlsx');
        } catch (error) {
          console.error("Error downloading Excel:", error);
          alert("Failed to download Excel: " + error.message);
        }
      }
    </script>`;
    
    return tableHtml;
  }

  const onClose = () => {
    setShowRiskInspectionPopup(false);
  }

  const handlePreview = async () => {
    const product =  submittedAddresses[0].title !== "CPM";
    if(product){
      try {
        let template = await fetch("temp/IAR_files/sheet001.htm");
        let htmlContent = await template.text();
    
        // Process multiple addresses
        const allAddresses = submittedAddresses || [];
        
        // Consolidated data structures
        let terrorismValue = 0; 
        let totalSumInsured = 0;
        let totalPremium = 0;
        let consolidatedSections = {};
        let locationCount = allAddresses.length;
        let locationAddressText = '';
        
        // Build location addresses string
        allAddresses.forEach((address, index) => {
          if(address) {
            locationAddressText += `Location ${index + 1}: ${address.name || "Unknown"} - ${address.addressLine1 || ""}, ${address.areaVillage || ""}, ${address.districtCity || ""}, ${address.state || ""}, ${address.pincode || ""}\n`;
          }
        });
        
        // Process all addresses to consolidate section data
        allAddresses.forEach((address, addressIndex) => {
          if(!address) return;
          
          // Add this address's premium to total
          totalPremium += address.premium || 0;
          
          if(address.selectedpackages && address.sections) {
            address.selectedpackages.forEach(sectionName => {
              const sectionData = address.sections[sectionName] || {};
              const sumInsured = address.packageSumInsured[sectionName] || 0;
              // Add terrorism premium
              terrorismValue += sectionData.terrorism || 0;
              
              // Create or update section in consolidated data
              if(!consolidatedSections[sectionName]) {
                consolidatedSections[sectionName] = {
                  sectionName: sectionName,
                  sumInsured: 0,
                  premium: 0,
                  terrorism: 0,
                  locations: [],
                  components: {},  // Changed to object to track components across locations
                  basisOfValuation: sectionData.basisOfValuation || '',
                  excess: sectionData.excess || ''
                };
              }
              
              // Add this location to this section's locations
              consolidatedSections[sectionName].locations.push(addressIndex + 1);
              
              // Add sum insured and premiums
              consolidatedSections[sectionName].sumInsured += sumInsured;
              consolidatedSections[sectionName].premium += (sectionData.premium - sectionData.terrorism) || 0;
              consolidatedSections[sectionName].terrorism += sectionData.terrorism || 0;
              
              // Process components for this section and consolidate values
              if(address.packageComponentValues && address.packageComponentValues[sectionName]) {
                const packageValues = address.packageComponentValues[sectionName];
                
                Object.keys(packageValues).forEach(key => {
                  if (!key.includes('_premium') && !key.includes('_terror')) {
                    if(!consolidatedSections[sectionName].components[key]) {
                      consolidatedSections[sectionName].components[key] = {
                        name: key,
                        sumInsured: 0
                      };
                    }
                    // Add this location's component value to consolidated total
                    consolidatedSections[sectionName].components[key].sumInsured += packageValues[key] || 0;
                  }
                });
              }
            });
          }
          
          // Add to total insured amount
          totalSumInsured += address.totalSumInsured || 0;
        });

        
        // Convert consolidated sections to array for rendering
        const sectionsData = Object.values(consolidatedSections).map((section, index) => {
          // Convert components object to array
          const componentsArray = Object.values(section.components).map(comp => ({
            name: comp.name,
            sumInsured: comp.sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})
          }));

          let excessText = section.excess || '';

          let indemnityPeriod = submittedAddresses[0].selectedNumber;
  
          const showIndemnityPeriod = 
            section.sectionName === "BUSINESS INTERRUPT" || 
            section.sectionName === "Machinery Loss of Profit" || 
            section.sectionName === "FLOP";
          
  
          if (section.sectionName === "BUSINESS INTERRUPT" || section.sectionName === "FLOP") {
            excessText = "Policies having Sum Insured upto INR 100 Cr per location for PD & BI :\n" +
                         "Material Damage - 5% of claim amount subject to a minimum of 5 lakhs\n" +
                         "Business Interruption (FLOP) - 7 days of Standard Gross Profit (Other than Petro Chemical Risks)\n\n" +
                         "Policies having Sum Insured above INR 100 Cr and up to INR 1500 cr per location for PD & BI :\n" +
                         "Material Damage - 5% of claim amount subject to a minimum of 25 lakhs\n" +
                         "Business Interruption (FLOP) - 7 days of Standard Gross Profit (Other than Petro Chemical Risks)\n\n" +
                         "Policies having Sum Insured above INR 1500 Cr and up to INR 2500 cr per location for PD & BI :\n" +
                         "Material Damage - 5% of claim amount subject to a minimum of 25 lakhs\n" +
                         "Business Interruption (FLOP) - 7 days of Standard Gross Profit (Other than Petro Chemical Risks)";
          } else if (section.sectionName === "Machinery Loss of Profit") {
            excessText = "Policies having Sum Insured upto INR 100 Cr per location for PD & BI :\n" +
                         "Material Damage - 5% of claim amount subject to a minimum of 5 lakhs\n" +
                         "Business Interruption (FLOP) - 14 days of Standard Gross Profit (Other than Petro Chemical Risks)\n\n" +
                         "Policies having Sum Insured above INR 100 Cr and up to INR 1500 cr per location for PD & BI :\n" +
                         "Material Damage - 5% of claim amount subject to a minimum of 25 lakhs\n" +
                         "Business Interruption (FLOP) - 14 days of Standard Gross Profit (Other than Petro Chemical Risks)\n\n" +
                         "Policies having Sum Insured above INR 1500 Cr and up to INR 2500 cr per location for PD & BI :\n" +
                         "Material Damage - 5% of claim amount subject to a minimum of 25 lakhs\n" +
                         "Business Interruption (FLOP) - 14 days of Standard Gross Profit (Other than Petro Chemical Risks)";
          }

          
          return {
            romanNumeral: getRomanNumeral(index + 1),
            sectionName: section.sectionName,
            locationNumber: section.locations.length,
            locationAddress: locationAddressText,
            isFirstSection: index === 0,
            basisOfValuation: section.basisOfValuation || '',
            occupancy: allAddresses[0]?.occupancyType || '',  // Using first address for occupancy
            components: componentsArray,
            excess: excessText,
            indemnityPeriod: indemnityPeriod,
            showIndemnityPeriod: showIndemnityPeriod 
          };
        });

        const gstAmount = (totalPremium * 0.18);
  
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
  
        // Generate rows for consolidated sections
        const sectionRows = Object.values(consolidatedSections).map((section, index) => {
          const sumInsured = section.sumInsured || 0;
          const premium = section.premium || 0;
          const terrorismPremium = section.terrorism || 0;
          const total = premium + terrorismPremium;
  
          return `
            <tr height=24>
              <td colspan=2 class=xl130><font class="font13">${getRomanNumeral(index + 1)}</font></td>
              <td colspan=10 class=xl116><font class="font13">${section.sectionName}</font></td>
              <td colspan=8 class="xl008">${sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td colspan=4 class="xl008"style='text-align:right'>${premium.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td colspan=7 class="xl008"style='text-align:right'>${terrorismPremium.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td colspan=4 class="xl008"style='text-align:right'>${total.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            </tr>`;
        }).join('');
  
        // Replace coverage section in template
        const coverageSection = coverageDetails + sectionRows + closingRow;
        htmlContent = htmlContent.replace(
          /<tr height=24>\s*<td colspan=35.*?6\. COVERAGE DETAILS.*?(?=<tr height=7)/s,
          coverageSection
        );

        const grossPremium = totalPremium + gstAmount;
        
        // Use first address for general info
        const firstAddress = allAddresses[0] || {};
    
        // Replace other dynamic values
        const replacements = {
          '{PRODUCT_TITLE}': firstAddress.title || '',
          '{{Policy No}}': '',
          '{UIN_NUMBER}': '',
          '{branch-add}': '',
          '{sac-code}': '',
          '{sac-des}': '',
          '{now}': new Date().toLocaleDateString(),
          '{{INSURED_NAME}}': firstAddress.name || '',
          '{{POLICY_DATE}}': new Date().toLocaleDateString(),
          '{from}': formatDate(firstAddress.policyPeriod) || '',
          '{to}': formatDate(firstAddress.policyEndPeriod) || '',
          '{PAN No}': firstAddress.panNumber || '',
          '{address}': locationAddressText || '',
          '{phone}': firstAddress.mobile || '',
          'premium exlcude terr': Number((totalPremium-terrorismValue).toFixed(2)),
          'terrorism opt' : Number(terrorismValue.toFixed(2)),
          '{SGST}': Number((gstAmount/2).toFixed(2)),
          '{CGST}': Number((gstAmount/2).toFixed(2)),
          '{Gross Premium}': Number(grossPremium.toFixed(2))
        };
        
    
        Object.entries(replacements).forEach(([key, value]) => {
          htmlContent = htmlContent.replace(new RegExp(key, 'g'), value);
        });
    
        const newWindow = window.open("", "_blank", "width=870,height=600,title=Consolidated CPM Preview");
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    
      } catch (error) {
        console.error("Error generating preview:", error);
        alert("Failed to generate preview");
      }
    }
    else {
      CPMPreview();
    }
  }
  
  // Helper function for Roman numerals
  const getRomanNumeral = (num) => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
    return romanNumerals[num - 1] || num.toString();
  };

  // Add a handler for the back button
  const handleBack = () => {
    navigate('/general', { state: { item: submittedAddresses, title: title, currentStep: currentStep, isEdit: true } });
  };

  return (
    <>
    <div className="preview-container">
      <h2 className="preview-title"></h2>
      
      <div className="premium-summary-section">
        {/* Added Back button here */}
        <button 
          className="add-button"
          onClick={handleBack}
        >
          Previous
        </button>
        
        <button 
          className="premium-breakup-btn"
          onClick={() => setShowPremiumBreakup(true)}
        >
          Premium Breakup
        </button>
        <button 
          className="addon-btn"
          onClick={handleAddonClick}
        >
          {selectedAddons.length ? "Add/Edit Addon" : "Add Addon"}
        </button>
        {showWarningPopup && (
          <div className="preview-warn-popup-overlay">
            <div className="preview-warn-popup-content warning-popup">
              <div className="preview-popup-header">
                <h2>Warning</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowWarningPopup(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="preview-popup-body">
                <p>{warningMessage}</p>
              </div>
              
              <div className="preview-popup-footer">
                <button 
                  className="submit-btn"
                  onClick={handleWarningConfirm}
                >
                  Continue
                </button>
                <button 
                  className="close-btn-bottom"
                  onClick={() => {
                    setShowWarningPopup(false);
                    setPendingChange(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddonPopup && (
          <div className="preview-popup-overlay">
            <div className="preview-popup-content">
              <div className="preview-popup-header">
                <h2>Select Addons</h2>
                <button 
                  className="close-btn"
                  onClick={handleCloseAddonPopup}
                >
                  ×
                </button>
              </div>
              
              <div className="preview-popup-body">
                <Select
                  isMulti
                  value={selectedAddons}
                  onChange={handleAddonChange}
                  options={addonOptions}
                  placeholder="Select Addons..."
                  className="addon-select"
                />
                {addonDetails.length > 0 && (
                  <table className="addon-details-table">
                    <thead>
                      <tr>
                        <th>Addon Cover Name</th>
                        <th>Sum Insured</th>
                        <th>Rate</th>
                        <th>Premium</th>
                        <th>AOA</th>
                        <th>AOY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addonDetails.map((detail, index) => {
                        const percentageAmount = (detail.originalSumInsured * Number(detail.freeCoverSiPer)) / 100;
                        const isWithinFreeLimit = detail.freeCoverSiPer && 
                          detail.freeCoverSi && 
                          Number(detail.sumInsured) <= Number(detail.freeCoverSi) &&
                          Number(detail.sumInsured) <= percentageAmount;

                        return (
                          <tr key={index}>
                            <td>{detail.addonCoverName}</td>
                            <td>
                              <input
                                type="number"
                                value={detail.sumInsured}
                                onChange={(e) => handleAddonDetailChange(index, 'sumInsured', e.target.value)}
                                placeholder="Enter Sum Insure"
                                className="sum-insured-input"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={isWithinFreeLimit ? '' : detail.rate}
                                onChange={(e) => handleRateChange(index, e.target.value)}
                                onBlur={() => handleRateBlur(index)}
                                placeholder={isWithinFreeLimit ? "Free Cover" : "Enter Rate"}
                                disabled={isWithinFreeLimit}
                                className={isWithinFreeLimit ? 'disabled-input' : ''}
                              />
                            </td>
                            <td>
                              {isWithinFreeLimit ? "Free Cover" : 
                                detail.premium ? detail.premium.toFixed(2) : '0.00'}
                            </td>
                            <td>
                              <input
                                type="number"
                                value={isWithinFreeLimit ? '' : detail.aoa}
                                onChange={(e) => handleAddonDetailChange(index, 'aoa', e.target.value)}
                                placeholder={isWithinFreeLimit ? "Free Cover" : "Enter AOA"}
                                disabled={isWithinFreeLimit}
                                className={isWithinFreeLimit ? 'disabled-input' : ''}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={isWithinFreeLimit ? '' : detail.aoy}
                                onChange={(e) => handleAddonDetailChange(index, 'aoy', e.target.value)}
                                placeholder={isWithinFreeLimit ? "Free Cover" : "Enter AOY"}
                                disabled={isWithinFreeLimit}
                                className={isWithinFreeLimit ? 'disabled-input' : ''}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="preview-popup-footer">
                <button 
                  className="submit-btn"
                  onClick={handleAddonSubmit}
                >
                  Add Addons
                </button>
                <button 
                  className="close-btn-bottom"
                  onClick={handleCloseAddonPopup}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="premium-summary">
          {title === "CPM" && (<div className="summary-item">
            <span className="summary-label">
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="ml-2"
            />Marine Cover Required</span>
            <span className="summary-value">₹{new Intl.NumberFormat('en-IN').format(marinePre.toFixed(2))}</span>
          </div>)}
          {title === "CPM" && isChecked && (
            <div className="summary-item">
              <span className="summary-label">Marine Cover Rate:</span>
              <span className="summary-value">
                <input
                  type="number"
                  value={marineRate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 2) {
                      handleMarineRateChange(value);
                    }
                  }}
                  step="0.01"
                  min="0"
                  max="2"
                  className="marine-rate-input"
                  style={{ width: "60px", textAlign: "right" }}
                />
              </span>
            </div>
          )}
          {title === "CPM" && isChecked && (
            <div className="summary-item">
              <span className="summary-label">New Machinary or Old Machinary:</span>
              <span className="summary-value">
                <select
                  value={machineryType}
                  onChange={(e) => setMachineryType(e.target.value)}
                  className="machinery-type-select"
                  style={{ width: "150px" }}
                >
                  <option value="New Machinery">New Machinery</option>
                  <option value="Old Machinery">Old Machinery</option>
                </select>
              </span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">Total Premium:</span>
            <span className="summary-value">₹{new Intl.NumberFormat('en-IN').format(totalPremium.toFixed(2))}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Addon Premium(if Applicable):</span>
            <span className="summary-value">₹{new Intl.NumberFormat('en-IN').format(totalAddonPremium.toFixed(2))}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">GST (18%):</span>
            <span className="summary-value">₹{new Intl.NumberFormat('en-IN').format(gstAmount.toFixed(2))}</span>
          </div>
          <div className="summary-item gross-premium">
            <span className="summary-label">Gross Premium:</span>
            <span className="summary-value">₹{new Intl.NumberFormat('en-IN').format(grossPremium.toFixed(2))}</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="save-btn" onClick={handleSave}>Generate Proposal</button>
          <button className="preview-btn" onClick={handlePreview}>Preview</button>
        </div>
      </div>
      
      {/* Premium Breakup Popup */}
      {showPremiumBreakup && (
        <div className="preview-popup-overlay">
          <div className="preview-popup-content">
            <div className="preview-popup-header">
              <h2>Premium Breakup Details</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPremiumBreakup(false)}
              >
                ×
              </button>
            </div>
            
            <div className="preview-popup-body">
              {submittedAddresses.length === 0 ? (
                <div className="empty-message">No address data found.</div>
              ) : (
                <div className="premium-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Location</th>
                        <th>Section</th>
                        <th>Component</th>
                        <th>Terrorism Exculded</th>
                        <th>Premium</th>
                        <th>Sum Insured</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizedData.map((addressData) => {
                        const sections = Object.keys(addressData.sections);
                        let totalRowCount = 0;
                        
                        sections.forEach(section => {
                          totalRowCount += addressData.sections[section].length;
                        });
                        
                        let rowCounter = 0;
                        
                        return sections.map((section, sectionIndex) => {
                          const components = addressData.sections[section];
                          
                          return components.map((componentData, componentIndex) => {
                            rowCounter++;
                            const isFirstRowOfAddress = rowCounter === 1;
                            const isFirstComponentOfSection = componentIndex === 0;                            
                            return (
                              <tr key={`${addressData.addressIndex}-${section}-${componentData.component}`}>
                                {isFirstRowOfAddress ? (
                                  <td 
                                    className="serial-number-cell" 
                                    rowSpan={totalRowCount}
                                  >
                                    {addressData.addressIndex}
                                  </td>
                                ) : null}
                                
                                {isFirstRowOfAddress ? (
                                  <td 
                                    rowSpan={totalRowCount}
                                  >
                                    {addressData.location}
                                  </td>
                                ) : null}
                                
                                {isFirstComponentOfSection ? (
                                  <td 
                                    className="section-cell"
                                    rowSpan={components.length}
                                  >
                                    {section}
                                  </td>
                                ) : null}
                                
                                <td className="component-cell">{componentData.component}</td>
                                <td className="premium-cell">₹{new Intl.NumberFormat('en-IN').format(Math.floor(componentData.premium - componentData.terror || 0))}</td>
                                <td className="premium-cell">₹{new Intl.NumberFormat('en-IN').format(Math.floor(componentData.premium))}</td>
                                <td className="sum-insured-cell">₹{new Intl.NumberFormat('en-IN').format(componentData.sumInsured)}</td>
                              </tr>
                            );
                          });
                        });
                      })}
                      
                      {/* Summary row with total premium */}
                      {isChecked && (<tr className="total-row">
                        <td colSpan="5" className="total-label">Marine</td>
                        <td className="premium-cell">₹{new Intl.NumberFormat('en-IN').format(marinePre.toFixed(2))}</td>
                        <td className="sum-insured-cell">₹{new Intl.NumberFormat('en-IN').format(totalSumInsured)}</td>
                      </tr>)}
                      <tr className="total-row">
                        <td colSpan="5" className="total-label">Total</td>
                        <td className="premium-cell">₹{new Intl.NumberFormat('en-IN').format(totalPremium.toFixed(2))}</td>
                        <td className="sum-insured-cell">₹{new Intl.NumberFormat('en-IN').format(totalSumInsured)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="preview-popup-footer">
              <button 
                className="close-btn-bottom"
                onClick={() => setShowPremiumBreakup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {showRiskInspectionPopup && title === 'IAR' && (<div className="preview-popup-overlay">
      <div className="preview-popup-content warning-popup">
        <div className="preview-popup-header">
          <h2>Risk Inspection Required</h2>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="preview-popup-body">
          <p>Total Sum Insured exceeds 100 Crore. Has Risk Inspection been completed?</p>
        </div>
        
        <div className="preview-popup-footer">
          <button 
            className="submit-btn"
            onClick={() => onClose()}
          >
            Yes
          </button>
          <button 
            className="close-btn-bottom"
            onClick={() => onClose()}
          >
            No
          </button>
        </div>
      </div>
    </div>)}
    <RetentionBreakdownPopup 
      isOpen={showRetentionPopup} 
      onClose={() => {
        setShowRetentionPopup(false);
      }}
      onContinue={() => {
        setShowRetentionPopup(false);
        continueWithSave();
      }}
      sumInsured={title === "IAR" ? topLocationSI : totalSumInsured}
      productName={title}
    />
    </>
  );
};

export default PreviewPage;