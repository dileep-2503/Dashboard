import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchProduct, fetchPincodeDetails, fetchOccupancy, fetchSection, fetchRiskFactor, saveDraft, updateDraft, fetchEquipments } from '../api/api';
import { savePolicy, saveQuote, updatePolicy, updateQuote, fetchAddon, savePendingQuote } from '../api/api';
import RetentionBreakdownPopup from './RetentionBreakdownPopup';
import '../styles/GeneralDetails.css';
import Popup from './Popup';
import Select from "react-select";
import Handlebars from 'handlebars';

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

const GeneralDetails = ({selectedPackages, user, userSegment}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [mainData, setMainData] = useState([]); 
  const [areaOptions, setAreaOptions] = useState([]);
  const [parsedWorkflows, setParsedWorkflows] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [nonIndustrial, setNonIndustrial] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null); 
  const [componentValues] = useState({});
  let isSubmit = false;
  const [focusedComponent, setFocusedComponent] = useState(null);
  const [showComponentPopup, setShowComponentPopup] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [componentCovers, setComponentCovers] = useState({});
  const [isCopyAddressChecked, setIsCopyAddressChecked] = useState(false);
  const [packageSumInsured, setPackageSumInsured] = useState({});
  const [packageComponentValues, setPackageComponentValues] = useState({});
  const [submittedAddresses, setSubmittedAddresses] = useState([]);
  const [sectionData, setSectionData] = useState({});
  const [maxSumInsuredRules, setMaxSumInsuredRules] = useState(null);
  const [globalCovers, setGlobalCovers] = useState({});
  let errors = [];
  const [occupancyOptions, setOccupancyOptions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [workflow, setWorkflow] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [popupFormData, setPopupFormData] = useState({});
  const [addressFormStep, setAddressFormStep] = useState(0);
  const title = location.state?.title || location.state?.editTitle;
  const [isEditMode, setIsEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [occupancyData, setOccupancyData] = useState([]);
  const [updatedRates, setUpdatedRates] = useState({});
  const [updateSI, setUpdateSI] = useState(0);
  const [updatePre, setUpdatePre] = useState(0);
  const fullSummary = location.state?.item || 0;
  const [isEditing, setIsEditing] = useState(location.state?.isEdit || location.state?.isDraft || false);
  const [productpackages, setProductPackages] = useState([]);
  const [riskFactor, setRiskFactor] = useState([]);
  const step = isEditing ? location.state?.currentStep: 0;
  user = isEditing ? location.state?.user : user;
  const id = location.state?.id || 0;
  const [componentData, setComponentData] = useState({});
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [isRiskFactorExpanded, setIsRiskFactorExpanded] = useState(false);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [isMultiEquipment, setIsMultiEquipment] = useState(false);
  const [actualPackage, setActualPackage] = useState(null);
  const [isFloater, setIsFloater] = useState(false);
  const [activeCovers, setActiveCovers] = useState({});
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [isWaiverRequired, setIsWaiverRequired] = useState(false);
  const [riskInspections, setRiskInspections] = useState([]);
  const [fileError, setFileError] = useState('');
  const [showAddonPopup, setShowAddonPopup] = useState(false);
  const [addonOptions, setAddonOptions] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [addonDetails, setAddonDetails] = useState([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [pendingChange, setPendingChange] = useState(null);
  const [warnedIndexes, setWarnedIndexes] = useState(new Set());
  const [totalAddonPremium, setTotalAddonPremium] = useState(0);
  const [appliedAddons, setAppliedAddons] = useState([]);
  const [additionalRemarks, setAdditionalRemarks] = useState([]);
  const [remarkInput, setRemarkInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPremiumBreakup, setShowPremiumBreakup] = useState(false);
  const [showRetentionPopup, setShowRetentionPopup] = useState(false);
  const [showRiskInspectionPopup, setShowRiskInspectionPopup] = useState(false);
  const [topLocationSI, setTopLocationSI] = useState(0);
  const [deviationMatrix, setDeviationMatrix] = useState(null);
  const [marinePre, setMarinePre] = useState(0);
  const [marineRate, setMarineRate] = useState(0.15);
  const [isChecked, setIsChecked] = useState(false);
  const [terrorism, setTerrorism] = useState(0);
  const [machineryType, setMachineryType] = useState('New Machinery');

  // Add this function before the useEffect
  const getTerrorismPremium = async () => {
    let terrorismPremium = 0;
    
    submittedAddresses.forEach(address => {
      Object.entries(address.sectionCovers || {}).forEach(([section, covers]) => {
        if (!covers || !Array.isArray(covers)) return;
        
        covers.forEach(coverData => {
          if (coverData.cover === 'Terrorism' && coverData.is_active) {
            const sectionSumInsured = address.packageComponentValues?.[section] || {};
            const sumInsured = Object.keys(sectionSumInsured)
              .filter(key => !key.endsWith('_premium') && !key.endsWith('_terror'))
              .reduce((total, key) => total + parseFloat(sectionSumInsured[key] || 0), 0);
            
            const terrorismRate = parseFloat(coverData.rate || 0);
            terrorismPremium += (sumInsured * terrorismRate) / 1000;
          }
        });
      });
    });
    
    return terrorismPremium;
  };

  useEffect(() => {
    const fetchTerrorismPremium = async () => {
      const premium = await getTerrorismPremium();
      setTerrorism(premium);
    };
    
    const highestSumInsured = submittedAddresses.reduce((highest, location) => {
      return location.totalSumInsured > highest ? location.totalSumInsured : highest;
    }, 0);

    setTopLocationSI(highestSumInsured);
    setShowRiskInspectionPopup(highestSumInsured > 1000000000);
    
    fetchTerrorismPremium();
  }, [submittedAddresses]);

  useEffect(() => {
    if (isEditing && fullSummary) {
      if(fullSummary[0].submittedAddress){
        setShowAddressForm(true);
        setAddressFormStep(step);
      }else{
        setCurrentStep(step);
      }

      const summaryData = fullSummary ? fullSummary[0] : fullSummary;
      setFormData({
        'Name': summaryData.name || '',
        'Mobile': summaryData.mobile || '',
        'Is Customer Individual or Corporate': summaryData.individualOrCorporate || '',
        'Gender': summaryData.gender || '',
        'Address Line 1': summaryData.addressLine1 || '',
        'Pincode': summaryData.pincode || '',
        'Area / Village': summaryData.areaVillage || '',
        'District / City': summaryData.districtCity || '',
        'State': summaryData.state || '',
        'PAN Number': summaryData.panNumber || '',
        'Date of Birth': summaryData.dateOfBirth || '',
        'Date of Incorporation': summaryData.dateOfIncorporation || '',
        'Risk Start Date': summaryData.policyPeriod || '',
        'Risk End Date': summaryData.policyEndPeriod || '',
      });

      setPopupFormData({
        'Gender': summaryData.gender || '',
        'Address Line 1': summaryData.addressLine1 || '',
        'Pincode': summaryData.pincode || '',
        'Area / Village': summaryData.areaVillage || '',
        'District / City': summaryData.districtCity || '',
        'State': summaryData.state || '',
        'SelectedNumber': summaryData.selectedNumber,
        'Type Of Construction': summaryData.typeOfConstruction,
        'Occupancy Type': summaryData.occupancyType,
        'Equipment Type': summaryData.equipmentType,
        'Age of the Risk Information': summaryData.ageOfRiskInformation,
        'Height of the Building (in meters)': summaryData.heightOfBuilding,
        'No. of Floors': summaryData.noOfFloors,
        'Equipment Details': summaryData.equipmentDetails,
        'natureOfProject': fullSummary.projectNature || '',
        'natureOfClaim': fullSummary.natureOfClaim || '',
        'yearOfClaim': fullSummary.yearOfClaim || '',
        'valueOfClaim': fullSummary.valueOfClaim || '',
        'postMeasures': fullSummary.postMeasures || '',
        'claimExperience': fullSummary.claimExperience || '',
        'hypothecation': fullSummary.hypothecation || '',
        'loadingDiscount_7': fullSummary.riskFactors || 0,
        'supportingDocuments': fullSummary.supportingDocuments,
        'supportingDocumentsURL': fullSummary.supportingDocumentsURL,

      });


      setMainData(summaryData);
      setIsRiskFactorExpanded(fullSummary.riskExpand || false);
      setIsMultiEquipment(summaryData.multiEquipment || false);
      setIsFloater(summaryData.floater || false);
      setProductPackages(summaryData.selectedpackages || []);
      setSelectedPackage(summaryData.selectedPackage || '');
      setSelectedComponents(summaryData.selectedComponents || []);
      setComponentCovers(summaryData.componentCovers || {});
      setPackageComponentValues(summaryData.packageComponentValues || {});
      setPackageSumInsured(summaryData.packageSumInsured || {});
      setMaxSumInsuredRules(summaryData.maxSumInsuredRules || {});
      setUpdatedRates(summaryData.updatedRates || {});
      setSectionData(summaryData.sections || {});
      if(summaryData.submittedAddress !== undefined) {
        setSubmittedAddresses(summaryData.submittedAddress ? [summaryData] : []);
      }
      else{
        setSubmittedAddresses([summaryData]);
      }
      
    }
  }, [isEditing, fullSummary]);

  const handleEquipmentChange = (selectedOptions) => {
    const optionsArray = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions].filter(Boolean);
    const equipmentPackages = optionsArray.map(option => `${option.label}-${selectedPackages[0]}`);
    setProductPackages(equipmentPackages);
    setPopupFormData(prev => {
      const existingDetails = prev['Equipment Details'] || [];
      
      const detailsMap = {};
      existingDetails.forEach(detail => {
        detailsMap[detail.equipment] = detail;
      });
      
      const newDetails = optionsArray.map((option, index) => {
        const equipmentName = option.label;
        
        if (detailsMap[equipmentName]) {
          return detailsMap[equipmentName];
        }

        
        return {
          equipment: equipmentName,
          make: '',
          model: '',
          serialNo: '',
          yom: ''
        };
      });
      
      return {
        ...prev,
        'Equipment Type': isMultiEquipment ? optionsArray : (optionsArray[0] || null),
        'Equipment Details': newDetails
      };
    });
  };
  

  const handleEquipmentDetailChange = (index, field, value) => {
    setPopupFormData(prev => {
      const equipmentDetails = [...(prev['Equipment Details'] || [])];
      
      if (!equipmentDetails[index]) {
        equipmentDetails[index] = {
          equipment: prev['Equipment Type'][index].label,
          make: '',
          model: '',
          serialNo: '',
          yom: '',
          si: ''
        };
      }
      
      equipmentDetails[index][field] = value;
      
      return {
        ...prev,
        'Equipment Details': equipmentDetails
      };
    });
  };

  const validateYOM = (value) => {
    return /^\d{0,4}$/.test(value);
  };

  const getZoneNumber = (zone) => {
    switch(zone) {
      case 'I': return '1';
      case 'II': return '2';
      case 'III': return '3';
      case 'IV': return '4';
      default: return '1';
    }
  };

  const getZone = (zone) => {
    switch(zone) {
      case 'I': return 'zone1';
      case 'II': return 'zone2';
      case 'III': return 'zone3';
      case 'IV': return 'zone4';
      default: return 'zone1';
    }
  };

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (!allowedTypes.includes(file.type)) {
      setFileError('Invalid file format. Please upload PDF, Word, Excel or Image files.');
      return;
    }

    if (file.size > maxSize) {
      setFileError('File size must be less than 5MB');
      return;
    }

    setFileError('');
    setRiskInspections(prevInspections => {
      const updatedInspections = [...prevInspections];
      updatedInspections[index] = {
        ...updatedInspections[index],
        report: file
      };
      return updatedInspections;
    });
  };

  const getOccupancyRate = (cover, selectedOccupancy, section) => {
    if (!selectedOccupancy) return '0';

    const occupancySectionRate = section.occupancy_rate.split(', ');
    const occupancyMinSectionRate = section.occupancy_min_rate.split(', ');
    switch (cover) {
      case 'Basic':
        return selectedOccupancy[occupancySectionRate[0]] || '0';
      case 'STFI Cover':
        return selectedOccupancy[occupancySectionRate[1]] || '0';
      case 'Earthquake':
        const zone = popupFormData['Zone'] || 'I';
        const zoneNumber = getZoneNumber(zone);
        let totalCoverRate = 1;
        
        const factor = riskFactor
          .filter(factor => {
            const requiredSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
            return factor.section_name.split(', ').some(section => 
              requiredSections.includes(section)
            );
          })
          .find(factor => factor.type === 'Zone');

        if (factor?.type === 'Zone') {
          const zoneValues = JSON.parse(factor.zone);
          const currentZone = getZone(zone);
          totalCoverRate = 1 + (parseFloat(zoneValues[currentZone])/100) || 1;
        }
        let index;
        if(zone === 'II'){
          index = 3;
        }
        else if(zone === 'III'){
          index = 4;
        }
        else if(zone === 'IV'){
          index = 5;
        }
        else {
          index = 2
        }
        return selectedOccupancy[occupancySectionRate[index]] * totalCoverRate || '0';
      case 'Terrorism':
        return selectedOccupancy[occupancySectionRate[6]] || '0';
      default:
        return '0';
    }
  };

  const calculateTotalSumInsured = (pkg) => {
    const componentValues = packageComponentValues[pkg] || {};
    const totalSumInsured = Object.entries(componentValues)
      .filter(([key]) => !key.endsWith('_premium') && !key.endsWith('_terror'))
      .reduce((sum, [_, value]) => sum + (Number(value) || 0), 0);
    setPackageSumInsured((prev) => ({ ...prev, [pkg]: totalSumInsured }));
  };

  const initializeFormData = (workflows) => {
    const initialFormData = {};
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);
    const formattedEndDate = endDate.toISOString().split('T')[0];
  
    workflows.forEach(parsedWorkflow => {
      if (parsedWorkflow.sections) {
        parsedWorkflow.sections.forEach(section => {
          section.fields.forEach(field => {
            if (field.default) {
              initialFormData[field.label] = field.default;
            } else if (field.label === 'Risk Start Date') {
              initialFormData[field.label] = today;
            } else if (field.label === 'Risk End Date') {
              initialFormData[field.label] = formattedEndDate;
            } else {
              initialFormData[field.label] = field.type === 'checkbox' ? false :
                                            field.type === 'number' ? 0 : '';
            }
          });
        });
      }
    });
    
    return initialFormData;
  };
  
  const initializePopupFormData = () => {
    const initialPopupData = {};
    
    parsedWorkflows.forEach(workflow => {
      if (workflow.sections) {
        workflow.sections.forEach(section => {
          section.fields.forEach(field => {
            if (!(field.label in initialPopupData)) {
              initialPopupData[field.label] = field.type === 'checkbox' ? false :
                                             field.type === 'number' ? 0 : '';
            }
          });
        });
      }
    });
    
    return initialPopupData;
  };

  useEffect(() => {
    if (!submittedAddresses.length && location.state?.item) {
      setSubmittedAddresses(location.state.item);
    }
    if(!showAddressForm){
      setCurrentStep(location.state?.currentStep || 0);
    }
    const getProduct = async () => {
      try {
        const productData = await fetchProduct();
        const workflowData = productData.find(item => item.name === title);
        if (workflowData) {
          const workflows = [];
          if (workflowData.workflow1) {
            workflows.push(JSON.parse(workflowData.workflow1).workflow1);
          }
          if (workflowData.workflow2) {
            workflows.push(JSON.parse(workflowData.workflow2).workflow2);
          }
          setParsedWorkflows(workflows);
          setWorkflow(workflows.length + 1);
          if(!isEditing && currentStep === 0){
          setFormData(initializeFormData(workflows));
          }
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    const getOccupancy = async () => {
      try {
        const data = await fetchOccupancy();
        const occupancyOptions = data.map(item => `${item.code}-${item.name}`);
        const occupancyData = data;
        setOccupancyOptions(occupancyOptions);
        setOccupancyData(occupancyData)
      } catch (error) {
        console.error('Error fetching occupancy details:', error);
      }
    };

    const getEquipment = async () => {
      try {
        const data = await fetchEquipments();
        const equipmentOptions = data.map(
          (item) => `${item.code}-${item.name}`
        );
        setEquipmentOptions(equipmentOptions);
        setEquipmentData(data);
      } catch (error) {
        console.error("Error fetching occupancy details:", error);
      }
    };

    const getRiskFactor = async () => {
      try {
        const data = await fetchRiskFactor();
        const filteredRiskFactors = data.filter(riskFactor => 
          riskFactor.product_name === title
        );
        setRiskFactor(filteredRiskFactors);
      } catch (error) {
        console.error('Error fetching Risk Factor details:', error);
      }
    };

    const getSections = async () => {
      try {
        const data = await fetchSection();
        setSections(data);
        const rulesObject = {};
        data.forEach(section => {
          if (section.max_sum_insured_data) {
            try {
              const maxSumInsuredData = JSON.parse(section.max_sum_insured_data);
              rulesObject[section.section_reference_name] = maxSumInsuredData;
            } catch (error) {
              console.error('Error parsing max_sum_insured_data for section:', section.section_reference_name, error);
            }
          }
        });
        setMaxSumInsuredRules(rulesObject);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };

    calculateTotalSumInsured(selectedPackage);
    getOccupancy();
    getProduct();
    getSections();
    getRiskFactor();
    getEquipment();
  }, [componentValues, selectedPackage]);

  useEffect(() => {
    const getSectionComponentData = async () => {
      try {
        const sectionData = await fetchSection();
        const section = sectionData.find(s => s.section_reference_name === selectedPackage);
        
        if (section?.components_data) {
          const parsedData = JSON.parse(section.components_data);
          const dataMap = {};
          parsedData.forEach(comp => {
            dataMap[comp.name] = comp;
          });
          setComponentData(dataMap);
        }
      } catch (error) {
        console.error('Error fetching component data:', error);
      }
    };
  
    if (selectedPackage) {
      getSectionComponentData();
    }
  }, [selectedPackage]);

  const calculateAutoSumInsured = (component, section) => {
    if (!componentData[component]) return 0;
  
    const data = componentData[component];
    if (data.sumInsuredType !== 'Auto') return 0;
  
    // Get all components from the referenced section
    const components = data.sectionComponents.split(',');
    const percentage = parseFloat(data.sumInsuredPercentage) || 0;
  
    // Calculate total sum insured from referenced section components
    const totalSumInsured = components.reduce((sum, comp) => {
      const value = packageComponentValues[data.section]?.[comp] || 0;
      return sum + parseFloat(value);
    }, 0);

    // Calculate auto sum insured based on percentage
    const autoSumInsured = (totalSumInsured * percentage) / 100;
    const covers = componentCovers[component] || [];
    const type = popupFormData["Occupancy Type"] || popupFormData['Equipment Type'];
    const { totalPremium, terrorismPremium } = calculatePremium(
      { [component]: covers },
      type
    );

    // Update packageComponentValues with auto sum insured
    setPackageComponentValues(prevValues => ({
      ...prevValues,
      [section]: {
        ...(prevValues[section] || {}),
        [component]: autoSumInsured,
        [`${component}_premium`]: totalPremium,
        [`${component}_terror`]: terrorismPremium
      }
    }));

    // Update packageSumInsured for this section
    setPackageSumInsured(prevSumInsured => ({
      ...prevSumInsured,
      [section]: Object.entries(packageComponentValues[section] || {})
        .filter(([key]) => !key.endsWith('_premium')&&!key.endsWith('_terror'))
        .reduce((sum, [key, value]) => sum + parseFloat(value || 0), autoSumInsured)
    }));

    return autoSumInsured;
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // Validate Name field to only contain letters
    if (name === 'Name' && !/^[A-Za-z\s]*$/.test(value)) {
      return;
    }
    if (name === 'Floater Policy') {
      setIsFloater(checked);
    }

    // Validate Mobile field to only contain numbers and be exactly 10 digits
    if (name === 'Mobile' && !/^\d{0,10}$/.test(value)) {
      return;
    }

    if(name === 'Pincode' && !/^\d{0,6}$/.test(value)) {
      return;
    }

    // Validate Address fields to only contain letters, numbers, hyphens, slashes, and commas
    if (name.startsWith('Address') && !/^[A-Za-z0-9\s\-\/,]*$/.test(value)) {
      return;
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle dependencies
    if (name === 'Pincode') {
      try {
        const pincodeDetails = await fetchPincodeDetails(value);
        if (pincodeDetails.length > 0) {
          const selectedPincode = pincodeDetails[0];
          const areas = pincodeDetails.map(detail => detail.area);
          setAreaOptions(areas);
          setFormData((prevData) => ({
            ...prevData,
            'District / City': selectedPincode.district,
            'State': selectedPincode.state,
            'Zone': selectedPincode.zone
          }));
        }
        else {
          if(value.length >= 6) {
            alert('Invalid Pincode');
          }
        }
      } catch (error) {
        console.error('Error fetching pincode details:', error);
      }
    }

    // Handle Risk Start Date and Risk End Date
    if (name === 'Risk Start Date') {
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1); // Ensure the end date is exactly one year minus one day
      setFormData((prevData) => ({
        ...prevData,
        'Risk Start Date': value,
        'Risk End Date': endDate.toISOString().split('T')[0]
      }));
    }
  };
  
  const handlePopupChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // Validate Height of the Building (in meters) to only contain numbers and have a maximum of 6 digits
    if (name === 'Height of the Building (in meters)' && !/^\d{0,6}$/.test(value)) {
      return;
    }

    setNonIndustrial(false);

    if((name === "Occupancy Type" && title === "IAR") || (submittedAddresses.length > 1 && title === "IAR")) {
      const industry = occupancyData.find(item => item.code === parseInt(value.split('-')[0]));
      if(industry.risk_category === "Non-industrial"){
        setNonIndustrial(true);
      }
    }

    if(name === 'Multi Equipment') {
      setIsMultiEquipment(checked);
      
      // When toggling multi-equipment, preserve the equipment details
      if (!checked && Array.isArray(popupFormData['Equipment Type'])) {
        // If switching from multi to single, keep the first selection if any
        const firstSelection = popupFormData['Equipment Type'].length > 0 ? 
          popupFormData['Equipment Type'][0] : null;
        
        // Keep the Equipment Type as an array with one item for consistency
        setPopupFormData(prev => ({
          ...prev,
          'Equipment Type': firstSelection ? [firstSelection] : []
        }));
      } else if (checked && !Array.isArray(popupFormData['Equipment Type'])) {
        // If switching from single to multi, convert to array format
        const currentValue = popupFormData['Equipment Type'];
        if (currentValue) {
          const option = equipmentOptions
            .map(label => ({ label, value: label.toLowerCase() }))
            .find(opt => opt.value === currentValue.toLowerCase());
          
          if (option) {
            setPopupFormData(prev => ({
              ...prev,
              'Equipment Type': [option]
            }));
          } else {
            setPopupFormData(prev => ({
              ...prev,
              'Equipment Type': []
            }));
          }
        } else {
          setPopupFormData(prev => ({
            ...prev,
            'Equipment Type': []
          }));
        }
      }
    }    

    // Validate Address fields to only contain letters, numbers, hyphens, slashes, and commas
    if (name.startsWith('Address') && !/^[A-Za-z0-9\s\-\/,]*$/.test(value)) {
      return;
    }

    // Validate Age of the Risk Information to only contain numbers and have a maximum of 3 digits
    if (name === 'Age of the Risk Information' && !/^\d{0,3}$/.test(value)) {
      return;
    }

    if(name === 'Pincode' && !/^\d{0,6}$/.test(value)) {
      return;
    }

    // Validate No. of Floors to only contain numbers and have a maximum of 3 digits
    if (name === 'No. of Floors' && !/^\d{0,3}$/.test(value)) {
      return;
    }

    setPopupFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle dependencies
    if (name === 'Pincode') {
      try {
        const pincodeDetails = await fetchPincodeDetails(value);
        if (pincodeDetails.length > 0) {
          const selectedPincode = pincodeDetails[0];
          const areas = pincodeDetails.map(detail => detail.area);
          setAreaOptions(areas);
          
          if (selectedZone && value.length === 6) {
            const pincodeZone = selectedPincode.zone;
            
            if (selectedZone && pincodeZone && selectedZone !== pincodeZone) {
              alert(`This pincode belongs to Zone ${pincodeZone}, but you have selected Zone ${selectedZone}. Please correct your selection.`);
              
              setPopupFormData(prev => ({ 
                ...prev, 
                'Pincode': '' 
              }));
              return;
            }
          }
          
          setPopupFormData((prevData) => ({
            ...prevData,
            'District / City': selectedPincode.district,
            'State': selectedPincode.state,
            'Zone': selectedPincode.zone
          }));
        }
        else {
          if(value.length >= 6) {
            alert('Invalid Pincode');
          }
        }
      } catch (error) {
        console.error('Error fetching pincode details:', error);
      }
    }
  };

  const handleTableFieldChange = (index, field, value) => {
    setPopupFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    setSubmittedAddresses(addresses => {
      const newAddresses = [...addresses];
      newAddresses[index] = {
        ...newAddresses[index],
        [field]: value
      };
      return newAddresses;
    });
  };

  const validateAddressFields = () => {
    const newErrors = [];
  
    // Get Address Information fields from workflow
    const addressFields = parsedWorkflows[1]?.sections
      .find(section => section.name === "Address Information")
      ?.fields || [];
  
    // Validate only Address Information fields
    addressFields.forEach(field => {
      const value = popupFormData[field.label];
  
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors.push(`${field.label} is required.`);
      } else if (value) {
        // Field-specific validations
        switch (field.label) {
          case 'Address Line 1':
            if (value.length < 6) {
              newErrors.push('Address Line 1 should be at least 6 characters long.');
            }
            break;
          case 'Pincode':
            if (!/^\d{6}$/.test(value)) {
              newErrors.push('Enter a valid 6-digit Pincode.');
            }
            break;
          case 'Area / Village':
            if (!areaOptions.includes(value)) {
              newErrors.push('Please select a valid Area/Village.');
            }
            break;
        }
      }
    });
  
    errors = newErrors;
    return newErrors.length === 0;
  };

  const handleSaveAddress = () => {
    if (validateAddressFields()) {
      // Create new address object with all necessary fields
      const newAddress = {
        addressLine1: popupFormData['Address Line 1'],
        pincode: popupFormData['Pincode'],
        areaVillage: popupFormData['Area / Village'],
        districtCity: popupFormData['District / City'],
        state: popupFormData['State'],
        typeOfConstruction: popupFormData['Type Of Construction'],
        occupancyType: popupFormData['Occupancy Type'],
        equipmentType: popupFormData['Equipment Type'],
        ageOfRiskInformation: popupFormData['Age of the Risk Information'],
        heightOfBuilding: popupFormData['Height of the Building (in meters)'],
        noOfFloors: popupFormData['No. of Floors'],
        equipmentDetails: popupFormData['Equipment Details'],
        locationAddress: selectedZone ? 'Anywhere in India' : '',
        zone: popupFormData['Zone'],
        packageComponentValues: {},
        componentCovers: {},
        premium: 0,
        totalSumInsured: 0,
        sections: {},
        multiEquipment: isMultiEquipment,
        floater: isFloater
      };
  
      if (isEditMode) {
        setSubmittedAddresses(prevAddresses => {
          const updatedAddresses = [...prevAddresses];
          updatedAddresses[editIndex] = {
            ...updatedAddresses[editIndex],
            ...newAddress
          };
          return updatedAddresses;
        });
      } else {
        // Add new address
        setSubmittedAddresses(prevAddresses => [...prevAddresses, newAddress]);
      }
  
      // Reset form and close popup
      setShowAddressPopup(false);
      setIsEditMode(false);
      setEditIndex(null);
  
      // Show the main address form
      setShowAddressForm(true);
      setAddressFormStep(0);
    } else {
      alert(errors.map(error => `• ${error}`).join('\n'));
    }
  };

  const handleAddAddressClick = () => {
    setIsEditing(false);
    setShowAddressForm(true);
    setIsMultiEquipment(false);
    setAddressFormStep(0);
    setPopupFormData(initializePopupFormData());
    setSelectedPackage(null);
    setSelectedComponents([]);
    setComponentCovers({});
    setSectionData({});
    setUpdatePre(0);
    setUpdateSI(0);
    setIsCopyAddressChecked(false);
    setIsMultiEquipment(false);
    setPackageComponentValues({});
    setPackageSumInsured({});
    setUpdatedRates({});
    setIsEditMode(false);
    setEditIndex(null);
  };

  const handleEditAddressClick = (index) => {
    const addressToEdit = submittedAddresses[index];
    setSectionData(addressToEdit.sections || {});
    setPopupFormData({
      'Address Line 1': addressToEdit.addressLine1,
      'Pincode': addressToEdit.pincode,
      'Area / Village': addressToEdit.areaVillage,
      'District / City': addressToEdit.districtCity,
      'State': addressToEdit.state,
      'Type Of Construction': addressToEdit.typeOfConstruction,
      'Occupancy Type': addressToEdit.occupancyType,
      'Equipment Type': addressToEdit.equipmentType,
      'Age of the Risk Information': addressToEdit.ageOfRiskInformation,
      'Height of the Building (in meters)': addressToEdit.heightOfBuilding,
      'No. of Floors': addressToEdit.noOfFloors,
      'Equipment Details': addressToEdit.equipmentDetails,
      'SelectedNumber': addressToEdit.selectedNumber
    });
    setIsMultiEquipment(addressToEdit.multiEquipment);
    setIsFloater(addressToEdit.floater);
    setSelectedPackage(addressToEdit.selectedPackage);
    setSelectedComponents(addressToEdit.selectedComponents);
    setComponentCovers(addressToEdit.componentCovers);
    setPackageComponentValues(addressToEdit.packageComponentValues);
    setPackageSumInsured(addressToEdit.packageSumInsured); // Set the sum insured for each section
    setUpdatedRates(addressToEdit.updatedRates || {}); // Set the updated rates
    setShowAddressForm(true);
    setAddressFormStep(0);
    setIsEditMode(true);
    setEditIndex(index);
  };

  const handleCopyAddressChange = async(e) => {
    const { checked } = e.target;
    const pincodeDetails = await fetchPincodeDetails(mainData.pincode);
    setIsCopyAddressChecked(checked);
    const selectedPincode = pincodeDetails[0];
    if (checked) {
      setPopupFormData({
        'Address Line 1': mainData.addressLine1,
        'Pincode': mainData.pincode,
        'Area / Village': mainData.areaVillage,
        'District / City': mainData.districtCity,
        'State': mainData.state,
        'Zone': selectedPincode.zone
      });
    } else {
      setPopupFormData({
        'Address Line 1': '',
        'Pincode': '',
        'Area / Village': '',
        'District / City': '',
        'State': ''
      });
    }
  };

  const getMinRiskStartDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 15);
    return minDate.toISOString().split('T')[0];
  };

  const getMaxRiskStartDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  const getMaxDateOfBirth = () => {
    const today = new Date();
    const maxDate = new Date(today.setFullYear(today.getFullYear() - 18));
    return maxDate.toISOString().split('T')[0];
  };

  const validatePopupFields = () => {
    const newErrors = [];

    if ('Address Line 1' in popupFormData) {
      if (!popupFormData['Address Line 1'] || popupFormData['Address Line 1'].length < 6) {
        newErrors.push('Address Line 1 should be at least 6 characters long.');
      }
    }

    if(nonIndustrial){
      newErrors.push('Select Industrial Occupancy');
    }

    const workflowFields = {};
    parsedWorkflows.forEach(workflow => {
      if (workflow.sections) {
        workflow.sections.forEach(section => {
          section.fields.forEach(field => {
            workflowFields[field.label] = field;
          });
        });
      }
    });
    
    // Fields required for address based on current workflow
    let requiredAddressFields = [];
    // Validate required address fields that are visible in current workflow
    requiredAddressFields.forEach(fieldName => {
      // Only validate if the field is visible in current workflow or is a basic field
      const isBasicField = ['Address Line 1', 'Pincode', 'Area / Village', 'District / City', 'State'].includes(fieldName);
      if ((fieldName in popupFormData) && (isBasicField || fieldName)) {
        if (!popupFormData[fieldName] || popupFormData[fieldName].toString().trim() === '') {
          newErrors.push(`${fieldName} is required.`);
        } else {
          // Field-specific validations
          switch (fieldName) {
            case 'Address Line 1':
              if (popupFormData[fieldName].length < 6) {
                newErrors.push('Address Line 1 should be at least 6 characters long.');
              }
              break;
            case 'Pincode':
              if (!/^\d{6}$/.test(popupFormData[fieldName])) {
                newErrors.push('Enter a valid Pincode.');
              }
              break;
            case 'Age of the Risk Information':
              if (isNaN(popupFormData[fieldName]) || popupFormData[fieldName] <= 0) {
                newErrors.push('Age of the Risk Information must be a positive number.');
              }
              break;
            // Add other field-specific validations as needed
          }
        }
      }
    });

    const currentWorkflowFields = {};
    if (parsedWorkflows[currentStep]?.sections) {
      parsedWorkflows[currentStep].sections.forEach(section => {
        section.fields.forEach(field => {
          currentWorkflowFields[field.label] = field;
        });
      });
    }
    
    // Additional validations from workflow fields - only validate fields in current workflow
    Object.entries(currentWorkflowFields).forEach(([fieldName, fieldConfig]) => {
      // Skip fields already validated above and only check fields visible in current workflow
      if (!requiredAddressFields.includes(fieldName) && 
          fieldConfig.required && 
          fieldName) {
        
        const value = popupFormData[fieldName];
        
        if (value === undefined || value === null || value.toString().trim() === '') {
          newErrors.push(`${fieldName} is required.`);
        } else {
          // Type-specific validations
          switch (fieldConfig.type) {
            case 'number':
              if (isNaN(value)) {
                newErrors.push(`${fieldName} must be a number.`);
              }
              break;
            case 'dropdown':
              if (value === '') {
                newErrors.push(`Please select ${fieldName}.`);
              }
              break;
          }
        }
      }
    });
  
    errors = newErrors;
    return newErrors.length === 0;
  };
  
  const validateFields = () => {
    const newErrors = [];
    // Get all fields from workflow to know what we should validate
    const workflowFields = {};
    parsedWorkflows.forEach(workflow => {
      if (workflow.sections) {
        workflow.sections.forEach(section => {
          section.fields.forEach(field => {
            workflowFields[field.label] = field;
          });
        });
      }
    });
    
    // Common field validations
    if ('Name' in formData) {
      if (!/^[A-Za-z ]{3,}$/.test(formData['Name'])) {
        newErrors.push('Name should have at least three characters and only letters and spaces.');
      }
    }
  
    if ('Mobile' in formData) {
      if (!/^\d{10}$/.test(formData['Mobile'])) {
        newErrors.push('Mobile should have exactly 10 digits.');
      }
    }
  
    if ('Pincode' in formData) {
      if (!/^\d{6}$/.test(formData['Pincode'])) {
        newErrors.push('Enter a valid Pincode.');
      }
    }
    
    if ('PAN Number' in formData) {
      if (!formData['PAN Number']) {
        newErrors.push('PAN Number is required.');
      } else if (!/^[A-Za-z0-9]*$/.test(formData['PAN Number'])) {
        newErrors.push('PAN Number should only contain letters and numbers.');
      }
    }
  
    if ('Address Line 1' in formData) {
      if (!formData['Address Line 1'] || formData['Address Line 1'].length < 6) {
        newErrors.push('Address Line 1 should be at least 6 characters long.');
      }
    }
  
    // Check if either Date of Birth or Date of Incorporation is provided (if visible)
    const dobVisible = 'Date of Birth';
    const doiVisible = 'Date of Incorporation';
    
    if ((dobVisible || doiVisible) && 
        (!formData['Date of Birth'] && !formData['Date of Incorporation'])) {
      newErrors.push('Either Date of Birth or Date of Incorporation must be filled.');
    }

    const currentWorkflowFields = {};
    if (parsedWorkflows[currentStep]?.sections) {
      parsedWorkflows[currentStep].sections.forEach(section => {
        section.fields.forEach(field => {
          currentWorkflowFields[field.label] = field;
        });
      });
    }
  
    // Validate all workflow fields that are visible in current workflow
    Object.entries(currentWorkflowFields).forEach(([fieldName, fieldConfig]) => {
      // Skip fields already validated above
      const alreadyValidated = ['Name', 'Mobile', 'Pincode', 'PAN Number', 'Address Line 1', 
                                'Date of Birth', 'Date of Incorporation'];
      
      if (!alreadyValidated.includes(fieldName) && 
          fieldConfig.required && 
          fieldName) {
        
        // Check if the field exists in formData
        if (fieldName in formData) {
          const value = formData[fieldName];
          
          // Check if value is empty
          if (value === undefined || value === null || value.toString().trim() === '') {
            newErrors.push(`${fieldName} is required.`);
          } else {
            // Type-specific validations
            switch (fieldConfig.type) {
              case 'number':
                if (isNaN(value)) {
                  newErrors.push(`${fieldName} must be a number.`);
                }
                break;
              case 'date':
                if (!isValidDate(value)) {
                  newErrors.push(`${fieldName} must be a valid date.`);
                }
                break;
              case 'dropdown':
                if (value === '') {
                  newErrors.push(`Please select ${fieldName}.`);
                }
                break;
            }
          }
        }
      }
    });
    errors = newErrors;
    return newErrors.length === 0;
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const validateSectionAccess = (pkg) => {
    const sectionRules = maxSumInsuredRules[pkg];
    if (!sectionRules) return true;
  
    if (sectionRules.type === 'Section Based' && sectionRules.section) {
      // Check both submittedAddresses and current packageSumInsured
      const referencedSectionSumInsured = packageSumInsured[sectionRules.section] || 0;
      
      // Check if the required section has a sum insured value
      if (referencedSectionSumInsured <= 0) {
        return false;
      }
    }
    return true;
  };

  const handlePackageClick = (pkg) => {
    if (!validateSectionAccess(pkg)) {
      alert(`You need to add sum insured for ${maxSumInsuredRules.section} first.`);
      return;
    }
    if(isMultiEquipment){
      const pack = "Contractor's Plant and Machinery";
      setSelectedPackage(pack);
      setActualPackage(pkg);
    }
    else{
      setSelectedPackage(pkg);
    }
    const firstComponent = sections
      .find(section => section.section_reference_name === pkg)
      ?.components.split(', ')[0];
    setFocusedComponent(firstComponent);
    setAddressFormStep(2);
  };

  const initializeComponentCovers = () => {
    const initialCovers = {};
    sections.forEach((section) => {
      if (section.section_reference_name === selectedPackage) {
        section.components.split(', ').forEach((component) => {
          initialCovers[component] = section.covers.split(', ');
        });
      }
    });
    setComponentCovers(prevComponentCovers => {
      return { ...prevComponentCovers, ...initialCovers };
    });
  };
  

  const handleComponentValueChange = (pkg, component, value, equipment) => {
    const sect = isMultiEquipment ? equipment : pkg;

    initializeComponentCovers();

    setPackageComponentValues((prevValues) => {
      const newValues = { ...prevValues };
      if (!newValues[sect]) newValues[sect] = {};
      newValues[sect][component] = value;

      setSubmittedAddresses(prevAddresses => {
        return prevAddresses.map(address => {
          if (!address.packageComponentValues) address.packageComponentValues = {};
          if (!address.packageComponentValues[sect]) address.packageComponentValues[sect] = {};

          const updatedComponentValues = {
            ...address.packageComponentValues[sect],
            [component]: value
          };

          // Calculate premium for current section/component
          const covers = componentCovers[component] || [];
          const activeCovers = covers.filter(cover => {
            const section = sections.find(s => s.section_reference_name === selectedPackage);
            const isMandatory = section?.mandatory_cover?.split(', ').includes(cover);
            const isGloballyActive = globalCovers[cover];
            return isMandatory || isGloballyActive;
          });

          const type = popupFormData["Occupancy Type"] || popupFormData['Equipment Type'];
          const { totalPremium: componentPremium, terrorismPremium: componentTerror } = calculatePremium(
            { [component]: activeCovers },
            type
          );

          updatedComponentValues[`${component}_premium`] = componentPremium;
          updatedComponentValues[`${component}_terror`] = componentTerror;

          // Calculate total premium across all sections
          let totalAddressPremium = 0;
          Object.keys(address.packageComponentValues).forEach(sectionName => {
            Object.entries(address.packageComponentValues[sectionName] || {}).forEach(([key, value]) => {
              if (key.endsWith('_premium')) {
                // Add premium from other sections
                if (sectionName !== sect) {
                  totalAddressPremium += Number(value) || 0;
                }
              }
            });
          });

          // Add premiums from current section
          Object.entries(updatedComponentValues).forEach(([key, value]) => {
            if (key.endsWith('_premium')) {
              totalAddressPremium += Number(value) || 0;
            }
          });

          return {
            ...address,
            packageComponentValues: {
              ...address.packageComponentValues,
              [sect]: updatedComponentValues
            },
            premium: totalAddressPremium // Set total premium from all sections
          };
        });
      });

      calculateTotalSumInsured(sect);
      return newValues;
    });
  };

  const handleComponentSelectionChange = (component) => {
    setSelectedComponents((prevSelected) => {
      if (prevSelected.includes(component)) {
        return prevSelected.filter((item) => item !== component);
      } else {
        return [...prevSelected, component];
      }
    });
  };

  const handleCoverChange = (component, cover, checked) => {
    // Update global covers state
    setGlobalCovers(prev => ({
      ...prev,
      [cover]: checked
    }));

    setSubmittedAddresses(prevAddresses =>
      prevAddresses.map(address => {
        const newComponentCovers = { ...address.componentCovers };
        const newSectionCovers = { ...address.sectionCovers };
        const section = sections.find(s => s.section_reference_name === selectedPackage);
        const sectionComponents = section?.components.split(', ') || [];
        // Update component covers
        Object.keys(newComponentCovers).forEach(comp => {
          if (checked) {
            if (!newComponentCovers[comp].includes(cover)) {
              newComponentCovers[comp] = [...newComponentCovers[comp], cover];
            }
          } else {
            newComponentCovers[comp] = newComponentCovers[comp].filter(c => c !== cover);
          }
        });

        // Update section covers
        if (section && newSectionCovers[selectedPackage]) {
          if (checked) {
            // Add cover if not present
            if (!newSectionCovers[selectedPackage].some(c => c.cover === cover)) {
              let rate = '0';
              // Get rate based on cover type (reuse your existing rate calculation logic)
              if (section.rate_type === 'direct') {
                rate = section.direct_rate.split(', ')
                  .find(r => r.startsWith(`${cover}-`))?.split('-')[1] || '0';
              } else if (section.rate_type === 'occupancy' || section.rate_type === 'equipments') {
                const type = address.occupancyType || address.equipmentType;
                const selectedOccupancy = occupancyData.find(
                  occ => occ.code == type?.split('-')[0]
                );
                const selectedEquipment = equipmentData.find(
                  eq => eq.code == type?.split('-')[0]
                );

                switch (cover) {
                  case 'Basic':
                    rate = selectedOccupancy?.IIB_basic || selectedEquipment?.basic || '0';
                    break;
                  case 'STFI Cover':
                    rate = selectedOccupancy?.IIB_stfi || selectedEquipment?.stfi || '0';
                    break;
                  case 'Earthquake':
                    const zone = address.zone || 'I';
                    const zoneNumber = getZoneNumber(zone);
                    rate = selectedOccupancy?.[`IIB_eq${zoneNumber}`] || 
                          selectedEquipment?.[`eq${zoneNumber}`] || '0';
                    break;
                  case 'Terrorism':
                    rate = selectedOccupancy?.IIB_terrorism || 
                          selectedEquipment?.terrorism || '0';
                    break;
                  default:
                    rate = '0';
                }
              }

              newSectionCovers[selectedPackage].push({
                cover: cover,
                rate: rate,
                is_active: true
              });
            }
          } else {
            // Remove cover if present
            newSectionCovers[selectedPackage] = newSectionCovers[selectedPackage]
              .filter(c => c.cover !== cover);
          }
        }

        const newPackageComponentValues = {
          ...address.packageComponentValues,
          [selectedPackage]: { ...address.packageComponentValues[selectedPackage] }
        };

        let totalSectionPremium = 0;
        let totalTerrorismPremium = 0;

        sectionComponents.forEach(comp => {
          const componentValue = address.packageComponentValues[selectedPackage]?.[comp] || 0;
          const type = address["Occupancy Type"] || address.equipmentType;
          const { totalPremium: componentPremium, terrorismPremium: componentTerror } = calculatePremium(
            { [comp]: newComponentCovers[selectedPackage] },
            type
          );

          newPackageComponentValues[selectedPackage][`${comp}_premium`] = componentPremium;
          newPackageComponentValues[selectedPackage][`${comp}_terror`] = componentTerror;

          totalSectionPremium += componentPremium;
          totalTerrorismPremium += componentTerror;
        });

        let overallPremium = 0;
        let overallTerrorism = 0;

        Object.keys(address.packageComponentValues || {}).forEach(sectionName => {
          if (sectionName !== selectedPackage) {
            // Add premiums from other sections
            Object.entries(address.packageComponentValues[sectionName] || {}).forEach(([key, value]) => {
              if (key.endsWith('_premium')) {
                overallPremium += Number(value) || 0;
              }
              if (key.endsWith('_terror')) {
                overallTerrorism += Number(value) || 0;
              }
            });
          }
        });

        overallPremium += totalSectionPremium;
        overallTerrorism += totalTerrorismPremium;

        return {
          ...address,
          componentCovers: newComponentCovers,
          sectionCovers: newSectionCovers,
          packageComponentValues: newPackageComponentValues,
          premium: overallPremium,
          terrorismPremium: overallTerrorism
        };
      })
    );

    // Update active covers status for all addresses
    setActiveCovers(prevActiveCovers => {
      const newActiveCovers = { ...prevActiveCovers };
      const pkgs = isEditing || isMultiEquipment ? productpackages : selectedPackages;
      pkgs.forEach(pkg => {
        if (!newActiveCovers[pkg]) newActiveCovers[pkg] = {};
        newActiveCovers[pkg][cover] = checked ? "active" : "inactive";
      });
      return newActiveCovers;
    });

    // Update all addresses' component covers
    setSubmittedAddresses(prevAddresses =>
      prevAddresses.map(address => {
        const newComponentCovers = { ...address.componentCovers };
        Object.keys(newComponentCovers).forEach(comp => {
          if (checked) {
            if (!newComponentCovers[comp].includes(cover)) {
              newComponentCovers[comp] = [...newComponentCovers[comp], cover];
            }
          } else {
            newComponentCovers[comp] = newComponentCovers[comp].filter(c => c !== cover);
          }
        });
        return {
          ...address,
          componentCovers: newComponentCovers
        };
      })
    );

    // Update global componentCovers
    setComponentCovers(prevCovers => {
      const allCovers = { ...prevCovers };
      Object.keys(allCovers).forEach(comp => {
        if (checked) {
          if (!allCovers[comp].includes(cover)) {
            allCovers[comp] = [...allCovers[comp], cover];
          }
        } else {
          allCovers[comp] = allCovers[comp].filter(c => c !== cover);
        }
      });
      return allCovers;
    });

    // Recalculate premiums
    const type = popupFormData["Occupancy Type"] || popupFormData['Equipment Type'];
    submittedAddresses.forEach(address => {
      Object.keys(address.componentCovers).forEach(comp => {
        const { totalPremium, terrorismPremium } = calculatePremium(
          { [comp]: address.componentCovers[comp] },
          type
        );
        
        setPackageComponentValues(prev => ({
          ...prev,
          [address.selectedPackage]: {
            ...(prev[address.selectedPackage] || {}),
            [`${comp}_premium`]: totalPremium,
            [`${comp}_terror`]: terrorismPremium
          }
        }));
      });
    });
  };

  const calculatePremium = (covers, occupan) => {
    let totalPremium = 0;
    let terrorismPremium = 0;
    const selectedOccupancyCode = isMultiEquipment ? actualPackage.split("-")[0] : occupan.split("-")[0];
    const selectedOccupancy = isMultiEquipment ? undefined : occupancyData.find(occupancy => occupancy.code == selectedOccupancyCode);
    const selectedEquipmentCode = isMultiEquipment ? actualPackage.split("-")[0] : occupan.split("-")[0];
    const selectedEquipment = equipmentData.find(equipment => equipment.code == selectedEquipmentCode);
    const section = sections.find(section => section.section_reference_name === selectedPackage);
    const coverRateTypes = JSON.parse(section.cover_rate_types || '[]');
    
    const factor = riskFactor
    .filter(factor => {
      const requiredSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
      return factor.section_name.split(', ').some(section => 
        requiredSections.includes(section)
      );
    })
    .find(factor => factor.type === 'Zone');

    const factortype = factor ? factor.type : '';
  
    Object.keys(covers).forEach((component) => {
      if (section.components.split(', ').includes(component)) {
        covers[component].forEach((cover) => {
          const value = packageComponentValues[isMultiEquipment ? actualPackage : selectedPackage]?.[component] || 0;
          let coverRate = updatedRates[`${component}-${cover}`] || 0;

          const autoRateCover = coverRateTypes.find(rt => rt.cover === cover && rt.rateType === 'Auto');

          if (autoRateCover) {
            const componentRates = autoRateCover.coverComponents.map(compCover => {
              if (compCover === 'Basic' || compCover === 'STFI Cover' || compCover === 'Earthquake' || compCover === 'Terrorism') {
                switch (compCover) {
                  case 'Basic':
                    return selectedOccupancy?selectedOccupancy.IIB_basic : selectedEquipment.basic || 0;
                  case 'STFI Cover':
                    return (
                      selectedOccupancy?selectedOccupancy.IIB_stfi : selectedEquipment.stfi || 0
                    );
                  case 'Earthquake':
                    const zone = popupFormData['Zone'] || 'I';
                    const zoneNumber = getZoneNumber(zone);
                    return selectedOccupancy?selectedOccupancy[`IIB_eq${zoneNumber}`] : selectedEquipment[`eq${zoneNumber}`] || 0;
                  case 'Terrorism':
                    return (
                      selectedOccupancy?selectedOccupancy.IIB_terrorism :
                      selectedEquipment.terrorism ||
                      0
                    );
                  default:
                    return 0;
                }
              } else {
                return section.direct_rate.split(', ')
                  .find(rate => rate.startsWith(`${compCover}-`))?.split('-')[1] || 0;
              }
            });
            
            // Sum up all component rates
            coverRate = componentRates.reduce((sum, rate) => sum + parseFloat(rate), 0);
          }
          else if (!coverRate) {
            if (
              section.rate_type === "occupancy" ||
              section.rate_type === "equipments"
            ) {
              switch (cover) {
                case "STFI Cover":
                  coverRate =
                    selectedOccupancy?selectedOccupancy.IIB_stfi: selectedEquipment.stfi || 0;
                  break;
                case "Earthquake":
                  const zone = popupFormData["Zone"] || "I";
                  const zoneNumber = getZoneNumber(zone);
                  let totalCoverRate = 0;
                  if (factortype === "Zone") {
                    const zoneValues = JSON.parse(factor.zone);
                    const currentZone = getZone(zone);
                    totalCoverRate =
                      parseFloat(zoneValues[currentZone]) / 100 || 1;
                  }
                  const type = selectedOccupancy
                    ? selectedOccupancy[`IIB_eq${zoneNumber}`]
                    : selectedEquipment[`eq${zoneNumber}`];
                  coverRate = type 
                  break;
                case "Basic":
                  coverRate =
                    selectedOccupancy?selectedOccupancy.IIB_basic : selectedEquipment.basic || 0;
                  break;
                case "Terrorism":
                  coverRate =
                    selectedOccupancy?selectedOccupancy.IIB_terrorism :
                    selectedEquipment.terrorism ||
                    0;
                  break;
                default:
                  coverRate = 0;
              }
            } else if (section.rate_type === "direct") {
              coverRate =
                section.direct_rate
                  .split(", ")
                  .find((rate) => rate.startsWith(`${cover}-`))
                  ?.split("-")[1] || 0;
            }
          }
  
          // Apply loading/discount percentage if exists for this cover
          const riskFactors = riskFactor.filter(rf => 
            rf.apply_to.split(', ').includes(cover) && 
            rf.section_name.split(', ').includes(selectedPackage) &&
            popupFormData[`loadingDiscount_${rf.risk_factor_id}`]
          );

          let loadingDiscount = 0;
          riskFactors.forEach(rf => {
            const loadingValue = parseFloat(popupFormData[`loadingDiscount_${rf.risk_factor_id}`]);
            
            if (!isNaN(loadingValue)) {
              // Convert percentage to multiplier (e.g., 10% -> 1.1, -10% -> 0.9)
              const multiplier = (loadingValue / 100);
              loadingDiscount += multiplier;
            }
          });

          coverRate = coverRate * (1+loadingDiscount);

          const premium = (value * coverRate) / 1000;

          if (cover === 'Terrorism') {
            terrorismPremium += premium;
          } 
          totalPremium += premium;
        });
      }
    });
  
    return {totalPremium, terrorismPremium};
  };

  const calculatePolicyRiskFactors = (sectionPremium, sectionName, address) => {
    const policyRiskFactors = riskFactor.filter(factor => {
      const extractBaseSectionName = (fullSectionName) => {
        const parts = fullSectionName.split('-');
        return parts[parts.length - 1].trim();
      };
      
      // Check if this factor applies to the current section
      return factor.factor_type === 'Policy' && 
             factor.section_name.split(', ').some(section => 
               extractBaseSectionName(section) === extractBaseSectionName(sectionName)
             );
    });
    
    let finalPremium = sectionPremium;
    
    policyRiskFactors.forEach(factor => {
      const loadingValue = popupFormData[`loadingDiscount_${factor.risk_factor_id}`];
      if (loadingValue) {
        const percentage = parseFloat(loadingValue) / 100;
        
        if (factor.calculation_type === 'Add') {
          // Apply add calculation only for this section
          const covers = address.sectionCovers[sectionName] || [];
          const matchingCovers = covers.filter(cover => 
            cover.is_active && cover.cover === factor.apply_to
          );
          
          let additionalPremium = 0;
          matchingCovers.forEach(cover => {
            const sumInsured = address.packageSumInsured[sectionName] || 0;
            const coverPremium = sumInsured * (cover.rate / 1000);
            additionalPremium += coverPremium * percentage;
          });
          
          finalPremium += additionalPremium;
        } else if (factor.calculation_type === 'Multiply') {
          finalPremium = finalPremium * (1 + percentage); // Apply percentage correctly
        }
      }
    });
    
    return finalPremium;
  };
  
  const handleNext = () => {
    const isValid = true;
    if (formData['hasCoInsurance']) {
      if (!validateLeaderCount(formData['coinsurers'])) {
        alert('Only one leader is allowed in co-insurance');
        return;
      }
      
      if (!validateCoInsuranceShare(formData['coinsurers'])) {
        alert('Total co-insurance share cannot exceed 100%');
        return;
      }
    }

    if (isValid) {
      const newFormData = {
        name: formData['Name'],
        mobile: formData['Mobile'],
        addressLine1: formData['Address Line 1'],
        areaVillage: formData['Area / Village'],
        districtCity: formData['District / City'],
        state: formData['State'],
        floaterPolicy: formData['Floater Policy'],
        pincode: formData['Pincode'],
        panNumber: formData['PAN Number'],
        dateOfBirth: formData['Date of Birth'],
        dateOfIncorporation: formData['Date of Incorporation'],
        riskStartDate: formData['Risk Start Date'],
        riskEndDate: formData['Risk End Date'],
        individualOrCorporate: formData['Is Customer Individual or Corporate'],
        maleOrFemale: formData['Gender'],
      };
    
      setMainData(newFormData);

      if(currentStep === 1 && submittedAddresses.length === 0) {
        alert("Please add the Risk Address");
        return;
      }

      // Initialize sectionCovers for each address
      const updatedAddresses = submittedAddresses.map(address => {
        let sectionCovers = {};
        
        // Get all sections for this address
        const allSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
        
        // Process each section
        allSections.forEach(sectionName => {
          const name = isMultiEquipment ? sectionName.split('-').pop() : sectionName;
          const section = sections.find(section => section.section_reference_name === name);
          const sectionCode = isMultiEquipment ? sectionName.split('-')[0] : address.equipmentType?.split("-")[0];
          sectionCovers[sectionName] = [];

          if (section) {
            const selectedOccupancy = occupancyData.find(
              occupancy => occupancy.code == address.occupancyType?.split('-')[0]
            );

            const selectedEquipment = equipmentData.find(
              (Equipment) => Equipment.code == sectionCode
            );

            // Get all covers for the section
            const allCovers = section.covers.split(', ');
            
            // Process each cover
            allCovers.forEach(cover => {
              let rate = '0';
              const coverRateTypes = JSON.parse(section.cover_rate_types || '[]');
              const autoRateCover = coverRateTypes.find(rt => rt.cover === cover && rt.rateType === 'Auto');

              if (autoRateCover) {
                // Calculate auto rate
                const componentRates = autoRateCover.coverComponents.map(compCover => {
                  if (compCover === 'Basic' || compCover === 'STFI Cover' || compCover === 'Earthquake' || compCover === 'Terrorism') {
                    switch (compCover) {
                      case 'Basic':
                        return selectedOccupancy?.IIB_basic || selectedEquipment?.basic || 0;
                      case 'STFI Cover':
                        return selectedOccupancy?.IIB_stfi || selectedEquipment?.stfi || 0;
                      case 'Earthquake':
                        const zone = address.zone || 'I';
                        const zoneNumber = getZoneNumber(zone);
                        return selectedOccupancy?.[`IIB_eq${zoneNumber}`] || selectedEquipment?.[`eq${zoneNumber}`] || 0;
                      case 'Terrorism':
                        return selectedOccupancy?.IIB_terrorism || selectedEquipment?.terrorism || 0;
                      default:
                        return 0;
                    }
                  } else {
                    return parseFloat(section.direct_rate.split(', ')
                      .find(rate => rate.startsWith(`${compCover}-`))?.split('-')[1] || 0);
                  }
                });
                rate = componentRates.reduce((sum, rate) => sum + rate, 0).toString();
              } else {
                // Get manual rate
                if (section.rate_type === 'direct') {
                  rate = section.direct_rate.split(', ')
                    .find(r => r.startsWith(`${cover}-`))?.split('-')[1] || '0';
                } else if (section.rate_type === "occupancy" || section.rate_type === "equipments") {
                  rate = getOccupancyRate(cover, selectedOccupancy ? selectedOccupancy : selectedEquipment, section);
                }
              }

              const isActiveForComponent = address.componentCovers[section.components.split(', ')[0]]?.includes(cover) || false;

              if (isActiveForComponent) {
                sectionCovers[sectionName].push({
                  cover: cover,
                  rate: rate,
                  is_active: isActiveForComponent
                });
              }
            });
          }
        });

        return {
          ...address,
          sectionCovers: sectionCovers
        };
      });

      // Update submittedAddresses with new sectionCovers
      setSubmittedAddresses(updatedAddresses);
      debugger;

      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      alert(errors.map(error => `• ${error}`).join('\n'));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    const isValid = true;
    if (isValid) {
      setCurrentStep(stepIndex);
    } else {
      alert(errors.map(error => `• ${error}`).join('\n'));
    }
  };

  const validateSectionSumInsured = () => {
    // Check if all selected components have sum insured values
    if(isSubmit){
      const requiredSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
    
      // Check if each section has a sum insured value
      requiredSections[0] = title === 'SFSP' ? requiredSections[0] = 'SFSP-FIRE': requiredSections[0];
      const hasAllSectionValues = requiredSections.every(section => {
        const sectionSumInsured = packageSumInsured[section] || 0;
        return sectionSumInsured > 0;
      });

      if (!hasAllSectionValues) {
        alert('Please enter sum insured values for all sections');
        return false;
      }
    }
  
    // Check percentage limits
    const sectionRules = maxSumInsuredRules[selectedPackage];
    if (sectionRules?.type === 'Section Based' && sectionRules.section) {
      const referencedSectionSumInsured = packageSumInsured[sectionRules.section] || 0;
      const componentValues = packageComponentValues[selectedPackage] || {};
      const currentSumInsured = Object.entries(componentValues)
        .filter(([key]) => !key.endsWith('_premium')&&!key.endsWith('_terror'))
        .reduce((total, [_, value]) => total + (Number(value) || 0), 0);
      
      if (sectionRules.sumInsuredPercentage) {
        const maxAllowed = (referencedSectionSumInsured * parseFloat(sectionRules.sumInsuredPercentage)) / 100;

        if (currentSumInsured > maxAllowed) {
          alert(`Sum insured cannot exceed ${sectionRules.sumInsuredPercentage}% of ${sectionRules.section}`);
          return false;
        }
      }
    }
    else if(sectionRules?.type === 'Direct'){
      const componentValues = packageComponentValues[selectedPackage] || {};
      const currentSumInsured = Object.entries(componentValues)
        .filter(([key]) => !key.endsWith('_premium')&&!key.endsWith('_terror'))
        .reduce((total, [_, value]) => total + (Number(value) || 0), 0);
      if (sectionRules.sumInsuredValue) {
        if (currentSumInsured > sectionRules.sumInsuredValue) {
          alert(`Sum insured cannot exceed ${sectionRules.sumInsuredValue} Limit`);
          return false;
        }
      }
    }
  
    return true;
  };

  const validateRiskFactors = () => {
    // Get risk factors for all selected packages instead of just current section
    const selectedSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
    const applicableRiskFactors = riskFactor.filter(factor => 
      factor.section_name.split(', ').some(section => selectedSections.includes(section)) &&
      factor.factor_type === 'Location'
    );
  
    // If no risk factors, validation passes
    if (applicableRiskFactors.length === 0) return true;
  
    let isValid = true;
    const errors = [];
  
    applicableRiskFactors.forEach(factor => {
      // Skip Zone type factors as they are auto-populated
      if (factor.type === 'Zone') return;
  
      // For Direct and List type factors
      if (factor.type !== 'Free Entry' && (factor.type === 'Direct' || factor.list)) {
        const selectedValue = popupFormData[`riskFactorList_${factor.risk_factor_id}`];
        if (!selectedValue) {
          errors.push(`Please select a value for ${factor.risk_factor_name}`);
          isValid = false;
        }
  
        // Check if loading/discount value is required
        const loadingValue = popupFormData[`loadingDiscount_${factor.risk_factor_id}`];
        
        if (factor.type !== 'Direct' && (loadingValue === undefined || loadingValue === '')) {
          errors.push(`Please enter loading/discount value for ${factor.risk_factor_name}`);
          isValid = false;
        } else {
          const numValue = parseFloat(loadingValue);
  
          if (factor.type === 'Direct') {
            // For Direct type, check against list_values
            if (selectedValue && factor.list_values) {
              const listValues = JSON.parse(factor.list_values);
              const minLimit = parseFloat(listValues[selectedValue]?.min || 0);
              if (numValue < minLimit) {
                errors.push(`${factor.risk_factor_name} value must be at least ${minLimit}% for ${selectedValue}`);
                isValid = false;
              }
            }
          } else if (factor.type === 'Limit') {
            // For Limit type, check value ranges from list_values
            if (selectedValue && factor.list_values) {
              const listValues = JSON.parse(factor.list_values);
              const optionValues = listValues[selectedValue];
              if (optionValues) {
                const minLimit = parseFloat(optionValues.min);
                const maxLimit = parseFloat(optionValues.max);
                if (numValue < minLimit || numValue > maxLimit) {
                  errors.push(`${factor.risk_factor_name} value must be between ${minLimit}% and ${maxLimit}% for ${selectedValue}`);
                  isValid = false;
                }
              }
            }
          }
        }
      }
  
      // For Free Entry type factors
      if (factor.type === 'Free Entry') {
        const loadingValue = popupFormData[`loadingDiscount_${factor.risk_factor_id}`];
        if (loadingValue === undefined || loadingValue === '') {
          errors.push(`Please enter loading/discount value for ${factor.risk_factor_name}`);
          isValid = false;
        } else {
          const numValue = parseFloat(loadingValue);
          const minLimit = parseFloat(factor.min);
          const maxLimit = parseFloat(factor.max);
          if (numValue < minLimit || numValue > maxLimit) {
            errors.push(`${factor.risk_factor_name} value must be between ${minLimit}% and ${maxLimit}%`);
            isValid = false;
          }
        }
      }
    });
  
    if (!isValid) {
      alert(errors.join('\n'));
    }
  
    return isValid;
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

  const handleSaveDraft = async () => {
    try {
      const now = formatDate(new Date().toISOString());
  
      // Create base form data
      const mainFormData = {
        name: formData["Name"] || "",
        mobile: formData["Mobile"] || "",
        individualOrCorporate: formData["Is Customer Individual or Corporate"] || "",
        gender: formData["Gender"] || "",
        panNumber: formData["PAN Number"] || "",
        dateOfBirth: formData["Date of Birth"] || "",
        dateOfIncorporation: formData["Date of Incorporation"] || "",
        policyPeriod: formData["Risk Start Date"] || "",
        policyEndPeriod: formData["Risk End Date"] || "",
        title: title || "",
        selectedpackages: isEditing || isMultiEquipment ? productpackages : selectedPackages,
        isEdited: isEditing || false,
        editId: isEditing ? id : null,
        submittedAddress: false,
        addressLine1: formData["Address Line 1"] || "",
        areaVillage: formData["Area / Village"] || "",
        districtCity: formData["District / City"] || "",
        state: formData["State"] || "",
        pincode: formData["Pincode"] || "",
        typeOfConstruction: formData["Type Of Construction"] || "",
        occupancyType: formData["Occupancy Type"] || "",
        equipmentType: formData["Equipment Type"] || "",
        ageOfRiskInformation: formData["Age of the Risk Information"] || "",
        heightOfBuilding: formData["Height of the Building (in meters)"] || "",
        noOfFloors: formData["No. of Floors"] || "",
      };
  
      // Initialize draft data
      let draftData = [];
  
      // If in address form and on step 2 (components/covers step)
      if (showAddressForm) {
        const currentAddress = {
          ...mainFormData,
          addressLine1: popupFormData['Address Line 1'] || '',
          areaVillage: popupFormData['Area / Village'] || '',
          districtCity: popupFormData['District / City'] || '',
          state: popupFormData['State'] || '',
          pincode: popupFormData['Pincode'] || '',
          typeOfConstruction: popupFormData['Type Of Construction'] || '',
          occupancyType: popupFormData['Occupancy Type'] || '',
          equipmentType: popupFormData['Equipment Type'] || '',
          ageOfRiskInformation: popupFormData['Age of the Risk Information'] || '',
          heightOfBuilding: popupFormData['Height of the Building (in meters)'] || '',
          noOfFloors: popupFormData['No. of Floors'] || '',
          selectedPackage: selectedPackage || '',
          selectedComponents: selectedComponents || [],
          componentCovers: componentCovers || {},
          packageComponentValues: packageComponentValues || {},
          updatedRates: updatedRates || {},
          packageSumInsured: packageSumInsured || {},
          maxSumInsuredRules: maxSumInsuredRules || {},
          riskFactor: riskFactor || {},
          sections: sectionData || {},
          submittedAddress: true,
          currentStep: addressFormStep,
          totalSumInsured: Object.values(packageSumInsured).reduce((sum, val) => sum + (Number(val) || 0), 0),
          premium: Object.values(sectionData).reduce((sum, section) => sum + (Number(section.premium) || 0), 0)
        };
  
        if (isEditMode) {
          draftData = [...submittedAddresses];
          draftData[editIndex] = currentAddress;
        } else {
          draftData = [currentAddress];
        }
      } else {
        // If not in component step or not in address form, save main data only
        draftData = [{
          ...mainFormData,
          totalSumInsured: 0,
          premium: 0,
          sections: {},
          packageComponentValues: {},
          packageSumInsured: {},
          currentStep: showAddressForm ? addressFormStep : currentStep
        }];
      }
  
      // Convert data to JSON string
      const addressesJSON = JSON.stringify(draftData);
  
      // Check if we're editing an existing draft
      if (location.state?.isDraft && location.state?.id) {
        // Update existing draft
        const result = await updateDraft(
          location.state.id,
          draftData,
          user,
          currentStep,
          addressesJSON,
          now
        );
        alert('Draft updated successfully!');
      } else {
        // Save new draft
        const result = await saveDraft(
          draftData,
          user,
          currentStep,
          addressesJSON,
          now
        );
        alert('Draft saved successfully!');
      }
  
    } catch (error) {
      console.error('Error saving/updating draft:', error);
      alert(`Failed to save draft: ${error.message}`);
    }
  };

  const validateEquipmentDetails = (equipmentDetails) => {
    for (let equipment of equipmentDetails) {
      if (!equipment.make || !equipment.model || !equipment.serialNo || !equipment.yom) {
        return false;
      }
    }
    return true;
  };

  const handleAddressNext = () => {
    const isValid = validatePopupFields();
    // const isValid = true;
    setNonIndustrial(false);
    let sectionCovers = {};
    
    if(addressFormStep === 0) {
      if (!validateRiskFactors()) {
        return;
      }
      if (popupFormData['Equipment Type'] && !validateEquipmentDetails(popupFormData['Equipment Details'])) {
        alert("Please fill in all equipment details before proceeding.");
        return;
      }
    }

    if (addressFormStep === 2 || addressFormStep === 1) {
      isSubmit = true;
      if (!validateSectionSumInsured()) {
        return;
      }
  
      // Get all sections that should have covers
      const allSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
      
      // Initialize section covers for each section
      allSections.forEach(sectionName => {
        const name = isMultiEquipment ? sectionName.split('-').pop() : sectionName;
        const section = sections.find(section => section.section_reference_name === name);
        const sectionCode  =  isMultiEquipment ? sectionName.split('-')[0] : popupFormData["Equipment Type"]?.split("-")[0];
        sectionCovers[sectionName] = [];
  
        if (section) {
          const selectedOccupancy = occupancyData.find(
            occupancy => occupancy.code == popupFormData["Occupancy Type"]?.split('-')[0]
          );

          const selectedEquipment = equipmentData.find(
            (Equipment) => Equipment.code == sectionCode
          );
  
          // Get all covers for the section
          const allCovers = section.covers.split(', ');
          
          // Process each cover
          allCovers.forEach(cover => {
            let rate = '0';
            const coverRateTypes = JSON.parse(section.cover_rate_types || '[]');
            const autoRateCover = coverRateTypes.find(rt => rt.cover === cover && rt.rateType === 'Auto');
  
            if (autoRateCover) {
              // Calculate auto rate
              const componentRates = autoRateCover.coverComponents.map(compCover => {
                if (compCover === 'Basic' || compCover === 'STFI Cover' || compCover === 'Earthquake' || compCover === 'Terrorism') {
                  switch (compCover) {
                    case 'Basic':
                      return selectedOccupancy?.IIB_basic || selectedEquipment?.basic ||0;
                    case 'STFI Cover':
                      return (
                        selectedOccupancy?.IIB_stfi ||
                        selectedEquipment?.stfi ||
                        0
                      );
                    case 'Earthquake':
                      const zone = popupFormData['Zone'] || 'I';
                      const zoneNumber = getZoneNumber(zone);
                      return (
                        selectedOccupancy?.[`IIB_eq${zoneNumber}`] ||
                        selectedEquipment?.[`eq${zoneNumber}`] ||
                        0
                      );
                    case 'Terrorism':
                      return (
                        selectedOccupancy?.IIB_terrorism ||
                        selectedEquipment?.terrorism ||
                        0
                      );
                    default:
                      return 0;
                  }
                } else {
                  return parseFloat(section.direct_rate.split(', ')
                    .find(rate => rate.startsWith(`${compCover}-`))?.split('-')[1] || 0);
                }
              });
              rate = componentRates.reduce((sum, rate) => sum + rate, 0).toString();
            } else {
              // Get manual rate
              if (section.rate_type === 'direct') {
                rate = section.direct_rate.split(', ')
                  .find(r => r.startsWith(`${cover}-`))?.split('-')[1] || '0';
              } else if (
                section.rate_type === "occupancy" ||
                section.rate_type === "equipments"
              ) {
                rate = getOccupancyRate(
                  cover,
                  selectedOccupancy ? selectedOccupancy : selectedEquipment,
                  section
                );
              }
            }

            const isActiveForComponent  = componentCovers[section.components.split(', ')[0]]?.includes(cover) || false;

            if(isActiveForComponent) {
              sectionCovers[sectionName].push({
                cover: cover,
                rate: rate,
                is_active: isActiveForComponent
              });
            }
          });
        }
      });
    }
   
    const newAddress = {
      addressLine1: popupFormData['Address Line 1'],
      areaVillage: popupFormData['Area / Village'],
      districtCity: popupFormData['District / City'],
      state: popupFormData['State'],
      equipmentTypes: popupFormData['Equipment Type'],
      equipmentDetails: popupFormData['Equipment Details'],
      pincode: popupFormData['Pincode'],
      typeOfConstruction: popupFormData['Type Of Construction'],
      occupancyType: popupFormData['Occupancy Type'],
      equipmentType: popupFormData['Equipment Type'],
      ageOfRiskInformation: popupFormData['Age of the Risk Information'],
      heightOfBuilding: popupFormData['Height of the Building (in meters)'],
      noOfFloors: popupFormData['No. of Floors'],
      locationAddress: selectedZone ? 'Anywhere in India' : '',
      selectedPackage: selectedPackage,
      selectedComponents: selectedComponents,
      componentCovers: componentCovers,
      packageComponentValues: packageComponentValues,
      updatedRates: updatedRates,
      packageSumInsured: packageSumInsured,
      policyPeriod: formData['Risk Start Date'],
      policyEndPeriod: formData['Risk End Date'],
      multiEquipment: isMultiEquipment,
      floater: isFloater,
      user: isEditing ? user : user.user,
      title: title,
      name: mainData.name,
      selectedpackages: isEditing || isMultiEquipment ? productpackages : selectedPackages,
      mobile: mainData.mobile,
      dateOfBirth: mainData.dateOfBirth,
      dateOfIncorporation: mainData.dateOfIncorporation,
      panNumber: mainData.panNumber,
      individualOrCorporate: mainData.individualOrCorporate,
      gender: mainData.maleOrFemale,
      isEdited: isEditing,
      editId: isEditing ? id : null,
      sectionCovers: sectionCovers,
      selectedNumber: popupFormData['SelectedNumber']
    };
  
    if (isValid) {
      if (addressFormStep < 2) {
        setAddressFormStep(addressFormStep + 1);
      } else {
        const sectionSumInsured = Object.entries(packageComponentValues[isMultiEquipment ? actualPackage : selectedPackage] || {})
          .filter(([key]) => !key.endsWith('_premium')&&!key.endsWith('_terror'))
          .reduce((total, [_, value]) => total + (Number(value) || 0), 0);
          const type = popupFormData["Occupancy Type"] || popupFormData['Equipment Type'];
        const { totalPremium, terrorismPremium } = calculatePremium(componentCovers, type);
        const updatedSectionData = {
          ...sectionData,
          [isMultiEquipment ? actualPackage : selectedPackage]: {
            ...sectionData[isMultiEquipment ? actualPackage : selectedPackage],
            sumInsured: sectionSumInsured,
            premium: totalPremium,
            terrorism: terrorismPremium,
            updatedRates: { ...updatedRates }
          }
        };
  
        const componentDetails = {};
        selectedComponents.forEach(component => {
          const sumInsured = packageComponentValues[isMultiEquipment ? actualPackage : selectedPackage]?.[component] || 0;
          const premium = packageComponentValues[isMultiEquipment ? actualPackage : selectedPackage]?.[`${component}_premium`] || 0;
          componentDetails[component] = { sumInsured, premium };
        });
  
        setSectionData(updatedSectionData);
        newAddress.totalSumInsured = Object.values(updatedSectionData).reduce((total, section) => total + (section.sumInsured || 0), 0);
        newAddress.premium = Object.values(updatedSectionData).reduce((total, section) => total + (section.premium || 0), 0);
        newAddress.sections = updatedSectionData;
        newAddress.componentDetails = componentDetails;

  
        if (isEditMode) {
          setSubmittedAddresses((prevAddresses) => {
            const updatedAddresses = [...prevAddresses];
            updatedAddresses[editIndex] = newAddress;
            return updatedAddresses;
          });
        } else {
          setSubmittedAddresses((prevAddresses) => [...prevAddresses, newAddress]);
        }
        setShowAddressForm(false);
        setIsEditMode(false);
        setEditIndex(null);
      }
    } else {
      alert(errors.map(error => `• ${error}`).join('\n'));
    }
  };

  const handleAddComponents = () => {
    setShowComponentPopup(true);
  };

  const getSectionDisplayName = (pkg) => {
    const section = sections.find(section => 
      section.section_reference_name === pkg
    );
    return section ? section.section_name : pkg;
  };

  const handleClosePopup = () => {
    setShowComponentPopup(false);
  };

  const handleSaveComponents = () => {
    setShowComponentPopup(false);
  };

  const handleAddressPrevious = () => {
    setNonIndustrial(false);
    if (addressFormStep > 0) {
      if (addressFormStep === 2) {
        const currentSumInsured = Object.entries(packageComponentValues[isMultiEquipment ? actualPackage : selectedPackage] || {})
          .filter(([key]) => !key.endsWith('_premium')&&!key.endsWith('_terror'))
          .reduce((total, [_, value]) => total + (Number(value) || 0), 0);
          const type = popupFormData["Occupancy Type"] || popupFormData['Equipment Type'];
        const { totalPremium, terrorismPremium } = calculatePremium(componentCovers, type);
  
        // Get previous section values from sectionData
        const previousSectionData = sectionData[isMultiEquipment ? actualPackage : selectedPackage] || {};
        const previousSumInsured = previousSectionData.sumInsured || 0;
        const previousPremium = previousSectionData.premium || 0;
  
        // Only update if values have changed
        if (currentSumInsured !== previousSumInsured) {
          setUpdateSI(prevUpdateSI => prevUpdateSI + currentSumInsured - previousSumInsured);
        }

  
        if (totalPremium !== previousPremium) {
          setUpdatePre(prevUpdatePre => prevUpdatePre + totalPremium - previousPremium);
        }

        const currentRates = {};
        const section = sections.find(section => section.section_reference_name === selectedPackage);
          
        if (section) {
          section.covers.split(', ').forEach(cover => {
            const coverRateTypes = JSON.parse(section.cover_rate_types || '[]');
            const autoRateCover = coverRateTypes.find(rt => rt.cover === cover && rt.rateType === 'Auto');
            
            if (autoRateCover) {
              // Calculate auto rate
              const type = popupFormData["Occupancy Type"] || popupFormData['Equipment Type'];
              const seldectedOccupancy = occupancyData.find(
                occupancy => occupancy.code == type?.split('-')[0]
              );
              
              const componentRates = autoRateCover.coverComponents.map(compCover => {
                // ... existing auto rate calculation ...
              });
              const autoRate = componentRates.reduce((sum, rate) => sum + rate, 0).toString();
              currentRates[`${isMultiEquipment ? actualPackage : selectedPackage}-${cover}`] = autoRate;
            } else {
              // Save manual rates
              Object.keys(componentCovers).forEach(component => {
                if (componentCovers[component]?.includes(cover)) {
                  const rateKey = `${component}-${cover}`;
                  currentRates[rateKey] = updatedRates[rateKey] || '0';
                }
              });
            }
          });
        }

        setSectionData(prevData => ({
          ...prevData,
          [isMultiEquipment ? actualPackage : selectedPackage]: {
            ...prevData[isMultiEquipment ? actualPackage : selectedPackage],
            rates: currentRates
          }
        }));
        // Store current values in sectionData for future comparison
        setSectionData(prevData => ({
          ...prevData,
          [isMultiEquipment ? actualPackage : selectedPackage]: {
            ...prevData[isMultiEquipment ? actualPackage : selectedPackage],
            sumInsured: currentSumInsured,
            premium: totalPremium,
            terrorism: terrorismPremium,
            updatedRates: { ...updatedRates } // Store the updated rates
          }
        }));
      }
      if(validateSectionSumInsured() && addressFormStep === 2){
        setAddressFormStep(addressFormStep - 1);
      }
      else if(addressFormStep !== 2){
        setAddressFormStep(addressFormStep - 1);
      }
    }
  };

  const handleSubmit = () => {
    let updatedAddresses = submittedAddresses.map(address => {
      if (!address) return null;
      
      let addressTotalPremium = 0;
      
      if (address.sectionCovers && typeof address.sectionCovers === 'object') {
        Object.entries(address.sectionCovers).forEach(([sectionName, covers]) => {
          if (!covers || !Array.isArray(covers)) return;
          
          let sectionPremium = 0;
          const sectionSumInsured = address.packageComponentValues?.[sectionName] || {};
          
          covers.forEach(coverData => {
            const coverRate = parseFloat(coverData.rate || 0);
            const sumInsured = Object.keys(sectionSumInsured)
              .filter(key => !key.endsWith('_premium')&&!key.endsWith('_terror'))
              .reduce((total, key) => total + parseFloat(sectionSumInsured[key] || 0), 0);
            
            sectionPremium += (sumInsured * coverRate) / 1000;
          });
          
          // Apply policy risk factors for this specific section
          const finalSectionPremium = calculatePolicyRiskFactors(sectionPremium, sectionName, address);
          
          // Update section premium
          if (!address.sections) address.sections = {};
          address.sections[sectionName] = {
            ...(address.sections[sectionName] || {}),
            premium: finalSectionPremium
          };
          
          addressTotalPremium += finalSectionPremium;
        });
      }
      
      return {
        ...address,
        premium: addressTotalPremium
      };
    }).filter(Boolean);
    
    // The rest of your function remains the same
    let riskFactors = 0;
    Object.keys(popupFormData)
      .filter(key => key.startsWith('loadingDiscount_'))
      .forEach(key => {
        riskFactors = popupFormData[key]
      });
    
    updatedAddresses.riskFactors = riskFactors;
    updatedAddresses.riskExpand = isRiskFactorExpanded;
    updatedAddresses.projectNature = popupFormData['natureOfProject'];
    updatedAddresses.natureOfClaim = popupFormData['natureOfClaim'];
    updatedAddresses.yearOfClaim = popupFormData['yearOfClaim'];
    updatedAddresses.valueOfClaim = popupFormData['valueOfClaim'];
    updatedAddresses.postMeasures = popupFormData['postMeasures'];
    updatedAddresses.claimExperience = popupFormData['claimExperience'];
    updatedAddresses.hypothecation = popupFormData['hypothecation'];
    updatedAddresses.supportingDocuments = popupFormData['supportingDocuments'];
    updatedAddresses.supportingDocumentsURL = popupFormData['supportingDocumentsURL'];
    
    setSubmittedAddresses(updatedAddresses);
    navigate('/final-page', {
      state: {
        item: updatedAddresses,
        title: title,
        currentStep: currentStep
      }
    });
  };
  
  const renderRiskAddress = () => {

    const locationRiskFactors = riskFactor.filter(factor => {
      const requiredSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
      return factor.factor_type === 'Location' && 
             factor.section_name.split(', ').some(section => 
               requiredSections.includes(section)
             );
    });

    return (
      <>
        <div className="general-section">
          <h3>Risk Address</h3>
          {renderAddressPopupHeader()}              
        </div>
        {parsedWorkflows[1]?.sections?.map((section) => (
          <div key={section.name} className="general-section">
            <h3>{section.name}</h3>
            <div className="general-form-group-wrapper">
              {section.fields.map((field) => renderField(field, section.name, true))}
            </div>
          </div>
        ))}
        {locationRiskFactors.length > 0 && (
          <div className="general-section">
            <h3>
              Risk Factor Details
            </h3>
            <div className="general-form-group-wrapper">
              {riskFactor
                .filter(factor => {
                  const requiredSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
                  return factor.section_name.split(', ').some(section => 
                    requiredSections.includes(section)
                  );
                })
                .map((factor, index) => (
                  <div key={index} className="risk-factor-group">
                    {factor.type !== 'Free Entry' && factor.type !== 'Zone' && (
                      <div className="risk-factor-name">{factor.risk_factor_name}
                        {factor.list && factor.type !== 'Free Entry' && factor.type !== 'Zone' && (
                          <select 
                            className="risk-factor-list-select"
                            value={popupFormData[`riskFactorList_${factor.risk_factor_id}`] || ''}
                            onChange={(e) => {
                              const selectedValue = e.target.value;
                              if (factor.type === 'Direct' && selectedValue) {
                                const listValues = JSON.parse(factor.list_values);
                                const minValue = listValues[selectedValue]?.min || '';
                                
                                setPopupFormData(prev => ({
                                  ...prev,
                                  [`riskFactorList_${factor.risk_factor_id}`]: selectedValue,
                                  [`loadingDiscount_${factor.risk_factor_id}`]: minValue
                                }));
                              } else {
                                setPopupFormData(prev => ({
                                  ...prev,
                                  [`riskFactorList_${factor.risk_factor_id}`]: selectedValue
                                }));
                              }
                            }}
                          >
                            <option value="">Select {factor.risk_factor_name}</option>
                            {factor.list.split(', ').map((item, index) => (
                              <option key={index} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                    {factor.type === 'Limit' && (
                      <div className="general-form-group">
                        <label>Loading/Discount (%)</label>
                        <input
                          type="number"
                          value={popupFormData[`loadingDiscount_${factor.risk_factor_id}`] ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPopupFormData(prev => ({
                              ...prev,
                              [`loadingDiscount_${factor.risk_factor_id}`]: value
                            }));
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') return;
              
                            const selectedOption = popupFormData[`riskFactorList_${factor.risk_factor_id}`];
                            if (!selectedOption) {
                              alert('Please select an option first');
                              setPopupFormData(prev => ({
                                ...prev,
                                [`loadingDiscount_${factor.risk_factor_id}`]: ''
                              }));
                              return;
                            }
              
                            const listValues = JSON.parse(factor.list_values);
                            const optionValues = listValues[selectedOption];
                            const numValue = parseFloat(value);
              
                            switch(factor.type) { 
                              case 'Limit':
                                const minLimit = parseFloat(optionValues.min);
                                const maxLimit = parseFloat(optionValues.max);
                                if (numValue < minLimit || numValue > maxLimit) {
                                  alert(`Value must be between ${minLimit}% and ${maxLimit}% for ${selectedOption}`);
                                  setPopupFormData(prev => ({
                                    ...prev,
                                    [`loadingDiscount_${factor.risk_factor_id}`]: minLimit.toString()
                                  }));
                                }
                                break;
                            }
                          }}
                          placeholder="Enter percentage"
                          disabled={!popupFormData[`riskFactorList_${factor.risk_factor_id}`]}
                        />
                      </div>
                    )}
                    {factor.type === 'Zone' && (
                      <div className="general-form-group">
                        <div className="risk-factor-name">{factor.risk_factor_name}</div>
                        {(() => {
                          const currentZone = isCopyAddressChecked ? formData['Zone'] : popupFormData['Zone'];
                          let zoneNumber;
                          switch(currentZone) {
                            case 'I':
                              zoneNumber = 'zone1';
                              break;
                            case 'II':
                              zoneNumber = 'zone2';
                              break;
                            case 'III':
                              zoneNumber = 'zone3';
                              break;
                            case 'IV':
                              zoneNumber = 'zone4';
                              break;
                            default:
                              zoneNumber = 'zone1';
                          }
                          return (
                            <div className="zone-value">
                              Zone {currentZone}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {factor.type === 'Free Entry' && (
                      <div className="general-form-group">
                        <label>{factor.risk_factor_name} Loading/Discount (%)</label>
                        <input
                          type="number"
                          value={popupFormData[`loadingDiscount_${factor.risk_factor_id}`] ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPopupFormData(prev => ({
                              ...prev,
                              [`loadingDiscount_${factor.risk_factor_id}`]: value
                            }));
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') return;
                            const numValue = parseFloat(value);
                            const minLimit = parseFloat(factor.min);
                            const maxLimit = parseFloat(factor.max);
                            if (numValue < minLimit || numValue > maxLimit) {
                              alert(`Value must be between ${minLimit}% and ${maxLimit}%`);
                              setPopupFormData(prev => ({
                                ...prev,
                                [`loadingDiscount_${factor.risk_factor_id}`]: minLimit.toString()
                              }));
                            }
                          }}
                          placeholder="Enter percentage"
                        />
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </>
    );
  };

  const handleZoneChange = (zone) => {
    if(!isCopyAddressChecked){
      setSelectedZone(zone === selectedZone ? null : zone);
    }
    else{
      alert("cannot select both Copy address and Any Where In India")
    }
    
  };

  const renderAddressPopupHeader = () => {
    return (
      <>
        <div className="general-form-group half-width">
          <label htmlFor="copyAddress">Copy Address</label>
          <input
            type="checkbox"
            id="copyAddress"
            name="copyAddress"
            checked={isCopyAddressChecked}
            onChange={handleCopyAddressChange}
          />
        </div>
        {title === 'CPM' && (
          <div className='general-form-group-wrapper'>
            <div className="general-form-group">
              <label htmlFor="zoneI">Anywhere in India Zone I</label>
              <input
                type="checkbox"
                id="zoneI"
                name="zoneSelection"
                checked={selectedZone === 'I'}
                onChange={() => handleZoneChange('I')}
              />
            </div>
            <div className="general-form-group">
              <label htmlFor="zoneII">Anywhere in India Zone II</label>
              <input
                type="checkbox"
                id="zoneII"
                name="zoneSelection"
                checked={selectedZone === 'II'}
                onChange={() => handleZoneChange('II')}
              />
            </div>
            <div className="general-form-group">
              <label htmlFor="zoneIII">Anywhere in India Zone III</label>
              <input
                type="checkbox"
                id="zoneIII"
                name="zoneSelection"
                checked={selectedZone === 'III'}
                onChange={() => handleZoneChange('III')}
              />
            </div>
            <div className="general-form-group">
              <label htmlFor="zoneIV">Anywhere in India Zone IV</label>
              <input
                type="checkbox"
                id="zoneIV"
                name="zoneSelection"
                checked={selectedZone === 'IV'}
                onChange={() => handleZoneChange('IV')}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCoverCard = (cover, index) => {
    const section = sections.find((section) => section.section_reference_name === selectedPackage);
    const isMandatory = section.mandatory_cover.split(', ').includes(cover);
    const isEnterableRate = section.enterable_rate.split(', ').includes(cover);
    const isActive = activeCovers[selectedPackage]?.[cover] !== "inactive";
    
    const isChecked = isMandatory || isActive;
    let rate = '0';
    let minRate = '0';

    const coverRateTypes = JSON.parse(section.cover_rate_types || '[]');
    const autoRateCover = coverRateTypes.find(rt => rt.cover === cover && rt.rateType === 'Auto');
    if (autoRateCover) {
      // Calculate sum of component rates
      const componentRates = autoRateCover.coverComponents.map(compCover => {
        const selectedOccupancy = occupancyData.find(
          occupancy => occupancy.code == popupFormData["Occupancy Type"]?.split('-')[0]
        );
        const selectedEquipment = equipmentData.find(
          equipment => equipment.code == popupFormData['Equipment Type']?.split('-')[0]
        );

        if (compCover === 'Basic' || compCover === 'STFI Cover' || compCover === 'Earthquake' || compCover === 'Terrorism') {
          switch (compCover) {
            case 'Basic':
              return (
                selectedOccupancy?.IIB_basic || selectedEquipment?.basic || 0
              );
            case 'STFI Cover':
              return (
                selectedOccupancy?.IIB_stfi || selectedEquipment?.stfi || 0
              );

            case 'Earthquake':
              const zone = popupFormData['Zone'] || 'I';
              const zoneNumber = getZoneNumber(zone);
              return (
                selectedOccupancy?.[`IIB_eq${zoneNumber}`] ||
                selectedEquipment?.[`eq${zoneNumber}`] ||
                0
              );
            case 'Terrorism':
              return (
                selectedOccupancy.IIB_terrorism ||
                selectedEquipment?.terrorism ||
                0
              );
            default:
              return 0;
          }
        }
        else {
          return section.direct_rate.split(', ')
            .find(rate => rate.startsWith(`${compCover}-`))?.split('-')[1] || 0;
        }
      });
  
      // Sum up all component rates
      rate = componentRates.reduce((sum, rate) => sum + parseFloat(rate), 0).toString();
    } else {
      if (section.rate_type === 'direct') {
        rate = section.direct_rate.split(', ').find((rate) => rate.startsWith(`${cover}-`))?.split('-')[1] || '0';
        minRate = section.direct_min_rate.split(', ').find((rate) => rate.startsWith(`${cover}-`))?.split('-')[1] || '0';
      } else if (section.rate_type === "occupancy" || section.rate_type === "equipments") {
        const type = popupFormData["Occupancy Type"] 
          ? popupFormData["Occupancy Type"] 
          : (isMultiEquipment 
          ? actualPackage.split(`-${selectedPackage}`)[0] 
          : popupFormData["Equipment Type"]);

        if (Array.isArray(type)) {
          setPopupFormData(prevData => ({
            ...prevData,
            "Equipment Type": type[0].label.split('-')[0]
          }));
        }
        
        let selectedOccupancy = null;
        let selectedEquipment = null;
        if(popupFormData["Occupancy Type"]) {
          selectedOccupancy = occupancyData.find(
            (occupancy) => occupancy.code == type.split("-")[0]
          );
        }
        else {
          selectedEquipment = equipmentData.find(
            (equipment) => equipment.code == type.split("-")[0]
          );
        }
        
        const occupancySectionRate = section.occupancy_rate.split(", ");
        const occupancyMinSectionRate = section.occupancy_min_rate.split(", ");
        if (selectedOccupancy || selectedEquipment) {
          switch (cover) {
            case "Basic":
              rate =
                selectedOccupancy? selectedOccupancy[occupancySectionRate[0]] : selectedEquipment[occupancySectionRate[0]]
                 ||
                "0";
              minRate = selectedOccupancy
                ? selectedOccupancy[occupancyMinSectionRate[0]]
                : "0";
              break;
            case "STFI Cover":
              rate =
                selectedOccupancy?selectedOccupancy[occupancySectionRate[1]] :  selectedEquipment[occupancySectionRate[1]]
                 ||
                "0";
              minRate = selectedOccupancy?selectedOccupancy[occupancyMinSectionRate[1]] : "0";
              break;
            case "Earthquake":
              const zone = popupFormData['Zone'] || 'I';
              let index;
              if(zone === 'II'){
                index = 3;
              }
              else if(zone === 'III'){
                index = 4;
              }
              else if(zone === 'IV'){
                index = 5;
              }
              else {
                index = 2
              }
              rate =
                selectedOccupancy?selectedOccupancy[occupancySectionRate[index]] : selectedEquipment[occupancySectionRate[index]]                 ||
                "0";
              minRate = selectedOccupancy?selectedOccupancy[occupancyMinSectionRate[2]] : "0";
              break;
            case "Terrorism":
              rate =
                selectedOccupancy?selectedOccupancy[occupancySectionRate[6]] : selectedEquipment[occupancySectionRate[6]]
                 ||
                "0";
              minRate = selectedOccupancy?selectedOccupancy[occupancyMinSectionRate[6]] : "0";
              break;
            default:
              rate = "0";
              minRate = "0";
          }
        }
      }
    }
  
    return (
      <div key={index} className="cover-card">
        <div className="cover-content">
          <div className='cover-wrapper'>
            <input
              type='checkbox'
              defaultChecked={isChecked}
              disabled={isMandatory}
              onChange={(e) => {
                e.preventDefault();
                if (Object.entries(packageComponentValues).length > 0) {
                  handleCoverChange(focusedComponent, cover, e.target.checked)
                } else {
                  alert("Please enter SI first");
                }
              }}
            />
            <h3>{cover}</h3>
          </div>
          <div className="component-details">
            <div className='rate-values'>
              Rate: {isEnterableRate ? (
                <input
                  type="number"
                  step="0.0001"
                  value={updatedRates[`${focusedComponent}-${cover}`] || rate}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Validate to ensure max 4 decimal places
                    const regex = /^\d*\.?\d{0,4}$/;
                    if (regex.test(newValue) || newValue === '') {
                      setUpdatedRates((prevRates) => ({
                        ...prevRates,
                        [`${focusedComponent}-${cover}`]: newValue,
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    const newRate = e.target.value;
                    // First check for minimum rate
                    if (newRate < minRate) {
                      alert(`The rate for ${cover} cannot be below the minimum rate of ${minRate}.`);
                      setUpdatedRates((prevRates) => ({
                        ...prevRates,
                        [`${focusedComponent}-${cover}`]: minRate,
                      }));
                    }
                    // Then format to ensure no more than 4 decimal places
                    const formattedValue = Number(newRate).toFixed(4).replace(/\.?0+$/, '');
                    setUpdatedRates((prevRates) => ({
                      ...prevRates,
                      [`${focusedComponent}-${cover}`]: formattedValue,
                    }));
                  }}
                />
              ) : (
                Number(rate).toFixed(4).replace(/\.?0+$/, '')
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSelectChange = (e) => {
    const option = e.target.value;
    setPopupFormData(prev => ({
      ...prev,
      'SelectedNumber': option
    }));
  };

  const renderField = (field, sectionName, isPopup = false) => {
    const data = isPopup ? popupFormData : formData;
    const handleChangeFn = isPopup ? handlePopupChange : handleChange;

    if(title !== 'IAR') {
      if (sectionName === 'Customer Details' && field.dependsOn && formData['Is Customer Individual or Corporate'] !== field.dependsOn) {
        return null;
      }
    }
    if(title === 'IAR') {
      if(sectionName === 'Customer Details' && field.label === 'Gender') {
        return null;
      }
    }

    if((sectionName === 'Claim Experience in last 3 years' || sectionName === 'Claim Experience in last 5 years') && field.label !== "Has Claims"){
      if(formData['Has Claims']===false){
        return null
      }
    }

    if(sectionName === 'Financier Details'){
      return null;
    }

    if(sectionName === 'Co-Insurance Details'){
      return null;
    }
  
    const formGroupClass = `general-form-group ${field.label === 'Is Customer Individual or Corporate' || field.label === 'Corporate Customer' || field.type === 'checkbox' ? 'half-width' : ''}`;
    switch (field.type) {
      case 'text':
      case 'date':
      case 'number':
        return (
          <div className={formGroupClass} key={field.label}>
            <label htmlFor={field.label}>{field.label}</label>
            <input
              type={field.type === 'date' ? 'date' : field.type}
              id={field.label}
              name={field.label}
              value={data[field.label] || ''}
              onChange={handleChangeFn}
              required={field.required}
              onFocus={field.type === 'date' ? (e) => e.target.showPicker() : undefined}
              disabled={field.editable === false || field.label === 'Risk End Date'}
              max={field.label === 'Date of Birth' ? getMaxDateOfBirth() : field.label === 'Risk Start Date' ? getMaxRiskStartDate() : undefined}
              min={field.label === 'Risk Start Date' ? getMinRiskStartDate() : undefined}
            />
          </div>
        );
        case 'dropdown':
          return (
            <div className={formGroupClass} key={field.label}>
              <label htmlFor={field.label}>{field.label}</label>
              {field.label === 'Equipment Type' ? (
                <>
                  <Select
                    isMulti={isMultiEquipment}
                    options={equipmentOptions.map((label) => ({ label, value: label.toLowerCase() }))}
                    onChange={(selectedOption) => {
                      if (isMultiEquipment) {
                        handleEquipmentChange(selectedOption);
                      } else {
                        const singleOptionAsArray = selectedOption ? [selectedOption] : [];
                        handleEquipmentChange(singleOptionAsArray);
                        handleChangeFn({ target: { name: field.label, value: selectedOption.value } });
                      }
                    }}
                    value={
                      isMultiEquipment 
                        ? popupFormData['Equipment Type'] || []
                        : equipmentOptions.map((label) => ({ label, value: label.toLowerCase() }))
                            .find(option => {
                              const currentValue = data[field.label];
                              if (Array.isArray(currentValue)) {
                                return currentValue.length > 0 ? 
                                  option.value === currentValue[0].value : false;
                              }
                              return option.value === currentValue?.toLowerCase();
                            })
                    }
                  />
                  {/* Always show equipment details table if there are equipment details */}
                  {popupFormData['Equipment Details'] && popupFormData['Equipment Details'].length > 0 && (
                    <div className="equipment-details-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Equipment</th>
                            <th>Make</th>
                            <th>Model</th>
                            <th>Serial No</th>
                            <th>YOM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {popupFormData['Equipment Details'].map((equipment, index) => (
                            <tr key={index}>
                              <td>{equipment.equipment}</td>
                              <td>
                                <input
                                  type="text"
                                  value={equipment.make || ''}
                                  onChange={(e) => handleEquipmentDetailChange(index, 'make', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={equipment.model || ''}
                                  onChange={(e) => handleEquipmentDetailChange(index, 'model', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={equipment.serialNo || ''}
                                  onChange={(e) => handleEquipmentDetailChange(index, 'serialNo', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={equipment.yom || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (validateYOM(value)) {
                                      handleEquipmentDetailChange(index, 'yom', value);
                                    }
                                  }}
                                  maxLength={4}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : field.label === 'Occupancy Type' ? (
                <Select
                  isMulti={false}
                  options={occupancyOptions.map((label) => ({ label, value: label.toLowerCase() }))}
                  onChange={(selectedOption) => handleChangeFn({ target: { name: field.label, value: selectedOption.value } })}
                  value={
                    occupancyOptions.map((label) => ({ label, value: label.toLowerCase() }))
                      .find(option => option.value === data[field.label]?.toLowerCase())
                  }
                />
              ) : (
                <select
                  id={field.label}
                  name={field.label}
                  value={data[field.label] || ''}
                  onChange={handleChangeFn}
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {field.label === 'Area / Village' ? (
                    areaOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))
                  ) : field.options ? (field.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))): ('')
                  }
                </select>
              )}
            </div>
          );        
      case 'toggle':
        return (
          <div className={formGroupClass} key={field.label}>
            <label>{field.label}</label>
            <div className="general-toggle-buttons">
              {field.options.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`general-toggle-button ${data[field.label] === option ? 'active' : ''}`}
                  onClick={() => handleChangeFn({ target: { name: field.label, value: option } })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 'checkbox':
        return (
          <div className={formGroupClass} key={field.label}>
            <label htmlFor={field.label}>{field.label}</label>
            <input
              type="checkbox"
              id={field.label}
              name={field.label}
              defaultChecked={field.label === "Multi Equipment" ? isMultiEquipment ? true : data[field.label] || false : data[field.label] || false}
              onChange={handleChangeFn}
            />
          </div>
        );
      case 'search':
        return (
          <div className={formGroupClass} key={field.label}>
            <label htmlFor={field.label}>{field.label}</label>
            <input
              type="text"
              id={field.label}
              name={field.label}
              value={data[field.label] || ''}
              onChange={handleChangeFn}
              required={field.required}
            />
            {/* Implement search dropdown logic here */}
          </div>
        );
      case 'button':
        return (
          <div className={formGroupClass} key={field.label}>
            <button className="general-popup-button" type="button" onClick={handleAddAddressClick}>
              {field.label}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const SumInsureDetails = () => {
    // Get all sections that have sum insured values across any address
    const sectionsWithSI = (isEditing || isMultiEquipment ? productpackages : selectedPackages)
      .filter(pkg => {
        return submittedAddresses.some(address => {
          const componentValues = address?.packageComponentValues[pkg] || {};
          return Object.entries(componentValues)
            .filter(([key]) => !key.endsWith('_premium') && !key.endsWith('_terror'))
            .some(([_, value]) => Number(value) > 0);
        });
      });

    return (
      <>
      <div className="general-section">
        <h3>Sum Insured Details</h3>
        {sectionsWithSI.map(pkg => {
          const section = sections.find(s => s.section_reference_name === pkg);

          // Aggregate values across all addresses for this section
          const aggregatedComponents = {};
          
          submittedAddresses.forEach(address => {
            const componentValues = address?.packageComponentValues[pkg] || {};
            Object.entries(componentValues)
              .filter(([key, value]) => !key.endsWith('_premium') && !key.endsWith('_terror') && Number(value) > 0)
              .forEach(([component, value]) => {
                if (!aggregatedComponents[component]) {
                  aggregatedComponents[component] = 0;
                }
                aggregatedComponents[component] += Number(value);
              });
          });

          if (Object.keys(aggregatedComponents).length === 0) return null;

          return (
            <div key={pkg} className="section-si-details">
              <h4>{section?.section_name || pkg}</h4>
              <table className="si-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Sum Insured</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(aggregatedComponents).map(([component, value]) => (
                    <tr key={component}>
                      <td>{component}</td>
                      <td>₹{new Intl.NumberFormat('en-IN').format(value)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>Total</strong></td>
                    <td>
                      <strong>
                        ₹{new Intl.NumberFormat('en-IN').format(
                          Object.values(aggregatedComponents).reduce((sum, value) => sum + Number(value), 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <div className="general-section risk-inspection">
        <h3>Risk Inspection</h3>
        <div className="waiver-checkbox">
          <input
            type="checkbox"
            id="waiverRequired"
            checked={isWaiverRequired}
            onChange={(e) => setIsWaiverRequired(e.target.checked)}
          />
          <label htmlFor="waiverRequired">Waiver Required</label>
        </div>

        {!isWaiverRequired && (
          <table className="risk-inspection-table">
            <thead>
              <tr>
                <th>Inspection Date</th>
                <th>Risk Location Address</th>
                <th>Graded As</th>
                <th>RI Report</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="date"
                    value={riskInspections[0]?.date || ''}
                    onChange={(e) => {
                      setRiskInspections([{
                        ...riskInspections[0],
                        date: e.target.value
                      }]);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={riskInspections[0]?.location || ''}
                    onChange={(e) => {
                      setRiskInspections([{
                        ...riskInspections[0],
                        location: e.target.value
                      }]);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={riskInspections[0]?.grade || ''}
                    onChange={(e) => {
                      setRiskInspections([{
                        ...riskInspections[0],
                        grade: e.target.value
                      }]);
                    }}
                  />
                </td>
                <td>
                  <div className="file-upload">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 0)}
                    />
                    <button 
                      type="button" 
                      className="upload-btn"
                      onClick={() => document.querySelector(`input[type="file"]`).click()}
                    >
                      Attach
                    </button>
                    {riskInspections[0]?.report && (
                      <span className="file-name">{riskInspections[0].report.name}</span>
                    )}
                    <div className="file-info">
                      attachment should below 5mb
                    </div>
                    <div className="file-info">
                      (.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png)
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
        {fileError && <div className="error-message">{fileError}</div>}
      </div>
      </>
    );
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
      const riskFactorPercentage = submittedAddresses.riskFactors || 0;
      
      // Create a map of existing addon details for preservation
      const existingDetailsMap = {};
      addonDetails.forEach(detail => {
        existingDetailsMap[detail.addonCoverId] = detail;
      });
      
      const details = (selectedOptions || []).map(option => {
        // Check if we already have details for this addon
        if (existingDetailsMap[option.value]) {
          return existingDetailsMap[option.value]; // Preserve existing values
        }

        // If it's a new addon, calculate new values
        const addonInfo = addonData.find(addon => addon.addon_cover_id === option.value);
        const sectionSumInsured = calculateSectionSumInsured(submittedAddresses, addonInfo.sections);
        
        let calculatedSumInsured = sectionSumInsured;
        
        // Calculate SI based on free cover percentage
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
        
        // Calculate default rate
        let defaultRate = '0';
        if (addonInfo.cover_rate) {
          let combinedRate = calculateCombinedRate(addonInfo.cover_rate, submittedAddresses) * 
                            Number(addonInfo.rate_limit_per) / 100;
          defaultRate = combinedRate.toString();
        } else if (addonInfo.rate_limit) {
          defaultRate = addonInfo.rate_limit;
        }
        
        // Apply risk factor percentage to the rate
        const adjustedRate = Number(defaultRate) * (1 + (Number(riskFactorPercentage) / 100));
        const finalRate = adjustedRate.toString();
        
        // Calculate premium with adjusted rate
        const premium = addonInfo.free_cover_si ? 0 : (adjustedRate * calculatedSumInsured) / 1000;

        // Return new addon details
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
          rate: finalRate,
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
          riskFactorApplied: riskFactorPercentage
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
    const coverList = coverRates.split(', ');
    
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

    // Handle AOA validation
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

    // Handle AOY validation
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

    // Handle Sum Insured validation and calculations
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

        updatedDetails[index].sumInsured = maxAllowed;
        
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
        
        const currentRate = Number(detail.rate) || 0;
        updatedDetails[index].premium = calculateAddonPremium(numValue, currentRate);
        updatedDetails[index].aoa = calculateAOA(
          numValue,
          detail.aoa_percentage,
          detail.aoa_limit
        );
        updatedDetails[index].aoy = calculateAOY(
          numValue,
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

  const handleRateChange = (index, value) => {
    const updatedDetails = [...addonDetails];
    updatedDetails[index].rate = value;
    setAddonDetails(updatedDetails);
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

  const calculateFreeCoverSI = (addon, sumInsured) => {
    if (!addon.free_cover_si_percentage || !sumInsured) return 0;
    return (parseFloat(sumInsured) * parseFloat(addon.free_cover_si_percentage)) / 100;
  };

  const calculateAddonSumInsured = (addon) => {
    let totalSI = 0;
    
    submittedAddresses.forEach(address => {
      if (!address.packageComponentValues) return;
      
      Object.entries(address.packageComponentValues).forEach(([section, components]) => {
        // Check if this section is applicable for the addon
        if (addon.sections.split(', ').includes(section)) {
          // Sum up all component values in this section
          Object.entries(components).forEach(([component, value]) => {
            if (!component.endsWith('_premium') && !component.endsWith('_terror')) {
              totalSI += parseFloat(value || 0);
            }
          });
        }
      });
    });
    
    return totalSI;
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
    const addonPremium = addonDetails.reduce((total, addon) => {
      const percentageAmount = (addon.originalSumInsured * Number(addon.freeCoverSiPer)) / 100;
      const isWithinFreeLimit = addon.freeCoverSiPer && 
        addon.freeCoverSi && 
        Number(addon.sumInsured) <= Number(addon.freeCoverSi) &&
        Number(addon.sumInsured) <= percentageAmount;
      return total + (isWithinFreeLimit ? 0 : (Number(addon.premium) || 0));
    }, 0);
  
    setTotalAddonPremium(addonPremium);
    setShowAddonPopup(false);
  };

  const handleCloseAddonPopup = () => {
    setShowAddonPopup(false);
    setPendingChange(null);
  };

  const addonsDetails = () => {
    const handleAddRemark = () => {
      if (remarkInput.trim()) {
        setAdditionalRemarks([...additionalRemarks, remarkInput.trim()]);
        setRemarkInput('');
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleAddRemark();
      }
    };
    return (
      <>
      <div className="general-section">
        <h3>Addon Details</h3>
        {selectedAddons.length > 0 && (
          <div className="addon-summary">
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
                {addonDetails.map((addon, index) => {
                  const percentageAmount = (addon.originalSumInsured * Number(addon.freeCoverSiPer)) / 100;
                  const isWithinFreeLimit = addon.freeCoverSiPer && 
                    addon.freeCoverSi && 
                    Number(addon.sumInsured) <= Number(addon.freeCoverSi) &&
                    Number(addon.sumInsured) <= percentageAmount;
                  return (
                    <tr key={index}>
                      <td>{addon.addonCoverName}</td>
                      <td>₹{new Intl.NumberFormat('en-IN').format(addon.sumInsured || 0)}</td>
                      <td>{isWithinFreeLimit ? 'Free Cover' : `${addon.rate}%`}</td>
                      <td>₹{isWithinFreeLimit ? 'Free Cover' : new Intl.NumberFormat('en-IN').format(addon.premium || 0)}</td>
                      <td>₹{isWithinFreeLimit ? 'Free Cover' : new Intl.NumberFormat('en-IN').format(addon.aoa || 0)}</td>
                      <td>₹{isWithinFreeLimit ? 'Free Cover' : new Intl.NumberFormat('en-IN').format(addon.aoy || 0)}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td colSpan="3">Total Premium:</td>
                  <td colSpan="3">₹{new Intl.NumberFormat('en-IN').format(totalAddonPremium)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      
        <button 
          className="addon-btn"
          onClick={handleAddonClick}
        >
          {selectedAddons.length ? "Add/Edit Addon" : "Add Addon"}
        </button>

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
                {/* Search box */}
                <div className="addon-search">
                  <input
                    type="text"
                    placeholder="Search addons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="addon-search-input"
                  />
                </div>

                {/* Addon Checkboxes */}
                <div className="addon-checkbox-list">
                  {addonOptions
                    .filter(addon => addon.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(addon => (
                      <div key={addon.value} className="addon-checkbox-item">
                        <input
                          type="checkbox"
                          id={`addon-${addon.value}`}
                          checked={selectedAddons.some(selected => selected.value === addon.value)}
                          onChange={() => {
                            const isSelected = selectedAddons.some(selected => selected.value === addon.value);
                            let newSelectedAddons;
                            if (isSelected) {
                              newSelectedAddons = selectedAddons.filter(selected => selected.value !== addon.value);
                            } else {
                              newSelectedAddons = [...selectedAddons, addon];
                            }
                            handleAddonChange(newSelectedAddons);
                          }}
                        />
                        <label htmlFor={`addon-${addon.value}`}>{addon.label}</label>
                      </div>
                    ))}
                </div>

                {/* Addon Details Table */}
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
                                placeholder="Enter Sum Insured"
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
      </div>
      <div>
      </div>
      <div className="general-section">
        <h3>Conditions & Warranties</h3>
        <div className="remarks-section">
          <h4>Conditions / Warranties / Additional Remarks</h4>
          <div className="remarks-input-container">
            <input
              type="text"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your remarks here..."
              className="remarks-input"
              rows="3"
            />
            <button 
              className="add-remark-btn"
              onClick={handleAddRemark}
            >
              Add
            </button>
          </div>

          {additionalRemarks.length > 0 && (
            <div className="remarks-list">
              {additionalRemarks.map((remark, index) => (
                <div key={index} className="remark-item">
                  <span>{remark}</span>
                  <button
                    className="remove-remark-btn"
                    onClick={() => {
                      setAdditionalRemarks(additionalRemarks.filter((_, i) => i !== index));
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
    );
  };

  const handleSave = async () => {
    // Get total sum insured from location with highest SI
    const topLocation = submittedAddresses.reduce((max, address) => 
      address.totalSumInsured > (max?.totalSumInsured || 0) ? address : max, 
      null
    );

    // Check if sum insured exceeds retention limit
    if ((title === "IAR" && topLocation?.totalSumInsured > 1000000000) || 
        (title !== "IAR" && submittedAddresses.reduce((total, address) => 
          total + (address.totalSumInsured || 0), 0) > 1000000000)) {
      setShowRetentionPopup(true);
      return;
    }

    continueWithSave();
  };

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

        const now = formatDate(new Date().toISOString());
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
      const time = formatDate(new Date().toISOString());

      if (submittedAddresses[0].isEdited) {
        await updatePolicy(
          submittedAddresses[0].editId, 
          submittedAddresses, 
          currentUser, 
          title, 
          addressesJSON, 
          time, 
          currentUser
        );
        await updateQuote(
          submittedAddresses[0].editId, 
          submittedAddresses, 
          currentUser, 
          title, 
          time, 
          currentUser
        );
        alert("Quote updated successfully!");
        navigate('/home');
      } else {
        await savePolicy(
          submittedAddresses,
          currentUser,
          title,
          addressesJSON,
          time
        );
        await saveQuote(
          submittedAddresses,
          currentUser,
          title,
          time
        );
        alert("Quote saved successfully!");
        navigate('/home');
      }
      
    } catch (error) {
      alert(`Failed to save Quote: ${error.message}`);
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

  const handlePreview = async () => {
    const product = title !== "CPM";
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

        const closingRow = `
          <tr height=24>
            <td colspan=2 class=xl130><font class="font13">Total</font></td>
            <td colspan=10 class=xl116><font class="font13"></font></td>
            <td colspan=8 class=xl130></td>
            <td colspan=4 class=xl130></td>
            <td colspan=7 class=xl130></td>
            <td colspan=4 class=xl130></td>
          </tr>
        `;
  
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

  const summaryDetails = () => {
    let totalPremium = submittedAddresses.reduce((total, address) => total + (address.premium || 0), 0) + marinePre;
    const gstAmount = (totalPremium + totalAddonPremium) * 0.18;
    const grossPremium = totalAddonPremium + totalPremium + gstAmount;
    const totalSumInsured = submittedAddresses.reduce((total, address) => total + (address.totalSumInsured || 0), 0);

    const organizedData = submittedAddresses.map((address, addressIndex) => {
      const sections = {};
      Object.entries(address.packageComponentValues || {}).forEach(([sectionName, componentValues]) => {
        const components = [];
        Object.entries(componentValues).forEach(([component, value]) => {
          if (!component.endsWith('_premium') && !component.endsWith('_terror')) {
            components.push({
              component,
              sumInsured: Number(value) || 0,
              premium: Number(componentValues[`${component}_premium`]) || 0,
              terror: Number(componentValues[`${component}_terror`]) || 0
            });
          }
        });
        if (components.length > 0) {
          sections[sectionName] = components;
        }
      });

      return {
        addressIndex: addressIndex + 1,
        location: `${address.addressLine1}, ${address.districtCity}, ${address.state}`,
        sections
      };
    }).filter(data => Object.keys(data.sections).length > 0);

    return (
      <div className="preview-container">
        <div className="premium-summary-section">
          <button 
            className="premium-breakup-btn"
            onClick={() => setShowPremiumBreakup(true)}
          >
            Premium Breakup
          </button>
          {title === "CPM" && (
            <div className="summary-item">
              <span className="summary-label">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={handleCheckboxChange}
                  className="ml-2"
                />Marine Cover Required
              </span>
              <span className="summary-value">
                ₹{new Intl.NumberFormat('en-IN').format(marinePre.toFixed(2))}
              </span>
            </div>
          )}
          
          {title === "CPM" && isChecked && (
            <>
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

              <div className="summary-item">
                <span className="summary-label">New Machinery or Old Machinery:</span>
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
            </>
          )}

          <div className="premium-summary">
            <div className="summary-item">
              <span className="summary-label">Total Premium:</span>
              <span className="summary-value">
                ₹{new Intl.NumberFormat('en-IN').format(totalPremium.toFixed(2))}
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Total Addon Premium(if Applicable):</span>
              <span className="summary-value">
                ₹{new Intl.NumberFormat('en-IN').format(totalAddonPremium.toFixed(2))}
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">GST (18%):</span>
              <span className="summary-value">
                ₹{new Intl.NumberFormat('en-IN').format(gstAmount.toFixed(2))}
              </span>
            </div>

            <div className="summary-item gross-premium">
              <span className="summary-label">Gross Premium:</span>
              <span className="summary-value">
                ₹{new Intl.NumberFormat('en-IN').format(grossPremium.toFixed(2))}
              </span>
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

        {/* Risk Inspection Popup */}
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

        {/* Retention Breakdown Popup */}
        <RetentionBreakdownPopup 
          isOpen={showRetentionPopup} 
          onClose={() => setShowRetentionPopup(false)}
          onContinue={() => {
            setShowRetentionPopup(false);
            continueWithSave();
          }}
          sumInsured={title === "IAR" ? topLocationSI : totalSumInsured}
          productName={title}
        />
      </div>
    );
  };

  const validateCoInsuranceShare = (coinsurers) => {
    if (!coinsurers || coinsurers.length === 0) return true;
    
    const totalShare = coinsurers.reduce((sum, insurer) => {
      return sum + (Number(insurer.sharePercentage) || 0);
    }, 0);

    return totalShare <= 100;
  };

  const validateLeaderCount = (coinsurers) => {
    if (!coinsurers || coinsurers.length === 0) return true;
    
    const leaderCount = coinsurers.filter(insurer => 
      insurer.leaderFollower === 'Leader'
    ).length;

    return leaderCount <= 1;
  };

  const handleCoInsuranceChange = (index, field, value) => {
    const updatedCoinsurers = [...(formData['coinsurers'] || [])];
    
    if (field === 'leaderFollower' && value === 'Leader') {
      if (!validateLeaderCount([...updatedCoinsurers.filter((_, i) => i !== index), { leaderFollower: 'Leader' }])) {
        alert('Only one leader is allowed in co-insurance');
        return;
      }
    }

    if (field === 'sharePercentage') {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        alert('Please enter a valid percentage');
        return;
      }

      const newTotal = updatedCoinsurers.reduce((sum, insurer, i) => {
        return sum + (i === index ? numValue : (Number(insurer.sharePercentage) || 0));
      }, 0);

      if (newTotal > 100) {
        alert('Total share percentage cannot exceed 100%');
        return;
      }
    }

    updatedCoinsurers[index] = {
      ...updatedCoinsurers[index],
      [field]: value
    };

    handleChange({
      target: {
        name: 'coinsurers',
        value: updatedCoinsurers
      }
    });
  };

  const handleCoInsuranceChecked = (e) => {
    if (e.target.checked) {
      handleChange({
        target: {
          name: 'hasCoInsurance',
          value: true
        }
      });
      handleChange({
        target: {
          name: 'coinsurers',
          value: [
            { id: 1, companyName: '', code: '', sharePercentage: '', leaderFollower: 'Leader' },
            { id: 2, companyName: '', code: '', sharePercentage: '', leaderFollower: 'Follower' }
          ]
        }
      });
    } else {
      handleChange({
        target: {
          name: 'hasCoInsurance',
          value: false
        }
      });
      handleChange({
        target: {
          name: 'coinsurers',
          value: []
        }
      });
    }
  };


  return (
    <div className="general-details">
        <>
          {parsedWorkflows.length > 0 && (
            <>
              {workflow > 1 && (
                <div className="stepper">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className={`step ${index === currentStep ? 'active' : ''}`}
                      onClick={() => handleStepClick(index)}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              )}
              {currentStep === 1 && (
                <div className="general-section">
                  <h3>Risk Address</h3>
                  <div className="general-form-group-wrapper">
                    <div className="general-form-group">
                      <button 
                        className="general-popup-button" 
                        type="button" 
                        onClick={() => {
                          setShowAddressPopup(true);
                          setPopupFormData({});
                        }}
                      >
                        Add Address
                      </button>
                      <Popup
                        isOpen={showAddressPopup}
                        onClose={() => setShowAddressPopup(false)}
                      >
                        <div className="address-popup-content">
                          <h2>Add Risk Address</h2>
                          {parsedWorkflows[1]?.sections
                            .filter(section => section.name === "Address Information")
                            .map(section => (
                              <div key={section.name} className="popup-section">
                                {section.fields.map(field => renderField(field, section.name, true))}
                              </div>
                            ))
                          }
                          <div className="popup-buttons">
                            <button onClick={() => setShowAddressPopup(false)}>Cancel</button>
                            <button onClick={handleSaveAddress}>Save</button>
                          </div>
                        </div>
                      </Popup>
                      <div className="address-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Risk Address</th>
                            {/* Dynamic columns based on all sections except Address Information */}
                            {parsedWorkflows[1]?.sections
                              .filter(section => section.name !== "Address Information")
                              .map(section => (
                                // For each section, create columns for its fields
                                section.fields.map(field => (
                                  <th key={`${section.name}-${field.label}`}>{field.label}</th>
                                ))
                              ))}
                            {/* Section columns */}
                            {(isEditing || isMultiEquipment ? productpackages : selectedPackages).map(pkg => (
                              <th key={pkg}>{getSectionDisplayName(pkg)}</th>
                            ))}
                            <th>Covers</th>
                            <th>Premium</th>
                            <th>Age of the Build</th>
                            <th>kutcha/Non Kutcha</th>
                            <th>Basement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submittedAddresses.map((address, index) => (
                            <tr key={index}>
                              {/* Address Column */}
                              <td>
                                {address.addressLine1}, {address.districtCity}, {address.state}, {address.pincode}
                                <button onClick={() => handleEditAddressClick(index)}>Edit</button>
                              </td>
                              
                              {/* Dynamic field columns */}
                              {parsedWorkflows[1]?.sections
                                .filter(section => section.name !== "Address Information")
                                .map(section => (
                                  section.fields.map(field => (
                                    <td key={`${section.name}-${field.label}`}>
                                      {field.label === 'Equipment Type' ? (
                                        <Select
                                          isMulti={isMultiEquipment}
                                          options={equipmentOptions.map((label) => ({ 
                                            label, 
                                            value: label.toLowerCase() 
                                          }))}
                                          onChange={(selectedOption) => {
                                            if (isMultiEquipment) {
                                              handleEquipmentChange(selectedOption);
                                            } else {
                                              const singleOptionAsArray = selectedOption ? [selectedOption] : [];
                                              handleEquipmentChange(singleOptionAsArray);
                                              handleTableFieldChange(index, field.label, selectedOption.value);
                                            }
                                          }}
                                          value={
                                            isMultiEquipment 
                                              ? address['Equipment Type'] || []
                                              : equipmentOptions.map((label) => ({ 
                                                  label, 
                                                  value: label.toLowerCase() 
                                                }))
                                                .find(option => {
                                                  const currentValue = address[field.label];
                                                  if (Array.isArray(currentValue)) {
                                                    return currentValue.length > 0 ? 
                                                      option.value === currentValue[0].value : false;
                                                  }
                                                  return option.value === currentValue?.toLowerCase();
                                                })
                                          }
                                        />
                                      ) : field.label === 'Occupancy Type' ? (
                                        <Select
                                          isMulti={false}
                                          options={occupancyOptions.map((label) => ({ 
                                            label, 
                                            value: label.toLowerCase() 
                                          }))}
                                          onChange={(selectedOption) => 
                                            handleTableFieldChange(index, field.label, selectedOption.value)
                                          }
                                          value={
                                            occupancyOptions.map((label) => ({ 
                                              label, 
                                              value: label.toLowerCase() 
                                            }))
                                            .find(option => 
                                              option.value === address[field.label]?.toLowerCase()
                                            )
                                          }
                                        />
                                      ) : field.type === 'checkbox' ? (
                                        <input 
                                          type="checkbox" 
                                          checked={address[field.label]} 
                                          onChange={(e) => 
                                            handleTableFieldChange(index, field.label, e.target.checked)
                                          }
                                        />
                                      ) : field.type === 'dropdown' ? (
                                        <select 
                                          value={address[field.label] || ''} 
                                          onChange={(e) => 
                                            handleTableFieldChange(index, field.label, e.target.value)
                                          }
                                        >
                                          <option value="">Select</option>
                                          {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input 
                                          type={field.type}
                                          value={address[field.label] || ''}
                                          onChange={(e) => 
                                            handleTableFieldChange(index, field.label, e.target.value)
                                          }
                                        />
                                      )}
                                    </td>
                                  ))
                                ))}

                                {/* Section Columns with Components */}
                                {(isEditing || isMultiEquipment ? productpackages : selectedPackages).map(pkg => (
                                  <td key={pkg} className="section-cell">
                                    {sections
                                      .filter(section => section.section_reference_name === pkg)
                                      .flatMap(section => section.components.split(', '))
                                      .map(component => (
                                        <div key={component} className="component-input">
                                          <label>{component}</label>
                                          <input
                                            type="number"
                                            value={address.packageComponentValues[pkg]?.[component] || ''}
                                            onClick={() => {
                                              // Set the selected package when clicking on any input field
                                              if (isMultiEquipment) {
                                                const pack = "Contractor's Plant and Machinery";
                                                setSelectedPackage(pack);
                                                setActualPackage(pkg);
                                              } else {
                                                setSelectedPackage(pkg);
                                              }
                                              setFocusedComponent(component);
                                              if (!address.componentCovers[pkg]) {
                                                const section = sections.find(section => 
                                                  section.section_reference_name === (isMultiEquipment ? pack : pkg)
                                                );
                                                if (section) {
                                                  const allCovers = section.covers.split(', ');
                                                  const mandatoryCovers = section.mandatory_cover?.split(', ') || [];
                                                  
                                                  setSubmittedAddresses(prevAddresses => {
                                                    const newAddresses = [...prevAddresses];
                                                    const addressIndex = prevAddresses.indexOf(address);
                                                    
                                                    if (!newAddresses[addressIndex].componentCovers) {
                                                      newAddresses[addressIndex].componentCovers = {};
                                                    }
                                                    
                                                    newAddresses[addressIndex].componentCovers[pkg] = allCovers;
                                                    
                                                    // Initialize global covers
                                                    const initialGlobalCovers = {};
                                                    allCovers.forEach(cover => {
                                                      initialGlobalCovers[cover] = true;
                                                    });
                                                    setGlobalCovers(initialGlobalCovers);
                                                    
                                                    return newAddresses;
                                                  });
                                                }
                                              }
                                            }}
                                            onChange={(e) => {
                                              // Set the selected package if not already set
                                              if (!selectedPackage) {
                                                if (isMultiEquipment) {
                                                  const pack = "Contractor's Plant and Machinery";
                                                  setSelectedPackage(pack);
                                                  setActualPackage(pkg);
                                                } else {
                                                  setSelectedPackage(pkg);
                                                }
                                                setFocusedComponent(component);
                                              }
                                              handleComponentValueChange(pkg, component, e.target.value);
                                            }}
                                          />
                                        </div>
                                      ))}
                                  </td>
                                ))}

                                {/* Covers Column */}
                                <td className="covers-cell">
                                  {(() => {
                                    const section = sections.find(section => 
                                      section.section_reference_name === selectedPackage
                                    );
                                    
                                    if (!section) return null;

                                    const mandatoryCovers = section.mandatory_cover?.split(', ') || [];
                                    const enterableRates = section.enterable_rate?.split(', ') || [];

                                    return section.covers.split(', ').map(cover => {
                                      const isMandatory = mandatoryCovers.includes(cover);
                                      const isEnterableRate = enterableRates.includes(cover);
                                      const isChecked = isMandatory || address.componentCovers[selectedPackage]?.includes(cover);
                                      
                                      let rate = '0';
                                      let minRate = '0';

                                      // Get rate based on rate type
                                      if (section.rate_type === 'direct') {
                                        rate = section.direct_rate.split(', ')
                                          .find(r => r.startsWith(`${cover}-`))?.split('-')[1] || '0';
                                        minRate = section.direct_min_rate.split(', ')
                                          .find(r => r.startsWith(`${cover}-`))?.split('-')[1] || '0';
                                      } else if (section.rate_type === 'occupancy' || section.rate_type === 'equipments') {
                                        const type = popupFormData['Occupancy Type'] || popupFormData['Equipment Type'];
                                        const selectedOccupancy = occupancyData.find(
                                          occ => occ.code == type?.split('-')[0]
                                        );
                                        const selectedEquipment = equipmentData.find(
                                          eq => eq.code == type?.split('-')[0]
                                        );

                                        const occupancySectionRate = section.occupancy_rate.split(', ');
                                        switch (cover) {
                                          case 'Basic':
                                            rate = selectedOccupancy?.IIB_basic || selectedEquipment?.basic || '0';
                                            break;
                                          case 'STFI Cover':
                                            rate = selectedOccupancy?.IIB_stfi || selectedEquipment?.stfi || '0';
                                            break;
                                          case 'Earthquake':
                                            const zone = address.zone || 'I';
                                            const zoneNumber = getZoneNumber(zone);
                                            rate = selectedOccupancy?.[`IIB_eq${zoneNumber}`] || 
                                                  selectedEquipment?.[`eq${zoneNumber}`] || '0';
                                            break;
                                          case 'Terrorism':
                                            rate = selectedOccupancy?.IIB_terrorism || 
                                                  selectedEquipment?.terrorism || '0';
                                            break;
                                          default:
                                            rate = '0';
                                        }
                                      }

                                      // Check for auto rate calculation from cover_rate_types
                                      const coverRateTypes = JSON.parse(section.cover_rate_types || '[]');
                                      const autoRateCover = coverRateTypes.find(rt => 
                                        rt.cover === cover && rt.rateType === 'Auto'
                                      );

                                      if (autoRateCover) {
                                        const componentRates = autoRateCover.coverComponents.map(compCover => {
                                          if (compCover === 'Basic' || compCover === 'STFI Cover' || compCover === 'Earthquake' || compCover === 'Terrorism') {
                                            const type = address["Occupancy Type"] || address['Equipment Type'];
                                            const selectedOccupancy = occupancyData.find(
                                              occ => occ.code == type?.split('-')[0]
                                            );
                                            const selectedEquipment = equipmentData.find(
                                              eq => eq.code == type?.split('-')[0]
                                            );
                                          
                                            switch (compCover) {
                                              case 'Basic':
                                                return selectedOccupancy?.IIB_basic || selectedEquipment?.basic || 0;
                                              case 'STFI Cover':
                                                return selectedOccupancy?.IIB_stfi || selectedEquipment?.stfi || 0;
                                              case 'Earthquake':
                                                const zone = address.zone || 'I';
                                                const zoneNumber = getZoneNumber(zone);
                                                
                                                // Get zone factor if applicable
                                                const factor = riskFactor
                                                  .filter(factor => {
                                                    const requiredSections = isEditing || isMultiEquipment ? productpackages : selectedPackages;
                                                    return factor.section_name.split(', ').some(section => 
                                                      requiredSections.includes(section)
                                                    );
                                                  })
                                                  .find(factor => factor.type === 'Zone');
                                          
                                                let zoneRate = selectedOccupancy?.[`IIB_eq${zoneNumber}`] || 
                                                              selectedEquipment?.[`eq${zoneNumber}`] || 0;
                                          
                                                // Apply zone factor if exists
                                                if (factor?.type === 'Zone') {
                                                  const zoneValues = JSON.parse(factor.zone);
                                                  const currentZone = getZone(zone);
                                                  const zoneFactor = 1 + (parseFloat(zoneValues[currentZone])/100) || 1;
                                                  zoneRate *= zoneFactor;
                                                }
                                                return zoneRate;
                                          
                                              case 'Terrorism':
                                                return selectedOccupancy?.IIB_terrorism || 
                                                      selectedEquipment?.terrorism || 0;
                                              default:
                                                return 0;
                                            }
                                          } else {
                                            // For non-standard covers, get rate from direct_rate
                                            return parseFloat(section.direct_rate.split(', ')
                                              .find(rate => rate.startsWith(`${compCover}-`))?.split('-')[1] || 0);
                                          }
                                        });
                                        rate = componentRates.reduce((sum, r) => sum + parseFloat(r), 0).toString();
                                      }

                                      return (
                                        <div key={cover} className="cover-item">
                                          <div className="cover-header">
                                            <div className="cover-checkbox">
                                              <input
                                                type="checkbox"
                                                defaultChecked={isChecked || globalCovers[cover] || false}
                                                disabled={isMandatory}
                                                onChange={(e) => handleCoverChange(focusedComponent, cover, e.target.checked)}
                                              />
                                              <label>{cover}</label>
                                            </div>
                                            <div className="cover-rates">
                                              Rate: {isEnterableRate ? (
                                                <input
                                                  type="number"
                                                  step="0.0001"
                                                  value={address.updatedRates?.[`${selectedPackage}-${cover}`] || rate}
                                                  onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    const regex = /^\d*\.?\d{0,4}$/;
                                                    if (regex.test(newValue) || newValue === '') {
                                                      handleTableFieldChange(address, 'updatedRates', {
                                                        ...address.updatedRates,
                                                        [`${selectedPackage}-${cover}`]: newValue
                                                      });
                                                    }
                                                  }}
                                                  onBlur={(e) => {
                                                    const newRate = e.target.value;
                                                    if (newRate < minRate) {
                                                      alert(`The rate for ${cover} cannot be below the minimum rate of ${minRate}.`);
                                                      handleTableFieldChange(address, 'updatedRates', {
                                                        ...address.updatedRates,
                                                        [`${selectedPackage}-${cover}`]: minRate
                                                      });
                                                    }
                                                  }}
                                                />
                                              ) : (
                                                Number(rate).toFixed(4).replace(/\.?0+$/, '')
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </td>

                                {/* Premium Column */}
                                <td className="premium-cell">
                                  ₹{new Intl.NumberFormat('en-IN').format(address.premium || 0)}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    value={address.ageOfBuilding || ''}
                                    onChange={e => handleTableFieldChange(index, 'ageOfBuilding', e.target.value)}
                                    placeholder="Years"
                                  />
                                </td>
                                {/* Kutcha/Non Kutcha - dropdown */}
                                <td>
                                  <div className="kutcha-container">
                                    <select
                                      value={address.kutchaType || ''}
                                      onChange={e => {
                                        handleTableFieldChange(index, 'kutchaType', e.target.value);
                                        // Reset kutcha value when switching to non kutcha
                                        if (e.target.value === 'non kutcha') {
                                          handleTableFieldChange(index, 'kutchaValue', '');
                                          // Remove loading when switching to non kutcha
                                          handleTableFieldChange(index, 'kutchaLoading', 0);
                                        } else {
                                          // Apply 4% loading for kutcha/partially kutcha
                                          handleTableFieldChange(index, 'kutchaLoading', 0.04);
                                        }
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="kutcha">Kutcha</option>
                                      <option value="non kutcha">Non Kutcha</option>
                                      <option value="partially kutcha">Partially Kutcha</option>
                                    </select>
                                    
                                    {(address.kutchaType === 'kutcha' || address.kutchaType === 'partially kutcha') && (
                                      <div className="kutcha-details">
                                        <label>Value:</label>
                                        <input
                                          type="number"
                                          value={address.kutchaValue || ''}
                                          onChange={e => {
                                            handleTableFieldChange(index, 'kutchaValue', e.target.value);
                                            // Recalculate premium with loading
                                            const loadingAmount = e.target.value * 0.04;
                                            handleTableFieldChange(index, 'kutchaLoadingAmount', loadingAmount);
                                          }}
                                          placeholder="Kutcha Value"
                                          className="kutcha-value"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {/* Basement - dropdown */}
                                <td>
                                  <select
                                    value={address.basementType || ''}
                                    onChange={e => handleTableFieldChange(index, 'basementType', e.target.value)}
                                  >
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                  </select>
                                  {address.basementType === 'Yes' && (
                                    <div className="basement-details">
                                      <label>Value:</label>
                                      <input
                                        type="number"
                                        value={address.basementValue || ''}
                                        onChange={e => handleTableFieldChange(index, 'basementValue', e.target.value)}
                                        placeholder="Value"
                                        className="basement-value"
                                      />
                                      <label>Description:</label>
                                      <input
                                        type="text"
                                        value={address.basementDescription || ''}
                                        onChange={e => {
                                          // Limit to 30 characters
                                          if (e.target.value.length <= 30) {
                                            handleTableFieldChange(index, 'basementDescription', e.target.value);
                                          }
                                        }}
                                        maxLength={30}
                                        placeholder="Description (max 30 chars)"
                                        className="basement-description"
                                      />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                SumInsureDetails()
              )}
              {currentStep === 3 && (
                addonsDetails()
              )}
              {currentStep === 4 && (
                summaryDetails()
              )}
              { currentStep === 0 && parsedWorkflows[0]?.sections?.map((section) => (
                <div key={section.name} className="general-section">
                  <h3>{section.name}</h3>
                  <div className="general-form-group-wrapper">
                    {section.fields.map((field) => renderField(field, section.name))}
                  </div>
                </div>
              ))}
              { currentStep === 0 && (() => {
                const parsedSegments = JSON.parse(userSegment);
                const segmentKeys = Object.keys(parsedSegments);
                
                // Hide the section if there's only one segment with one division
                if (segmentKeys.length === 1 && parsedSegments[segmentKeys[0]].length === 1) {
                  // Automatically set the values in formData
                  if (!formData['Segment'] || !formData['Division']) {
                    setFormData(prev => ({
                      ...prev,
                      'Segment': segmentKeys[0],
                      'Division': parsedSegments[segmentKeys[0]][0]
                    }));
                  }
                  return null;
                }

                return (
                  <>
                  <div key="claim-history" className="general-section">
                    <h3>{title === 'IAR'? 'Claim History in Last 3 Years' : 'Claim History in Last 5 Years'}</h3>
                    <div className="general-form-group-wrapper">
                      <div className="general-form-group">
                        <div className="claim-checkbox-container">
                          <input
                            type="checkbox"
                            id="hasClaimHistory"
                            checked={formData['hasClaimHistory'] || false}
                            onChange={(e) => {
                              handleChange({
                                target: {
                                  name: 'hasClaimHistory',
                                  value: e.target.checked
                                }
                              });
                            }}
                            className="claim-checkbox"
                          />
                          <label htmlFor="hasClaimHistory">Has Claim History</label>
                        </div>
                      </div>
                    </div>

                    {formData['hasClaimHistory'] && (
                      <div className="claim-table-container">
                        <table className="claim-table">
                          <thead>
                            <tr>
                              <th>Nature of Loss</th>
                              <th>Date of Loss</th>
                              <th>Item Damaged</th>
                              <th>Amount of Loss</th>
                              <th>Post Loss Measures(If any)</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(formData['claims'] || [{ 
                              id: 1, 
                              natureOfLoss: '', 
                              dateOfLoss: '', 
                              itemDamaged: '', 
                              amountOfLoss: '', 
                              postLossMeasures: '' 
                            }]).map((claim, index) => (
                              <tr key={claim.id || index}>
                                <td>
                                  <input
                                    type="text"
                                    value={claim.natureOfLoss || ''}
                                    onChange={(e) => {
                                      const updatedClaims = [...(formData['claims'] || [])];
                                      updatedClaims[index] = {
                                        ...updatedClaims[index],
                                        natureOfLoss: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'claims',
                                          value: updatedClaims
                                        }
                                      });
                                    }}
                                    className="claim-input"
                                    placeholder="Nature of Loss"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    value={claim.dateOfLoss || ''}
                                    onChange={(e) => {
                                      const updatedClaims = [...(formData['claims'] || [])];
                                      updatedClaims[index] = {
                                        ...updatedClaims[index],
                                        dateOfLoss: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'claims',
                                          value: updatedClaims
                                        }
                                      });
                                    }}
                                    className="claim-input"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={claim.itemDamaged || ''}
                                    onChange={(e) => {
                                      const updatedClaims = [...(formData['claims'] || [])];
                                      updatedClaims[index] = {
                                        ...updatedClaims[index],
                                        itemDamaged: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'claims',
                                          value: updatedClaims
                                        }
                                      });
                                    }}
                                    className="claim-input"
                                    placeholder="Item Damaged"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={claim.amountOfLoss || ''}
                                    onChange={(e) => {
                                      const updatedClaims = [...(formData['claims'] || [])];
                                      updatedClaims[index] = {
                                        ...updatedClaims[index],
                                        amountOfLoss: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'claims',
                                          value: updatedClaims
                                        }
                                      });
                                    }}
                                    className="claim-input"
                                    placeholder="Amount"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={claim.postLossMeasures || ''}
                                    onChange={(e) => {
                                      const updatedClaims = [...(formData['claims'] || [])];
                                      updatedClaims[index] = {
                                        ...updatedClaims[index],
                                        postLossMeasures: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'claims',
                                          value: updatedClaims
                                        }
                                      });
                                    }}
                                    className="claim-input"
                                    placeholder="Post Loss Measures"
                                  />
                                </td>
                                <td className="claim-action-cell">
                                  {(formData['claims'] || []).length > 1 && (
                                    <button 
                                      onClick={() => {
                                        const updatedClaims = (formData['claims'] || []).filter((_, i) => i !== index);
                                        handleChange({
                                          target: {
                                            name: 'claims',
                                            value: updatedClaims
                                          }
                                        });
                                      }}
                                      className="claim-remove-btn"
                                      type="button"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            <tr className="total-row">
                              <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                Total Amount:
                              </td>
                              <td colSpan="2" style={{ fontWeight: 'bold' }}>
                                ₹{new Intl.NumberFormat('en-IN').format(
                                  (formData['claims'] || []).reduce((total, claim) => 
                                    total + (Number(claim.amountOfLoss) || 0), 0
                                  )
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="claim-add-btn-container">
                          <button
                            type="button"
                            onClick={() => {
                              const currentClaims = formData['claims'] || [];
                              const newId = currentClaims.length > 0 ? 
                                Math.max(...currentClaims.map(c => c.id || 0)) + 1 : 1;
                              handleChange({
                                target: {
                                  name: 'claims',
                                  value: [...currentClaims, { 
                                    id: newId, 
                                    natureOfLoss: '', 
                                    dateOfLoss: '', 
                                    itemDamaged: '', 
                                    amountOfLoss: '', 
                                    postLossMeasures: '' 
                                  }]
                                }
                              });
                            }}
                            className="claim-add-btn"
                          >
                            Add Claim
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div key="financier-details" className="general-section">
                    <h3>Financier Details</h3>
                    <div className="general-form-group-wrapper">
                      <div className="general-form-group">
                        <div className="financier-checkbox-container">
                          <input
                            type="checkbox"
                            id="hasFinancier"
                            checked={formData['hasFinancier'] || false}
                            onChange={(e) => {
                              handleChange({
                                target: {
                                  name: 'hasFinancier',
                                  value: e.target.checked
                                }
                              });
                            }}
                            className="financier-checkbox"
                          />
                          <label htmlFor="hasFinancier">Has Financier</label>
                        </div>
                      </div>
                    </div>

                    {formData['hasFinancier'] && (
                      <div className="financier-table-container">
                        <table className="financier-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Branch Address</th>
                              <th>Action</th>
                            </tr>
                          </thead>  
                          <tbody>
                            {(formData['financiers'] || [{ id: 1, name: '', branchAddress: '' }]).map((financier, index) => (
                              <tr key={financier.id || index}>
                                <td>
                                  <input
                                    type="text"
                                    value={financier.name || ''}
                                    onChange={(e) => {
                                      const updatedFinanciers = [...(formData['financiers'] || [{ id: 1, name: '', branchAddress: '' }])];
                                      updatedFinanciers[index] = {
                                        ...updatedFinanciers[index],
                                        name: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'financiers',
                                          value: updatedFinanciers
                                        }
                                      });
                                    }}
                                    className="financier-input"
                                    placeholder="Financier Name"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={financier.branchAddress || ''}
                                    onChange={(e) => {
                                      const updatedFinanciers = [...(formData['financiers'] || [{ id: 1, name: '', branchAddress: '' }])];
                                      updatedFinanciers[index] = {
                                        ...updatedFinanciers[index],
                                        branchAddress: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'financiers',
                                          value: updatedFinanciers
                                        }
                                      });
                                    }}
                                    className="financier-input"
                                    placeholder="Branch Address"
                                  />
                                </td>
                                <td className="financier-action-cell">
                                  {(formData['financiers'] || []).length > 1 && (
                                    <button 
                                      onClick={() => {
                                        const updatedFinanciers = (formData['financiers'] || []).filter((_, i) => i !== index);
                                        handleChange({
                                          target: {
                                            name: 'financiers',
                                            value: updatedFinanciers
                                          }
                                        });
                                      }}
                                      className="financier-remove-btn"
                                      type="button"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="financier-add-btn-container">
                          <button
                            type="button"
                            onClick={() => {
                              const currentFinanciers = formData['financiers'] || [{ id: 1, name: '', branchAddress: '' }];
                              const newId = currentFinanciers.length > 0 ? 
                                Math.max(...currentFinanciers.map(f => f.id || 0)) + 1 : 1;
                              handleChange({
                                target: {
                                  name: 'financiers',
                                  value: [...currentFinanciers, { id: newId, name: '', branchAddress: '' }]
                                }
                              });
                            }}
                            className="financier-add-btn"
                          >
                            Add Financier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div key="co-insurance-details" className="general-section">
                    <h3>Co-Insurance Details</h3>
                    <div className="general-form-group-wrapper">
                      <div className="general-form-group">
                        <div className="coinsurance-checkbox-container">
                          <input
                            type="checkbox"
                            id="hasCoInsurance"
                            checked={formData['hasCoInsurance'] || false}
                            onChange={handleCoInsuranceChecked}
                            className="coinsurance-checkbox"
                          />
                          <label htmlFor="hasCoInsurance">Has Co-Insurance</label>
                        </div>
                      </div>
                    </div>

                    {formData['hasCoInsurance'] && (
                      <div className="coinsurance-table-container">
                        <table className="coinsurance-table">
                          <thead>
                            <tr>
                              <th>Company Name</th>
                              <th>Code</th>
                              <th>Share %</th>
                              <th>Leader/Follower</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(formData['coinsurers'] || []).map((insurer, index) => (
                              <tr key={insurer.id || index}>
                                <td>
                                  <input
                                    type="text"
                                    value={insurer.companyName || ''}
                                    onChange={(e) => {
                                      const updatedCoinsurers = [...(formData['coinsurers'] || [])];
                                      updatedCoinsurers[index] = {
                                        ...updatedCoinsurers[index],
                                        companyName: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'coinsurers',
                                          value: updatedCoinsurers
                                        }
                                      });
                                    }}
                                    className="coinsurance-input"
                                    placeholder="Company Name"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={insurer.code || ''}
                                    onChange={(e) => {
                                      const updatedCoinsurers = [...(formData['coinsurers'] || [])];
                                      updatedCoinsurers[index] = {
                                        ...updatedCoinsurers[index],
                                        code: e.target.value
                                      };
                                      handleChange({
                                        target: {
                                          name: 'coinsurers',
                                          value: updatedCoinsurers
                                        }
                                      });
                                    }}
                                    className="coinsurance-input"
                                    placeholder="Code"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={insurer.sharePercentage || ''}
                                    onChange={(e) => handleCoInsuranceChange(index, 'sharePercentage', e.target.value)}
                                    className="coinsurance-input"
                                    placeholder="Share %"
                                    min="0"
                                    max="100"
                                  />
                                </td>
                                <td>
                                  <select
                                    value={insurer.leaderFollower || ''}
                                    onChange={(e) => handleCoInsuranceChange(index, 'leaderFollower', e.target.value)}
                                    className="coinsurance-select"
                                    disabled={index === 0} // First row is always Leader
                                  >
                                    <option value="Leader">Leader</option>
                                    <option value="Follower">Follower</option>
                                  </select>
                                </td>
                                <td className="coinsurance-action-cell">
                                  {formData['coinsurers'].length > 2 && ( // Only show remove button if more than 2 rows
                                    <button 
                                      onClick={() => {
                                        const updatedCoinsurers = formData['coinsurers'].filter((_, i) => i !== index);
                                        handleChange({
                                          target: {
                                            name: 'coinsurers',
                                            value: updatedCoinsurers
                                          }
                                        });
                                      }}
                                      className="coinsurance-remove-btn"
                                      type="button"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="coinsurance-add-btn-container">
                          <button
                            type="button"
                            onClick={() => {
                              const currentCoinsurers = formData['coinsurers'] || [];
                              const newId = currentCoinsurers.length > 0 ? 
                                Math.max(...currentCoinsurers.map(f => f.id || 0)) + 1 : 1;
                              handleChange({
                                target: {
                                  name: 'coinsurers',
                                  value: [...currentCoinsurers, { 
                                    id: newId, 
                                    companyName: '', 
                                    code: '', 
                                    sharePercentage: '', 
                                    leaderFollower: 'Follower' 
                                  }]
                                }
                              });
                            }}
                            className="coinsurance-add-btn"
                          >
                            Add Co-Insurer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div key="distribution-channel" className="general-section">
                    <h3>Distribution Channel</h3>
                    <div className="general-form-group-wrapper">
                      <div className="general-form-group">
                        <label htmlFor="distributionChannel">Business Segment</label>
                        <select
                          id="segment"
                          name="Segment"
                          value={formData['Segment'] || ''}
                          onChange={(e) => {
                            const selectedSegment = e.target.value;
                            handleChange(e);
                            setDivisionOptions(parsedSegments[selectedSegment] || []);
                          }}
                          required
                        >
                          <option value="">Select Segment</option>
                          {segmentKeys.map((segment, index) => (
                            <option key={index} value={segment}>
                              {segment}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="general-form-group">
                        <label htmlFor="distributionChannel">Business Division</label>
                        <select
                          id="division"
                          name="Division"
                          value={formData['Division'] || ''}
                          onChange={handleChange}
                          required
                          disabled={!formData['Segment']}
                        >
                          <option value="">Select Division</option>
                          {divisionOptions.map((division, index) => (
                            <option key={index} value={division}>
                              {division}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  </>
                );
              })()}
            </>
          )}
          <div className="workflow-navigation-buttons">
            <div className="left-button">
              {currentStep > 0 && <button className='general-previous-button' onClick={handlePrevious}>Previous</button>}
            </div>
            <div className="center-button">
              <button className="save-draft-button" onClick={handleSaveDraft}>
                Save as Draft
              </button>
            </div>
            <div className="right-button">
              <button className='general-next-button' onClick={handleNext}>Next</button>
            </div>
          </div>
        </>
    </div>
  );
};

export default GeneralDetails;