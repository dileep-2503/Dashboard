import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import '../styles/Section.css';
import '../styles/SectionDetails.css';
import xMark from '../assets/x-mark.svg';
import { fetchOccupancyRate, submitProductData, updateSection, fetchSection, fetchComponent, fetchSectionList, fetchUserLevel } from '../api/api';
import SectionDetails from './SectionDetails';

const Section = (user) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    label: '',
    referenceName: '',
    component: '',
    rate: '',
    excess: '',
    occupancyRate: '',
    minRate: false,
    cover: '',
    isRateEnterable: false,
    minOccupancyRate: '',
    equipmentRate: '',
    minEquipmentRate: '',
    isFloaterPolicy: false,
    isMaxSumInsured: false,
    maxSumInsuredData: {
      type: '',
      section: '',
      components: [],
      sumInsuredPercentage: '0',
      sumInsuredValue: '',
      numberOfPerson: '',
      componentData: {}
    }
  });
  const [componentsList, setComponentsList] = useState([]);
  const [floaterComponents, setFloaterComponents] = useState([]);
  const [maxSumInsuredTypes] = useState([
    { value: 'Direct', label: 'Direct' },
    { value: 'Section Based', label: 'Section Based' },
    { value: 'Person Based', label: 'Person Based' }
  ]);
  const [coversList, setCoversList] = useState([]);
  const [coverRates, setCoverRates] = useState([]);
  const [occupancyRates, setOccupancyRates] = useState([]);
  const [minCoverRates, setMinCoverRates] = useState([]);
  const [applyMinRates, setApplyMinRates] = useState([]);
  const [isRateEnterables, setIsRateEnterables] = useState([]);
  const [mandatoryCovers, setMandatoryCovers] = useState([]);
  const [editingMinCovers, setEditingMinCovers] = useState([]);
  const [editingCovers, setEditingCovers] = useState([]);
  const [editingCoverIndex, setEditingCoverIndex] = useState(null);
  const [componentOptions, setComponentOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [wordings, setWordings] = useState([]);
  const [currentWording, setCurrentWording] = useState('');
  const [wordingContents, setWordingContents] = useState({});
  const [coverRateTypes, setCoverRateTypes] = useState([]);
  const [componentTableData, setComponentTableData] = useState([]);
  const [sumInsuredTypes, setSumInsuredTypes] = useState([]);
  const [sectionsData, setSectionsData] = useState([]);
  const [sectionComponentsMap, setSectionComponentsMap] = useState({});
  const [submittedSections, setSubmittedSections] = useState([]);
  const [showForm, setShowForm] = useState(location.state?.showForm ?? true);
  const [isEditing, setIsEditing] = useState(location.state?.editMode ?? false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [coverSections, setCoverSections] = useState([]);
  const [coverSelectedCovers, setCoverSelectedCovers] = useState([]);
  const [deviationMatrix, setDeviationMatrix] = useState([]);
  const [userLevels, setUserLevels] = useState([]);
  const [deviationSettings, setDeviationSettings] = useState([]);
  const deviationOptions = [
    { value: 'Sum Insured', label: 'Sum Insured' },
    { value: 'Rate', label: 'Rate' },
    { value: 'Discount', label: 'Discount' },
    { value: 'YOM', label: 'YOM' }
  ];

  // Handle edit section
  const handleEditSection = (section) => {
    setIsEditing(true);
    setShowForm(true);
    setEditingSectionId(section.section_id);

    let maxSumInsuredData = {
      type: '',
      section: '',
      components: [],
      sumInsuredPercentage: '0',
      sumInsuredValue: '',
      numberOfPerson: ''
    };

    if (section.wordings) {
      try {
        const parsedWordings = JSON.parse(section.wordings);
        setWordingContents(parsedWordings);
        setWordings(Object.keys(parsedWordings));
      } catch (e) {
        console.error('Error parsing wordings:', e);
        setWordingContents({});
        setWordings([]);
      }
    } else {
      setWordingContents({});
      setWordings([]);
    }

    // Parse components and floater information
    const components = section.components ? section.components.split(', ') : [];
    const floaters = section.applied_floaters ? section.applied_floaters.split(', ') : [];
    setComponentsList(components);
    setFloaterComponents(components.map(comp => floaters.includes(comp)));
  
    let savedComponentsData = [];
    if (section.components_data) {
      try {
        savedComponentsData = JSON.parse(section.components_data);
      } catch (e) {
        console.error('Error parsing components_data:', e);
      }
    }
    if (section.max_sum_insured_data) {
      try {
        maxSumInsuredData = JSON.parse(section.max_sum_insured_data);
      } catch (e) {
        console.error('Error parsing max_sum_insured_data:', e);
      }
    }

    // Map components to table data, using saved data when available
    const tableData = components.map(comp => {
      // Try to find this component in saved data
      const savedData = savedComponentsData.find(saved => saved.name === comp);
      
      if (savedData) {
        // Use saved data with proper transformation for sectionComponents
        return {
          ...savedData,
          sectionComponents: savedData.sectionComponents ? 
            savedData.sectionComponents.split(',').filter(c => c !== '') : []
        };
      }
      
      // Fall back to defaults if no saved data
      return {
        name: comp,
        sumInsuredType: 'Direct',
        section: '',
        sectionComponents: [],
        sumInsuredPercentage: 0,
        isFloater: floaters.includes(comp)
      };
    });
    
    setComponentTableData(tableData);

    // Parse covers and related data
    const covers = section.covers ? section.covers.split(', ') : [];
    setCoversList(covers);

    // Set floater policy flag
    const hasFloaterComponents = section.applied_floaters && section.applied_floaters.length > 0;

    // Handle rate type specific data
    const isOccupancy = section.rate_type === 'occupancy';
    
    // For occupancy rate type
    if (isOccupancy) {
      const hasMinRate = section.occupancy_min_rate !== '' && section.occupancy_min_rate !== null;
      const isRateEnterable = section.enterable_rate !== '' && section.enterable_rate !== null;
      setFormData({
        label: section.section_name,
        referenceName: section.section_reference_name || '',
        component: '',
        rate: 'occupancy',
        occupancyRate: section.occupancy_rate,
        minRate: hasMinRate,
        cover: '',
        isRateEnterable: isRateEnterable,
        minOccupancyRate: section.occupancy_min_rate || '',
        isFloaterPolicy: hasFloaterComponents,
        isMaxSumInsured: section.is_max_sum_insured === 'yes',
        maxSumInsuredData: maxSumInsuredData,
        excess: section.excess || ''
      });
    } 
    // For direct rate type
    else {
      // Parse direct rates
      const directRateItems = section.direct_rate ? section.direct_rate.split(', ') : [];
      const parsedRates = covers.map(cover => {
        const item = directRateItems.find(i => i.startsWith(`${cover}-`));
        return item ? item.split('-')[1] || '0' : '0';
      });
      
      // Parse min rates
      const minRateItems = section.direct_min_rate ? section.direct_min_rate.split(', ') : [];
      const parsedMinRates = covers.map(cover => {
        const item = minRateItems.find(i => i.startsWith(`${cover}-`));
        return item ? item.split('-')[1] || '0' : '0';
      });
      
      // Parse apply min rate flags
      const applyMinRateItems = section.apply_min_rate ? section.apply_min_rate.split(', ') : [];
      const parsedApplyMin = covers.map(cover => applyMinRateItems.includes(cover));
      
      // Parse enterable rate flags
      const enterableRateItems = section.enterable_rate ? section.enterable_rate.split(', ') : [];
      const parsedEnterable = covers.map(cover => enterableRateItems.includes(cover));
      
      // Parse mandatory cover flags
      const mandatoryCoverItems = section.mandatory_cover ? section.mandatory_cover.split(', ') : [];
      const parsedMandatory = covers.map(cover => mandatoryCoverItems.includes(cover));
      
      setCoverRates(parsedRates);
      setMinCoverRates(parsedMinRates);
      setApplyMinRates(parsedApplyMin);
      setIsRateEnterables(parsedEnterable);
      setMandatoryCovers(parsedMandatory);
      setEditingCovers(covers.map(() => false));
      setEditingMinCovers(covers.map(() => false));
      
      setFormData({
        label: section.section_name,
        referenceName: section.section_reference_name || '',
        component: '',
        rate: 'direct',
        occupancyRate: '',
        minRate: false,
        cover: '',
        isRateEnterable: false,
        maxSumInsuredData: maxSumInsuredData,
        minOccupancyRate: '',
        isFloaterPolicy: hasFloaterComponents,
        excess: section.excess || '',
        isMaxSumInsured: section.is_max_sum_insured === 'yes'
      });
    }

    let parsedDeviationMatrix = [];
    let initialDeviationSettings = [];
    
    if (section.deviation_matrix) {
      try {
        parsedDeviationMatrix = JSON.parse(section.deviation_matrix);
        const savedSettings = parsedDeviationMatrix.authority_levels || [];
        
        initialDeviationSettings = userLevels.map(level => {
          const savedLevel = savedSettings.find(s => s.level_name === level.level_name);
          return {
            level_name: level.level_name,
            settings: {
              sumInsuredMin: savedLevel?.settings?.sum_insured?.min || '',
              sumInsuredMax: savedLevel?.settings?.sum_insured?.max || '',
              rateMin: savedLevel?.settings?.rate?.min || '',
              rateMax: savedLevel?.settings?.rate?.max || ''
            }
          };
        });
        
        setDeviationMatrix(parsedDeviationMatrix.selected_types || []);
        setDeviationSettings(initialDeviationSettings);
        
        // Add console logging to debug
        console.log("Initial deviation settings:", initialDeviationSettings);
      } catch (e) {
        console.error('Error parsing deviation matrix:', e);
        setDeviationMatrix([]);
        setDeviationSettings([]);
      }
    }

    if (section.cover_rate_types) {
      try {
        const parsedCoverData = JSON.parse(section.cover_rate_types);
        const types = [];
        const sections = [];
        const selectedCovers = [];
  
        parsedCoverData.forEach(coverData => {
          types.push(coverData.rateType);
          sections.push(coverData.section);
          selectedCovers.push(coverData.coverComponents);
        });
  
        setCoverRateTypes(types);
        setCoverSections(sections);
        setCoverSelectedCovers(selectedCovers);
      } catch (e) {
        console.error('Error parsing cover rate types:', e);
      }
    }
    
    setShowForm(true);
  };

  const coverRateTypeOptions = [
    { value: 'Direct', label: 'Direct' },
    { value: 'Auto', label: 'Auto' }
  ];
  
  // Add handler for cover rate type change
  const handleCoverRateTypeChange = (selectedOption, index) => {
    setCoverRateTypes(prev => {
      const newTypes = [...prev];
      newTypes[index] = selectedOption.value;
      return newTypes;
    });
  };

  const handleDeviationChange = (levelIndex, field, value) => {
    setDeviationSettings(prevSettings => {
      const newSettings = [...prevSettings];
      newSettings[levelIndex] = {
        ...newSettings[levelIndex],
        settings: {
          ...newSettings[levelIndex].settings,
          [field]: value
        }
      };
      return newSettings;
    });
  };

  const handleCoverSectionChange = (selectedOption, index) => {
    setCoverSections(prev => {
      const newSections = [...prev];
      newSections[index] = selectedOption.value;
      return newSections;
    });
    // Clear selected covers when section changes
    setCoverSelectedCovers(prev => {
      const newCovers = [...prev];
      newCovers[index] = [];
      return newCovers;
    });
  };
  
  const handleCoverSelectedCoversChange = (selectedOptions, index) => {
    setCoverSelectedCovers(prev => {
      const newCovers = [...prev];
      newCovers[index] = selectedOptions.map(opt => opt.value);
      return newCovers;
    });
  };

  const handleWordingKeyPress = (e) => {
    if (e.key === 'Enter' && currentWording.trim()) {
      setWordings([...wordings, currentWording.trim()]);
      setWordingContents({
        ...wordingContents,
        [currentWording.trim()]: ''
      });
      setCurrentWording('');
    }
  };
  
  const handleWordingContentChange = (header, content) => {
    setWordingContents({
      ...wordingContents,
      [header]: content
    });
  };
  
  const handleRemoveWording = (header) => {
    const newWordings = wordings.filter(w => w !== header);
    const newContents = { ...wordingContents };
    delete newContents[header];
    setWordings(newWordings);
    setWordingContents(newContents);
  };


  const handleMaxSumInsuredTypeChange = (selectedOption) => {
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        type: selectedOption.value,
        section: '',
        components: [],
        sumInsuredPercentage: '0',
        numberOfPerson: '',
        sumInsuredValue: '',
        componentData: {}
      }
    }));
  };

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const components = await fetchComponent();
        const options = components.map(comp => ({
          value: comp.component_name,
          label: comp.component_name
        }));
        setComponentOptions(options);
      } catch (error) {
        console.error('Error fetching components:', error);
      }
    };
    loadComponents();
    
    // Load sections for dropdown
    const loadSections = async () => {
      try {
        const sections = await fetchSection();
        setSectionsData(sections);
        
        // Create map of section name to components
        const sectionMap = {};
        sections.forEach(section => {
          if (section.components) {
            sectionMap[section.section_name] = section.components.split(', ');
          }
        });
        setSectionComponentsMap(sectionMap);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    loadSections();
    
    // Set sum insured type options
    setSumInsuredTypes([
      { value: 'Direct', label: 'Direct' },
      { value: 'Auto', label: 'Auto' }
    ]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userLevelResponse = await fetchUserLevel();
        setUserLevels(userLevelResponse.map(level => ({
          level_name: level.level_name,
          settings: {
            sumInsuredMin: '',
            sumInsuredMax: '',
            rateMin: '',
            rateMax: ''
          }
        })));
      } catch (error) {
        console.error('Error fetching user levels:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sections = await fetchSection();
        setSubmittedSections(sections);
      } catch (error) {
        console.error('Error fetching product data:', error);
      }
    };
    if (formData.rate === 'occupancy') {
      fetchOccupancyRates();
    } else if (formData.rate === 'equipments') {
      fetchOccupancyRates();
    }
    if (location.state?.editMode && location.state?.sectionData) {
      handleEditSection(location.state.sectionData);
    }
    loadData();
  }, [formData.rate, location.state]);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const sections = await fetchSectionList();
        setSectionOptions(sections.map(section => ({
          value: section.section_name,
          label: section.section_name
        })));
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    loadSections();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Validate coverRate to only contain numbers
    if (name.startsWith('coverRate') && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'rate') {
      if (value === 'occupancy') {
        fetchOccupancyRates();
        setCoversList([]);
        setCoverRates([]);
        setMinCoverRates([]);
        setApplyMinRates([]);
        setIsRateEnterables([]);
        setMandatoryCovers([]);
        setEditingCovers([]);
        setEditingMinCovers([]);
      } else if (value === 'equipments') {
        fetchOccupancyRates();
        setCoversList([]);
        setCoverRates([]);
        setMinCoverRates([]);
        setApplyMinRates([]);
        setIsRateEnterables([]);
        setMandatoryCovers([]);
        setEditingCovers([]);
        setEditingMinCovers([]);
      } else if (value === 'direct') {
        setFormData((prevData) => ({
          ...prevData,
          occupancyRate: '',
          minOccupancyRate: '',
          equipmentRate: '',
          minEquipmentRate: ''
        }));
      }
    }
  };

  const handleCoverRateChange = (index, value) => {
    setCoverRates((prevRates) => {
      const newRates = [...prevRates];
      newRates[index] = value;
      return newRates;
    });
  };

  const handleMinCoverRateChange = (index, value) => {
    setMinCoverRates((prevRates) => {
      const newRates = [...prevRates];
      newRates[index] = value;
      return newRates;
    });
  };

  const handleApplyMinRateChange = (index, checked) => {
    setApplyMinRates((prevRates) => {
      const newRates = [...prevRates];
      newRates[index] = checked;
      return newRates;
    });
  };

  const handleIsRateEnterableChange = (index, checked) => {
    setIsRateEnterables((prevRates) => {
      const newRates = [...prevRates];
      newRates[index] = checked;
      return newRates;
    });
  };

  const handleMandatoryCoverChange = (index, checked) => {
    setMandatoryCovers((prevRates) => {
      const newRates = [...prevRates];
      newRates[index] = checked;
      return newRates;
    });
  };

  // Handle floater checkbox change for a component
  const handleFloaterChange = (index, checked) => {
    setComponentTableData((prevData) => {
      const newData = [...prevData];
      newData[index].isFloater = checked;
      return newData;
    });
    
    setFloaterComponents((prev) => {
      const newFloaters = [...prev];
      newFloaters[index] = checked;
      return newFloaters;
    });
  };

  // Handle sum insured type change
  const handleSumInsuredTypeChange = (selectedOption, index) => {
    setComponentTableData((prevData) => {
      const newData = [...prevData];
      newData[index].sumInsuredType = selectedOption.value;
      return newData;
    });
  };
  
  // Handle section selection change
  const handleSectionChange = (selectedOption, index) => {
    const sectionName = selectedOption.value;
    const sectionComponents = sectionComponentsMap[sectionName] || [];
    
    setComponentTableData((prevData) => {
      const newData = [...prevData];
      newData[index].section = sectionName;
      newData[index].sectionComponents = [];
      return newData;
    });
  };
  
  // Handle section components selection change
  const handleSectionComponentsChange = (selectedOptions, index) => {
    // Check if the user selected the "ALL" option
    const hasAllOption = selectedOptions.some(option => option.value === "ALL");
    
    let selectedComponents;
    
    if (hasAllOption) {
      // If "ALL" is selected, include all available components for that section
      selectedComponents = sectionComponentsMap[componentTableData[index].section] || [];
    } else {
      // Otherwise, use the normally selected components
      selectedComponents = selectedOptions.map(option => option.value);
    }
    
    setComponentTableData((prevData) => {
      const newData = [...prevData];
      newData[index].sectionComponents = selectedComponents;
      return newData;
    });
  };
  
  // Handle sum insured percentage change
  const handleSumInsuredPercentageChange = (e, index) => {
    const value = e.target.value;
    
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    setComponentTableData((prevData) => {
      const newData = [...prevData];
      newData[index].sumInsuredPercentage = value;
      return newData;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (formData.component.trim()) {
        const newComponent = formData.component.trim();
        setComponentsList((prevList) => [...prevList, newComponent]);
        setFloaterComponents((prevFloaters) => [...prevFloaters, false]); // New component is not a floater by default
        
        // Add to component table data
        setComponentTableData((prevData) => [
          ...prevData,
          {
            name: newComponent,
            sumInsuredType: 'Direct',
            section: '',
            sectionComponents: [],
            sumInsuredPercentage: 0,
            isFloater: false
          }
        ]);
        
        setFormData((prevData) => ({
          ...prevData,
          component: ''
        }));
      }
      if (formData.cover.trim()) {
        setCoversList((prevList) => [...prevList, formData.cover.trim()]);
        setCoverRates((prevRates) => [...prevRates, '']);
        setMinCoverRates((prevRates) => [...prevRates, '']);
        setApplyMinRates((prevRates) => [...prevRates, false]);
        setIsRateEnterables((prevRates) => [...prevRates, false]);
        setMandatoryCovers((prevRates) => [...prevRates, false]);
        setEditingCovers((prev) => [...prev, true]);
        setEditingMinCovers((prev) => [...prev, true]);
        setFormData((prevData) => ({
          ...prevData,
          cover: ''
        }));
      }
      if (editingCoverIndex !== null) {
        setEditingCoverIndex(null);
      }
    }
  };

  const handleRemoveComponent = (index) => {
    setComponentsList((prevList) => prevList.filter((_, i) => i !== index));
    setFloaterComponents((prevFloaters) => prevFloaters.filter((_, i) => i !== index));
    setComponentTableData((prevData) => prevData.filter((_, i) => i !== index));
  };

  const handleRemoveCover = (index) => {
    setCoversList((prevList) => prevList.filter((_, i) => i !== index));
    setCoverRates((prevRates) => prevRates.filter((_, i) => i !== index));
    setMinCoverRates((prevRates) => prevRates.filter((_, i) => i !== index));
    setApplyMinRates((prevRates) => prevRates.filter((_, i) => i !== index));
    setIsRateEnterables((prevRates) => prevRates.filter((_, i) => i !== index));
    setMandatoryCovers((prevRates) => prevRates.filter((_, i) => i !== index));
    setEditingCovers((prev) => prev.filter((_, i) => i !== index));
    setEditingMinCovers((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchOccupancyRates = async () => {
    try {
      const data = await fetchOccupancyRate();
      setOccupancyRates(data);
    } catch (error) {
      console.error('Error fetching occupancy rates:', error);
    }
  };

  const handleCoverRateKeyPress = (e, index) => {
    if (e.key === 'Enter' && coverRates[index].trim() !== '' && !isNaN(coverRates[index])) {
      setEditingCovers(prev => {
        const newEditing = [...prev];
        newEditing[index] = false;
        return newEditing;
      });
    }
  };

  const handleMinCoverRateKeyPress = (e, index) => {
    if (e.key === 'Enter' && minCoverRates[index].trim() !== '' && !isNaN(minCoverRates[index])) {
      setEditingMinCovers(prev => {
        const newEditing = [...prev];
        newEditing[index] = false;
        return newEditing;
      });
    }
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

  const handlePersonBasedChange = (e, component, field) => {
    const value = e.target.value;
    
    // Validate input based on field type
    if (field === 'numberOfPerson' && !/^\d*$/.test(value)) return;
    if (field === 'sumInsuredValue' && !/^\d*\.?\d*$/.test(value)) return;
    
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        componentData: {
          ...prevData.maxSumInsuredData.componentData,
          [component]: {
            ...prevData.maxSumInsuredData.componentData[component],
            [field]: value
          }
        }
      }
    }));
  };

  const handleSubmit = async () => {
    const occupancyCovers = ['Basic', 'STFI Cover', 'Earthquake', 'Terrorism'];
    
    const getCheckedCovers = (array, covers) => {
      return array
        .map((isChecked, index) => isChecked ? covers[index] : null)
        .filter(cover => cover !== null)
        .join(', ');
    };
  
    const getOccupancyRateCoverTitle = (selectedRateType) => {
      const selectedRate = occupancyRates.find(rate => rate.rate_type === selectedRateType);
      return selectedRate ? selectedRate.cover_title : '';
    };
  
    const activeCoversList = formData.rate === 'occupancy' ? occupancyCovers : coversList;
  
    const applyMinRateValue = formData.rate === 'occupancy' 
      ? (formData.minRate ? activeCoversList.join(", ") : '') 
      : getCheckedCovers(applyMinRates, activeCoversList);
  
    const enterableRateValue = formData.rate === 'occupancy'
      ? (formData.isRateEnterable ? activeCoversList.join(", ") : '')
      : getCheckedCovers(isRateEnterables, activeCoversList);
  
    const mandatoryCoverValue = formData.rate === 'occupancy' ? "Basic" : getCheckedCovers(mandatoryCovers, activeCoversList);
  
    // Format direct rates with cover names
    const formattedDirectRates = activeCoversList.map((cover, index) => 
      `${cover}-${coverRates[index] || '0'}`
    ).join(', ');
  
    // Format min rates with cover names
    const formattedMinRates = activeCoversList.map((cover, index) => 
      `${cover}-${minCoverRates[index] || '0'}`
    ).join(', ');
    
    // Collect component data from the table
    const componentsData = componentTableData.map(comp => ({
      name: comp.name,
      sumInsuredType: comp.sumInsuredType,
      section: comp.section,
      sectionComponents: comp.sectionComponents.join(','),
      sumInsuredPercentage: comp.sumInsuredPercentage,
      isFloater: comp.isFloater
    }));

    const formattedCoverData = activeCoversList.map((cover, index) => {
      const rateType = coverRateTypes[index] || 'Direct';
      if (rateType === 'Direct') {
        return {
          cover,
          rateType,
          rate: coverRates[index] || '0',
          section: '',
          coverComponents: []
        };
      } else {
        return {
          cover,
          rateType,
          rate: '0',
          section: coverSections[index] || '',
          coverComponents: coverSelectedCovers[index] || []
        };
      }
    });
  

    
    // Get all components marked as floaters
    const floaterComponentsList = componentTableData
      .filter(comp => comp.isFloater)
      .map(comp => comp.name);

    const currentTime = formatDate(new Date().toISOString());

    const deviationMatrixData = {
      selected_types: deviationMatrix,
      authority_levels: deviationSettings.map(setting => ({
        level_name: setting.level_name,
        settings: {
          ...(deviationMatrix.includes('Sum Insured') ? {
            sum_insured: {
              min: setting.settings.sumInsuredMin || '',
              max: setting.settings.sumInsuredMax || ''
            }
          } : {}),
          ...(deviationMatrix.includes('Rate') ? {
            rate: {
              min: setting.settings.rateMin || '',
              max: setting.settings.rateMax || ''
            }
          } : {})
        }
      }))
    };

    const data = {
      section_name: formData.label,
      section_reference_name: formData.referenceName,
      components: componentsList.join(', '),
      covers: activeCoversList.join(', '),
      rate_type: formData.rate,
      occupancy_rate: formData.occupancyRate ? getOccupancyRateCoverTitle(formData.occupancyRate) : '',
      occupancy_min_rate: formData.minRate && formData.minOccupancyRate ? getOccupancyRateCoverTitle(formData.minOccupancyRate) : '',
      apply_min_rate: applyMinRateValue,
      enterable_rate: enterableRateValue,
      mandatory_cover: mandatoryCoverValue,
      direct_rate: formattedDirectRates,
      direct_min_rate: formattedMinRates,
      apply_floater: formData.isFloaterPolicy ? 'yes' : 'no',
      applied_floaters: floaterComponentsList.join(', '),
      components_data: JSON.stringify(componentsData),
      is_max_sum_insured: formData.isMaxSumInsured ? 'yes' : 'no',
      excess: formData.excess,
      deviation_matrix: JSON.stringify(deviationMatrixData),
      wordings: JSON.stringify(wordingContents),
      cover_rate_types: JSON.stringify(formattedCoverData),
      max_sum_insured_data: formData.isMaxSumInsured ? JSON.stringify({
        type: formData.maxSumInsuredData.type,
        section: formData.maxSumInsuredData.section,
        components: formData.maxSumInsuredData.components,
        componentData: formData.maxSumInsuredData.componentData,
        sumInsuredPercentage: formData.maxSumInsuredData.sumInsuredPercentage,
        sumInsuredValue: formData.maxSumInsuredData.sumInsuredValue,
        numberOfPerson: formData.maxSumInsuredData.numberOfPerson,
      }) : '',
      ...(isEditing 
        ? {
            updated_by: user.user,
            updated_time: currentTime
          }
        : {
            created_by: user.user,
            created_time: currentTime
          }
      )
    };
   
  
    try {
      let sectionResult;
      if (isEditing) {
        // Update existing section
        sectionResult = await updateSection(editingSectionId, data);
  
        // Update the existing section in our list
        setSubmittedSections(prevSections => 
          prevSections.map(section => 
            section.id === editingSectionId ? {...data, id: editingSectionId} : section
          )
        );
      } else {
        // Create new section
        sectionResult = await submitProductData(data);
                
        // Add the new section to our list with the server-generated ID
        const newSection = {...data, section_id: sectionResult.section_id};
        setSubmittedSections(prevSections => [...prevSections, newSection]);
      }
  
      // Show the list view
      setShowForm(false);
  
      // Reset editing state
      setIsEditing(false);
      setEditingSectionId(null);
  
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  const handleMaxSumInsuredSectionChange = (selectedOption) => {
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        section: selectedOption.value,
        components: []
      }
    }));
  };
  
  const handleMaxSumInsuredComponentsChange = (selectedOptions) => {
    const hasAllOption = selectedOptions.some(option => option.value === "ALL");
    let selectedComponents;
    
    if (hasAllOption) {
      selectedComponents = sectionComponentsMap[formData.maxSumInsuredData.section] || [];
    } else {
      selectedComponents = selectedOptions.map(option => option.value);
    }
    
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        components: selectedComponents
      }
    }));
  };
  
  const handleMaxSumInsuredPercentageChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        sumInsuredPercentage: value
      }
    }));
  };
  
  const handleAddMaxSumInsured = () => {
    setMaxSumInsuredData(prevData => [
      ...prevData,
      {
        section: '',
        components: [],
        sumInsuredPercentage: '0'
      }
    ]);
  };
  
  const handleRemoveMaxSumInsured = (index) => {
    setMaxSumInsuredData(prevData => 
      prevData.filter((_, i) => i !== index)
    );
  };

  const handleComponentSelect = (selectedOptions) => {
    const selectedComponents = selectedOptions.map(option => option.value);
    setComponentsList(selectedComponents);
    
    // Create new component table data for selected components
    const newComponentTableData = selectedComponents.map(component => ({
      name: component,
      sumInsuredType: 'Direct',
      section: '',
      sectionComponents: [],
      sumInsuredPercentage: 0,
      isFloater: false
    }));
    
    setComponentTableData(newComponentTableData);
    setFloaterComponents(new Array(selectedComponents.length).fill(false));
  };

  const handleMaxSumInsuredValueChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        sumInsuredValue: value
      }
    }));
  };
  
  const handleNumberOfPersonChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    
    setFormData(prevData => ({
      ...prevData,
      maxSumInsuredData: {
        ...prevData.maxSumInsuredData,
        numberOfPerson: value
      }
    }));
  };

  const handleSectionSelect = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      label: selectedOption.value
    }));
    
    setComponentsList([]);
    setComponentTableData([]);
    setFloaterComponents([]);
  };

  return (
    <div className="product-container">
      {showForm ? (
        <div className="product-form">
          <h3 className="product-form-title">{isEditing ? 'Edit Section' : 'Create Section'}</h3>
          <div className="form-group">
            <label htmlFor="label" className='product-label'>Section Name</label>
            <Select
              id="label"
              name="label"
              value={sectionOptions.find(option => option.value === formData.label)}
              onChange={handleSectionSelect}
              options={sectionOptions}
              placeholder="Select Section"
            />
          </div>
          <div className="form-group">
            <label htmlFor="referenceName" className='product-label'>Section Reference Name</label>
            <input
              type="text"
              id="referenceName"
              name="referenceName"
              value={formData.referenceName}
              onChange={handleChange}
              placeholder="Enter reference name"
            />
          </div>
          <div className="form-group">
            <label className='product-label'>
              <input
                type="checkbox"
                id="isFloaterPolicy"
                name="isFloaterPolicy"
                checked={formData.isFloaterPolicy}
                onChange={handleChange}
              />
              Floater
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="component" className='product-label'>Component</label>
            <Select
              isMulti
              name="components"
              options={componentOptions}
              className="basic-multi-select"
              classNamePrefix="select"
              value={componentsList.map(comp => ({
                value: comp,
                label: comp
              }))}
              onChange={handleComponentSelect}
              placeholder="Select Components"
            />
            
            {/* Always show the Component Table Structure */}
            {componentTableData.length > 0 && (
              <div className="component-table">
                <table className="components-table">
                  <thead>
                    <tr>
                      <th style={{width: "20%"}}>Component</th>
                      <th style={{width: "20%"}}>Sum Insured Type</th>
                      {/* Show Section column only if Sum Insured Type is Direct */}
                      <th style={{width: "20%"}}>Section</th>
                      <th style={{width: "20%"}}>Components</th>
                      <th style={{width: "1%"}}>Sum Insured %</th>
                      {formData.isFloaterPolicy && <th style={{width: "1%"}}>Floater</th>}
                      <th style={{width: "1%"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentTableData.map((component, index) => (
                      <tr key={index}>
                        <td>{component.name}</td>
                        <td>
                          <Select
                            options={sumInsuredTypes}
                            value={sumInsuredTypes.find(opt => opt.value === component.sumInsuredType)}
                            onChange={(option) => handleSumInsuredTypeChange(option, index)}
                            className="basic-select"
                            classNamePrefix="select"
                          />
                        </td>
                        {/* Section dropdown - show only if Sum Insured Type is Direct */}
                        <td>
                          {component.sumInsuredType === 'Auto' ? (
                            <Select
                              options={sectionsData.map(section => ({
                                value: section.section_name,
                                label: section.section_name
                              }))}
                              value={component.section ? { value: component.section, label: component.section } : null}
                              onChange={(option) => handleSectionChange(option, index)}
                              className="basic-select"
                              classNamePrefix="select"
                              placeholder="Select Section"
                            />
                          ) : <div>-</div>}
                        </td>
                        <td>
                          {component.sumInsuredType === 'Auto' && component.section ? (
                            <Select
                              isMulti
                              options={[
                                { value: "ALL", label: "ALL" },
                                ...(sectionComponentsMap[component.section] || []).map(comp => ({
                                  value: comp,
                                  label: comp
                                }))
                              ]}
                              value={(component.sectionComponents || []).map(comp => ({
                                value: comp,
                                label: comp
                              }))}
                              onChange={(options) => handleSectionComponentsChange(options, index)}
                              className="basic-multi-select"
                              classNamePrefix="select"
                              placeholder="Select Components"
                            />
                          ) : <div>-</div>}
                        </td>
                        <td>
                          {component.sumInsuredType === 'Auto' ? (
                            <input
                              type="text"
                              value={component.sumInsuredPercentage}
                              onChange={(e) => handleSumInsuredPercentageChange(e, index)}
                              className="sum-insured-percentage"
                            />
                          ) : <div>-</div>}
                        </td>
                        {formData.isFloaterPolicy && (
                          <td>
                            <input
                              type="checkbox"
                              checked={component.isFloater}
                              onChange={(e) => handleFloaterChange(index, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <img 
                            className="remove-button" 
                            src={xMark} 
                            onClick={() => handleRemoveComponent(index)} 
                            alt="Remove"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="form-group inline">
            <label htmlFor="rate" className='product-label'>Rate</label>
            <select
              id="rate"
              name="rate"
              value={formData.rate}
              onChange={handleChange}
            >
              <option value="">Select Rate</option>
              <option value="occupancy">Occupancy</option>
              <option value="direct">Direct</option>
              <option value="equipments">Equipments</option>
            </select>
            {formData.rate === 'occupancy' && (
              <select
                id="occupancyRate"
                name="occupancyRate"
                value={formData.occupancyRate}
                onChange={handleChange}
                className="occupancy-rate-dropdown"
              >
                <option value="">Select Occupancy Rate</option>
                {occupancyRates.map((rate, index) => (
                  <option key={index} value={rate.rate_type}>{rate.rate_type}</option>
                ))}
              </select>
            )}
            {formData.rate === 'equipments' && (
              <select
                id="equipmentRate"
                name="equipmentRate"
                value={formData.equipmentRate}
                onChange={handleChange}
                className="occupancy-rate-dropdown"
              >
                <option value="">Select Equipment Rate</option>
                {occupancyRates.map((rate, index) => (
                  <option key={index} value={rate.rate_type}>{rate.rate_type}</option>
                ))}
              </select>
            )}
          </div>
          {formData.rate === 'direct' && (
            <div className="form-group">
              <label htmlFor="cover" className='product-label'>Cover</label>
              <input
                type="text"
                id="cover"
                name="cover"
                value={formData.cover}
                onChange={handleChange}
                onBlur={handleKeyPress}
                onKeyPress={handleKeyPress}
              />
            </div>
          )}
          {coversList.length > 0 && formData.rate === 'direct' && (
            <div className="form-group">
              <label className='cover-rate'>Covers with Rate</label>
              <table className="covers-table">
                <thead>
                  <tr>
                    <th>Cover</th>
                    <th>Cover Rate Type</th>
                    <th>Rate</th>
                    <th>Section</th>
                    <th>Covers</th>
                    <th>Apply Min Rate</th>
                    <th>Min Cover Rate</th>
                    <th>Enterable Rate</th>
                    <th>Mandatory Cover</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {coversList.map((cover, index) => (
                    <tr key={index}>
                      <td>{cover}</td>
                      <td style={{ minWidth: '150px' }}>
                        <Select
                          options={coverRateTypeOptions}
                          value={coverRateTypeOptions.find(opt => opt.value === (coverRateTypes[index] || 'Auto'))}
                          onChange={(option) => handleCoverRateTypeChange(option, index)}
                          className="basic-select"
                          classNamePrefix="select"
                        />
                      </td>
                      {/* Rate column */}
                      <td>
                        {coverRateTypes[index] === 'Direct' ? (
                          editingCovers[index] ? (
                            <input
                              type="number"
                              value={coverRates[index]}
                              onChange={(e) => handleCoverRateChange(index, e.target.value)}
                              onKeyPress={(e) => handleCoverRateKeyPress(e, index)}
                            />
                          ) : (
                            <div onClick={() => {
                              setEditingCovers(prev => {
                                const newEditing = [...prev];
                                newEditing[index] = true;
                                return newEditing;
                              });
                            }}>
                              {coverRates[index]}
                            </div>
                          )
                        ) : '-'}
                      </td>
                      {/* Section column */}
                      <td>
                        {coverRateTypes[index] === 'Auto' ? (
                          <Select
                            options={sectionsData.map(section => ({
                              value: section.section_name,
                              label: section.section_name
                            }))}
                            value={coverSections[index] ? { 
                              value: coverSections[index], 
                              label: coverSections[index] 
                            } : null}
                            onChange={(option) => handleCoverSectionChange(option, index)}
                            className="basic-select"
                            classNamePrefix="select"
                          />
                        ) : '-'}
                      </td>
                      {/* Covers column */}
                      <td>
                        {coverRateTypes[index] === 'Auto' ? (
                          <Select
                            isMulti
                            options={
                              coverSections[index] ? 
                                sectionsData
                                  .find(s => s.section_name === coverSections[index])
                                  ?.covers.split(', ')
                                  .map(cover => ({
                                    value: cover,
                                    label: cover
                                  })) || []
                                : []
                            }
                            value={coverSelectedCovers[index]?.map(cover => ({
                              value: cover,
                              label: cover
                            })) || []}
                            onChange={(options) => handleCoverSelectedCoversChange(options, index)}
                            className="basic-multi-select"
                            classNamePrefix="select"
                          />
                        ) : '-'}
                      </td>
                      {/* Rest of the columns remain unchanged */}
                      <td>
                        <input
                          type="checkbox"
                          checked={applyMinRates[index]}
                          onChange={(e) => handleApplyMinRateChange(index, e.target.checked)}
                        />
                      </td>
                      <td>
                        {applyMinRates[index] && (
                          editingMinCovers[index] ? (
                            <input
                              type="number"
                              value={minCoverRates[index]}
                              onChange={(e) => handleMinCoverRateChange(index, e.target.value)}
                              onKeyPress={(e) => handleMinCoverRateKeyPress(e, index)}
                            />
                          ) : (
                            <div onClick={() => {
                              setEditingMinCovers(prev => {
                                const newEditing = [...prev];
                                newEditing[index] = true;
                                return newEditing;
                              });
                            }}>
                              {minCoverRates[index]}
                            </div>
                          )
                        )}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={isRateEnterables[index]}
                          onChange={(e) => handleIsRateEnterableChange(index, e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={mandatoryCovers[index]}
                          onChange={(e) => handleMandatoryCoverChange(index, e.target.checked)}
                        />
                      </td>
                      <td>
                        <img
                          className="remove-button"
                          src={xMark}
                          onClick={() => handleRemoveCover(index)}
                          alt="Remove"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {formData.rate === 'occupancy' || formData.rate === 'equipments' && (
            <div className="form-group">
              <label className='product-label'>
                <input
                  type="checkbox"
                  id="minRate"
                  name="minRate"
                  checked={formData.minRate}
                  onChange={handleChange}
                />
                Apply Min Rate
              </label>
            </div>
          )}
          {formData.minRate && formData.rate === 'occupancy' && (
            <div className="form-group">
              <select
                id="minOccupancyRate"
                name="minOccupancyRate"
                value={formData.minOccupancyRate}
                onChange={handleChange}
                className="min-rate-dropdown"
              >
                <option value="">Select Min Occupancy Rate</option>
                {occupancyRates.map((rate, index) => (
                  <option key={index} value={rate.rate_type}>{rate.rate_type}</option>
                ))}
              </select>
            </div>
          )}
          {formData.minRate && formData.rate === 'equipments' && (
            <div className="form-group">
              <select
                id="minEquipmentRate"
                name="minEquipmentRate"
                value={formData.minEquipmentRate}
                onChange={handleChange}
                className="min-rate-dropdown"
              >
                <option value="">Select Min Equipment Rate</option>
                {occupancyRates.map((rate, index) => (
                  <option key={index} value={rate.rate_type}>{rate.rate_type}</option>
                ))}
              </select>
            </div>
          )}
          {formData.rate === 'occupancy' || formData.rate === 'equipments' &&(
            <div className="form-group">
              <label className='product-label'>
                <input
                  type="checkbox"
                  id="isRateEnterable"
                  name="isRateEnterable"
                  checked={formData.isRateEnterable}
                  onChange={handleChange}
                />
                Enterable Rate
              </label>
            </div>
          )}
          <div className="form-group">
            <label className='product-label'>
              <input
                type="checkbox"
                id="isMaxSumInsured"
                name="isMaxSumInsured"
                checked={formData.isMaxSumInsured}
                onChange={handleChange}
              />
              Set Max Sum Insured Limit
            </label>
          </div>
          {formData.isMaxSumInsured && (
            <div className="form-group">
              <table className="components-table">
                <thead>
                  <tr>
                    <th style={{width: "20%"}}>Type</th>
                    {formData.maxSumInsuredData.type === 'Section Based' && (
                      <>
                        <th style={{width: "30%"}}>Parent Section</th>
                        <th style={{width: "30%"}}>Components</th>
                        <th style={{width: "10%"}}>Sum Insured %</th>
                        <th style={{width: "20%"}}>Max Sum Insured Limit</th>
                      </>
                    )}
                    {formData.maxSumInsuredData.type === 'Direct' && (
                      <th style={{width: "30%"}}>Sum Insured Value</th>
                    )}
                    {formData.maxSumInsuredData.type === 'Person Based' && (
                      <>
                        <th style={{width: "30%"}}>Component</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Select
                        options={maxSumInsuredTypes}
                        value={maxSumInsuredTypes.find(type => 
                          type.value === formData.maxSumInsuredData.type
                        )}
                        onChange={handleMaxSumInsuredTypeChange}
                        className="basic-select"
                        classNamePrefix="select"
                        placeholder="Select Type"
                      />
                    </td>
                    {formData.maxSumInsuredData.type === 'Section Based' && (
                      <>
                        <td>
                          <Select
                            options={sectionsData.map(section => ({
                              value: section.section_name,
                              label: section.section_name
                            }))}
                            value={formData.maxSumInsuredData.section ? 
                              { value: formData.maxSumInsuredData.section, 
                                label: formData.maxSumInsuredData.section } : null}
                            onChange={(option) => handleMaxSumInsuredSectionChange(option)}
                            className="basic-select"
                            classNamePrefix="select"
                            placeholder="Select Section"
                          />
                        </td>
                        <td>
                          <Select
                            isMulti
                            options={[
                              { value: "ALL", label: "ALL" },
                              ...(sectionComponentsMap[formData.maxSumInsuredData.section] || [])
                                .map(comp => ({
                                  value: comp,
                                  label: comp
                                }))
                            ]}
                            value={(formData.maxSumInsuredData.components || [])
                              .map(comp => ({
                                value: comp,
                                label: comp
                              }))}
                            onChange={(options) => handleMaxSumInsuredComponentsChange(options)}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select Components"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.maxSumInsuredData.sumInsuredPercentage}
                            onChange={handleMaxSumInsuredPercentageChange}
                            className="sum-insured-percentage"
                            placeholder="Enter percentage"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.maxSumInsuredData.sumInsuredValue || ''}
                            onChange={(e) => handleMaxSumInsuredValueChange(e)}
                            className="sum-insured-value"
                            placeholder="Enter sum insured value"
                          />
                        </td>
                      </>
                    )}
                    {formData.maxSumInsuredData.type === 'Direct' && (
                      <td>
                        <input
                          type="text"
                          value={formData.maxSumInsuredData.sumInsuredValue || ''}
                          onChange={(e) => handleMaxSumInsuredValueChange(e)}
                          className="sum-insured-value"
                          placeholder="Enter sum insured value"
                        />
                      </td>
                    )}
                    {formData.maxSumInsuredData.type === 'Person Based' && (
                      componentsList.map((component, index) => (
                        <tr key={index}>
                          <td>{component}</td>
                          <td>
                            <input
                              type="number"
                              value={formData.maxSumInsuredData.componentData?.[component]?.numberOfPerson || ''}
                              onChange={(e) => handlePersonBasedChange(e, component, 'numberOfPerson')}
                              className="number-of-person"
                              placeholder="Enter number of persons"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={formData.maxSumInsuredData.componentData?.[component]?.sumInsuredValue || ''}
                              onChange={(e) => handlePersonBasedChange(e, component, 'sumInsuredValue')}
                              className="sum-insured-value"
                              placeholder="Enter sum insured value"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="deviationMatrix" className='product-label'>Deviation Matrix</label>
            <Select
              isMulti
              name="deviationMatrix"
              options={deviationOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              value={deviationMatrix.map(item => ({
                value: item,
                label: item
              }))}
              onChange={(selected) => {
                setDeviationMatrix(selected ? selected.map(option => option.value) : []);
                // Initialize settings for all user levels when selection changes
                setDeviationSettings(userLevels.map(level => ({
                  level_name: level.level_name,
                  settings: {
                    sumInsuredMin: '',
                    sumInsuredMax: '',
                    rateMin: '',
                    rateMax: ''
                  }
                })));
              }}
              placeholder="Select deviation types..."
            />

            {deviationMatrix.length > 0 && (
              <div className="deviation-table-container">
                <table className="deviation-table">
                  <thead>
                    <tr>
                      <th>Authority Level</th>
                      {deviationMatrix.includes('Sum Insured') && (
                        <>
                          <th>Sum Insured Min</th>
                          <th>Sum Insured Max</th>
                        </>
                      )}
                      {deviationMatrix.includes('Rate') && (
                        <>
                          <th>Rate Min</th>
                          <th>Rate Max</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {userLevels.map((level, index) => (
                      <tr key={level.level_name}>
                        <td>{level.level_name}</td>
                        {deviationMatrix.includes('Sum Insured') && (
                          <>
                            <td>
                              <input
                                type="number"
                                value={deviationSettings[index]?.settings.sumInsuredMin}
                                onChange={(e) => handleDeviationChange(index, 'sumInsuredMin', e.target.value)}
                                placeholder="Min"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={deviationSettings[index]?.settings.sumInsuredMax}
                                onChange={(e) => handleDeviationChange(index, 'sumInsuredMax', e.target.value)}
                                placeholder="Max"
                              />
                            </td>
                          </>
                        )}
                        {deviationMatrix.includes('Rate') && (
                          <>
                            <td>
                              <input
                                type="number"
                                value={deviationSettings[index]?.settings.rateMin}
                                onChange={(e) => handleDeviationChange(index, 'rateMin', e.target.value)}
                                placeholder="Min"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={deviationSettings[index]?.settings.rateMax}
                                onChange={(e) => handleDeviationChange(index, 'rateMax', e.target.value)}
                                placeholder="Max"
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="excess" className='product-label'>Excess</label>
            <input
              type="text"
              id="excess"
              name="excess"
              value={formData.excess}
              onChange={handleChange}
              className="excess-input"
              placeholder="Enter excess value"
            />
          </div>
          <div className="form-group">
            <label htmlFor="wordings" className='product-label'>Policy Wordings</label>
            <input
              type="text"
              id="wordings"
              value={currentWording}
              onChange={(e) => setCurrentWording(e.target.value)}
              onKeyPress={handleWordingKeyPress}
              placeholder="Enter wording header and press Enter"
              className="wording-input"
            />
            
            {wordings.length > 0 && (
              <table className="wordings-table">
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Content</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wordings.map((header) => (
                    <tr key={header}>
                      <td>{header}</td>
                      <td>
                        <textarea
                          value={wordingContents[header]}
                          onChange={(e) => handleWordingContentChange(header, e.target.value)}
                          placeholder="Enter content"
                          className="wording-content"
                        />
                      </td>
                      <td>
                        <img
                          className="remove-button"
                          src={xMark}
                          onClick={() => handleRemoveWording(header)}
                          alt="Remove"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button onClick={handleSubmit} className="submit-button">{isEditing ? 'Update' : 'Submit'}</button>
          {/* Display mini table of existing sections if there are any */}
          {submittedSections.length > 0 && (
            <div className="existing-sections-preview">
              <button onClick={() => navigate('/section-details')} className="view-all-button">
                View All Sections
              </button>
            </div>
          )}
        </div>
      ) : (
        <SectionDetails
          sectionDataList={submittedSections} 
          onEdit={handleEditSection}
          user={user}
        />
      )}
    </div>
  );
};

export default Section;