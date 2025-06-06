import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Select from 'react-select';
import '../styles/Product.css';
import { fetchProduct, submitProductMapping, updateProductMapping, fetchSection, fetchComponent } from '../api/api';
import ProductDetails from './ProductDetails';

const Product = (user) => {
  // Existing state and constants remain the same
  const location = useLocation();
  const [showForm, setShowForm] = useState(location.state?.showForm ?? true);
  const [isEditing, setIsEditing] = useState(location.state?.editMode ?? false);
  const [formData, setFormData] = useState({
    name: '',
    productName: '',
    sections: [],
    uanNumber: '',
    userCategories: [],
    workflow: 0
  });
  
  const [workflowSections, setWorkflowSections] = useState([]);
  const [workflowData, setWorkflowData] = useState({});
  const [tableData, setTableData] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [submittedProducts, setSubmittedProducts] = useState([]);
  const [selectedSectionTemplate, setSelectedSectionTemplate] = useState(null);
  const [sectionComponents, setSectionComponents] = useState({});
  const [addtionalComponents, setAddtionalComponents] = useState([]);

  // Predefined schemas based on the JSON data provided
  const predefinedSchemas = {
    customerDetails: {
      name: "Customer Details",
      fields: [
        { label: "Is Customer Individual or Corporate", type: "toggle", required: true, options: ["Individual", "Corporate"], default: "Individual" },
        { label: "Name", type: "text", required: true },
        { label: "Mobile", type: "text", required: true },
        { label: "Date of Birth", type: "date", required: true, dependsOn: "Individual" },
        { label: "Date of Incorporation", type: "date", required: true, dependsOn: "Corporate" },
        { label: "Gender", type: "toggle", required: true, options: ["Male", "Female"], default: "Male", dependsOn: "Individual" },
        { label: "PAN Number", type: "text", required: false }
      ]
    },
    addressInformation: {
      name: "Address Information",
      fields: [
        { label: "Address Line 1", type: "text", required: true },
        { label: "", type: "text", required: false },
        { label: "Pincode", type: "number", required: true },
        { label: "Area / Village", type: "dropdown", required: true, dependsOn: "Pincode", options: ["Area 1", "Area 2", "Area 3"] },
        { label: "District / City", type: "text", required: true, dependsOn: "Pincode" },
        { label: "State", type: "text", required: true, dependsOn: "Pincode" }
      ]
    },
    occupancyInformation: {
      name: "Occupancy Information",
      fields: [
        { label: "Occupancy Type", type: "dropdown", required: true, options: ["Residential", "Commercial", "Industrial"] },
        { label: "Nature Of Occupancy", type: "text", required: false },
        { label: "Nature of Risk Description", type: "text", required: false }
      ]
    },
    policyPeriod: {
      name: "Policy Period",
      fields: [
        { label: "Risk Start Date", type: "date", required: true, maxDate: "oneMonthFromNow" },
        { label: "Risk End Date", type: "date", required: true, dependsOn: "Risk Start Date", duration: "oneYear" },
        { label: "Risk Start Time", type: "time", required: true, default: "12:01", editable: false },
        { label: "Risk End Time", type: "time", required: true, default: "23:59", editable: false },
        { label: "Floater Policy", type: "checkbox", required: false, default: false }
      ]
    }
  };

  const sectionTemplateOptions = [
    { value: "customerDetails", label: "Customer Details" },
    { value: "addressInformation", label: "Address Information" },
    { value: "occupancyInformation", label: "Occupancy Information" },
    { value: "policyPeriod", label: "Policy Period" },
    { value: "custom", label: "Custom" }
  ];

  const userCategoryOptions = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Commercial-UW', label: 'Commercial-UW' },
    { value: 'Banca-UW', label: 'Banca-UW' },
    { value: 'Business Team', label: 'Business Team' },
    { value: 'Operation team', label: 'Operation team' }
  ];

  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'toggle', label: 'Toggle' },
    { value: 'button', label: 'Button' },
    { value: 'time', label: 'Time' }
  ];

  // All existing useEffect hooks and functions remain the same

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const products = await fetchProduct();
        const sections = await fetchSection();
        const components = await fetchComponent();
        const componentMap = {};
        sections.forEach(section => {
          componentMap[section.section_reference_name] = {
            components: section.components ? section.components.split(',').map(comp => comp.trim()) : []
          };
        });

        const addtionalComponents = components.map(comp => comp.component_name);
        setAddtionalComponents(addtionalComponents);

        setSubmittedProducts(products);
        setSectionComponents(componentMap);
        if (sections) {
          const sectionNames = sections;
          const options = sectionNames.map(name => ({
            value: name.section_reference_name,
            label: name.section_reference_name
          }));
          setSectionOptions(options);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (location.state?.editMode && location.state?.productData) {
      handleEditProduct(location.state.productData);
    }
    
    loadData();
  }, [location.state]);

  useEffect(() => {
    generateWorkflowSections();
  }, [formData.workflow]);

  const generateWorkflowSections = () => {
    const count = parseInt(formData.workflow) || 0;
    const newWorkflowSections = [];

    for (let i = 1; i <= count; i++) {
      const workflowKey = `workflow${i}`;
      const existingData = workflowData[workflowKey] || {
        sections: []
      };

      newWorkflowSections.push({
        id: workflowKey,
        data: existingData
      });
    }

    setWorkflowSections(newWorkflowSections);
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setEditingProductId(product.id);
    setShowForm(true);
  
    const userCategories = product.userCategories ? product.userCategories.split(', ').map(category => ({
      value: category,
      label: category
    })) : [];
  
    const sections = product.mappings ? product.mappings.map(mapping => ({
      value: mapping.sectionName.toLowerCase().replace(/\s+/g, '_'),
      label: mapping.sectionName
    })) : [];
  
    const processedTableData = product.mappings ? product.mappings.map(mapping => {
      const availableComponents = sectionComponents[mapping.sectionName]?.components || [];
      
      const restrictedComponents = mapping.restrictedComponents ? 
        mapping.restrictedComponents.split(', ').filter(comp => comp.trim()) : [];
      const additionalComponents = mapping.additionalComponents ? 
        mapping.additionalComponents.split(', ').filter(comp => comp.trim()) : [];
      const mandatorySectionsList = product.mandatorySections ? 
        product.mandatorySections.split(', ') : [];
      return {
        sectionName: mapping.sectionName,
        availableComponents,
        restrictedComponents: restrictedComponents,
        additionalComponents: additionalComponents,
        isMandatory: mandatorySectionsList.includes(mapping.sectionName)
      };
    }) : [];
  
    const parsedWorkflowData = {};
    try {
      ['workflow1', 'workflow2', 'workflow3', 'workflow4', 'workflow5', 'workflow6'].forEach(workflowKey => {
        if (product[workflowKey]) {
          const parsedData = JSON.parse(product[workflowKey]);
          parsedWorkflowData[workflowKey] = parsedData[workflowKey];
        }
      });
    } catch (err) {
      console.error('Error parsing workflow data:', err);
    }
  
    setWorkflowData(parsedWorkflowData);
    setFormData({
      name: product.name || '',
      productName: product.productName || '',
      sections: sections,
      uanNumber: product.uanNumber || '',
      userCategories: userCategories,
      workflow: Object.keys(parsedWorkflowData).length || 0
    });
  
    setTableData(processedTableData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleUserCategoryChange = (selectedOptions) => {
    setFormData(prevData => ({
      ...prevData,
      userCategories: selectedOptions || []
    }));
  };

  const handleSectionChange = (selectedOptions) => {
    setFormData(prevData => ({
      ...prevData,
      sections: selectedOptions || []
    }));
    
    const newTableData = selectedOptions ? selectedOptions.map(section => {
      const existingRow = tableData.find(row => row.sectionName === section.label);
      const availableComponents = sectionComponents[section.label]?.components || [];
      
      if (existingRow) {
        return {
          ...existingRow,
          availableComponents,
          restrictedComponents: existingRow.restrictedComponents || [],
          additionalComponents: existingRow.additionalComponents || [],
          isMandatory: existingRow?.isMandatory || false
        };
      }
      
      return {
        sectionName: section.label,
        availableComponents,
        restrictedComponents: [],
        additionalComponents: [],
        isMandatory: false
      };
    }) : [];
    
    setTableData(newTableData);
  };

  const handleMandatoryChange = (index, checked) => {
    setTableData(prevData => {
      const newData = [...prevData];
      newData[index] = {
        ...newData[index],
        isMandatory: checked
      };
      return newData;
    });
  };

  const handleComponentChange = (sectionIndex, type, selectedOptions) => {
    setTableData(prevData => {
      const newData = [...prevData];
      newData[sectionIndex] = {
        ...newData[sectionIndex],
        [`${type}Components`]: selectedOptions ? selectedOptions.map(option => option.value) : []
      };
      return newData;
    });
  };

  const handleSectionTemplateChange = (selectedOption, workflowId) => {
    setSelectedSectionTemplate(selectedOption);
    
    if (selectedOption && selectedOption.value !== 'custom') {
      const templateData = predefinedSchemas[selectedOption.value];
      
      // Pre-fill the section name input field
      const sectionNameInput = document.getElementById(`${workflowId}-new-section`);
      if (sectionNameInput) {
        sectionNameInput.value = templateData.name;
      }
    }
  };

  const handleAddSection = (workflowId, sectionName) => {
    if (!sectionName.trim()) return;

    setWorkflowData(prevData => {
      const updatedData = { ...prevData };
      if (!updatedData[workflowId]) {
        updatedData[workflowId] = { sections: [] };
      }
      
      // If a template is selected and it's not custom, use the predefined fields
      if (selectedSectionTemplate && selectedSectionTemplate.value !== 'custom') {
        const templateData = predefinedSchemas[selectedSectionTemplate.value];
        
        updatedData[workflowId].sections = [
          ...(updatedData[workflowId].sections || []),
          {
            name: sectionName,
            fields: [...templateData.fields]
          }
        ];
      } else {
        // For custom section, add with empty fields array
        updatedData[workflowId].sections = [
          ...(updatedData[workflowId].sections || []),
          {
            name: sectionName,
            fields: []
          }
        ];
      }
      
      // Reset the selected template
      setSelectedSectionTemplate(null);
      
      return updatedData;
    });
  };

  const handleAddFields = (workflowId, sectionIndex, fieldCount) => {
    setWorkflowData(prevData => {
      const updatedData = { ...prevData };
      const workflow = updatedData[workflowId];
      const section = workflow.sections[sectionIndex];
      
      const newFields = Array(parseInt(fieldCount) || 0).fill().map(() => ({
        label: "",
        type: "text",
        required: false,
        options: [],
        default: "",
        dependsOn: "",
        maxDate: "",
        duration: "",
        editable: true
      }));
      section.fields = [...(section.fields || []), ...newFields];
      
      return updatedData;
    });
  };

  // Modified to prompt for dropdown options when type is changed to dropdown
  const handleFieldChange = (workflowId, sectionIndex, fieldIndex, key, value) => {
    setWorkflowData(prevData => {
      const updatedData = JSON.parse(JSON.stringify(prevData));
      const field = updatedData[workflowId].sections[sectionIndex].fields[fieldIndex];
      
      field[key] = value;
      
      if (key === 'type') {
        switch (value) {
          case 'dropdown':
            // Prompt user for dropdown options if changing to dropdown
            const dropdownOptions = prompt('Enter comma-separated options for dropdown:');
            if (dropdownOptions) {
              field.options = dropdownOptions.split(',').map(opt => opt.trim());
            } else {
              field.options = field.options || [];
            }
            field.dependsOn = field.dependsOn || '';
            break;
          case 'toggle':
            field.options = field.options || ['Option 1', 'Option 2'];
            field.default = field.default || field.options[0];
            break;
          case 'date':
            field.maxDate = field.maxDate || '';
            field.duration = field.duration || '';
            break;
          case 'time':
            field.default = field.default || '12:00';
            field.editable = field.editable !== undefined ? field.editable : true;
            break;
        }
      }
      
      return updatedData;
    });
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

  const formatWorkflowDataForApi = (workflowData) => {
    const formattedData = {};
    
    Object.entries(workflowData).forEach(([workflowId, data]) => {
      const workflowObj = {};
      workflowObj[workflowId] = {
        sections: data.sections.map(section => ({
          name: section.name,
          fields: section.fields.map(field => ({
            label: field.label,
            type: field.type,
            required: field.required || false,
            options: field.options || undefined,
            default: field.default || undefined,
            dependsOn: field.dependsOn || undefined,
            maxDate: field.maxDate || undefined,
            duration: field.duration || undefined,
            editable: field.editable !== undefined ? field.editable : true
          }))
        }))
      };
      
      formattedData[workflowId] = JSON.stringify(workflowObj);
    });
    
    return formattedData;
  };

  const validateWorkflowData = (workflowData) => {
    const errors = [];
    
    Object.entries(workflowData).forEach(([workflowId, data]) => {
      if (!data.sections || data.sections.length === 0) {
        errors.push(`${workflowId} must have at least one section`);
        return;
      }

      data.sections.forEach((section, sectionIndex) => {
        if (!section.name) {
          errors.push(`Section ${sectionIndex + 1} in ${workflowId} must have a name`);
        }

        if (!section.fields || section.fields.length === 0) {
          errors.push(`Section "${section.name}" in ${workflowId} must have at least one field`);
        } else {
          section.fields.forEach((field, fieldIndex) => {
            if (!field.label && field.type !== 'text') {
              errors.push(`Field ${fieldIndex + 1} in section "${section.name}" (${workflowId}) must have a label`);
            }
            
            // Add validation for dropdown fields
            if (field.type === 'dropdown' && (!field.options || field.options.length === 0)) {
              errors.push(`Dropdown field "${field.label}" in section "${section.name}" (${workflowId}) must have at least 1 option`);
            }
          });
        }
      });
    });

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateWorkflowData(workflowData);
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }
    const formattedTableData = tableData.map(row => ({
      sectionName: row.sectionName,
      restrictedComponents: row.restrictedComponents.join(', '),
      additionalComponents: row.additionalComponents.join(', ')
    }));

    const mandatorySections = tableData
    .filter(row => row.isMandatory)
    .map(row => row.sectionName)
    .join(', ');

    const currentTime = formatDate(new Date().toISOString());
    const formattedWorkflows = formatWorkflowDataForApi(workflowData);
    const baseData = {
      name: formData.name,
      productName: formData.productName,
      uanNumber: formData.uanNumber,
      userCategories: formData.userCategories.map(cat => cat.value).join(', '),
      mappings: formattedTableData,
      mandatorySections: mandatorySections,
      workflow: formData.workflow,
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

    Object.entries(formattedWorkflows).forEach(([key, value]) => {
      baseData[key] = value;
    });

    try {
      let result;
      if (isEditing) {
        result = await updateProductMapping(editingProductId, baseData);
        setSubmittedProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === editingProductId ? {...baseData, id: editingProductId} : product
          )
        );
      } else {
        result = await submitProductMapping(baseData);
        const newProduct = {...baseData, product_id: result.product_id};
        setSubmittedProducts(prevProducts => [...prevProducts, newProduct]);
      }

      // Reset form
      setFormData({
        name: '',
        productName: '',
        sections: [],
        uanNumber: '',
        userCategories: [],
        workflow: 0
      });
      setTableData([]);
      setWorkflowData({});
      setWorkflowSections([]);
      setIsEditing(false);
      setEditingProductId(null);
      setShowForm(false);

    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit the form: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="product-container">
      {showForm ? (
        <div className="component-form">
          <h2 className="component-form-title">
            {isEditing ? 'Edit Product' : 'Create Product'}
          </h2>
          
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Product Exact Name</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div className="select-container">
            <label className="select-label">User Categories</label>
            <div className="select-wrapper">
              <Select
                isMulti
                options={userCategoryOptions}
                value={formData.userCategories}
                onChange={handleUserCategoryChange}
                className="react-select"
                classNamePrefix="react-select"
              />
            </div>
          </div>

          <div className="select-container">
            <label className="select-label">Sections</label>
            <div className="select-wrapper">
              <Select
                isMulti
                options={sectionOptions}
                value={formData.sections}
                onChange={handleSectionChange}
                className="react-select"
                isDisabled={loading}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
          {tableData.length > 0 && (
            <div className="mapping-table-container">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Section Name</th>
                    <th>Restricted Components</th>
                    <th>Additional Components</th>
                    <th>Mandatory</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.sectionName}</td>
                      <td>
                        <Select
                          isMulti
                          options={row.availableComponents.map(comp => ({
                            value: comp,
                            label: comp
                          }))}
                          value={row.restrictedComponents.map(comp => ({
                            value: comp,
                            label: comp
                          }))}
                          onChange={(selected) => handleComponentChange(index, 'restricted', selected)}
                          className="react-select"
                          classNamePrefix="react-select"
                        />
                      </td>
                      <td>
                        <Select
                          isMulti
                          options={addtionalComponents.map(comp => ({
                            value: comp,
                            label: comp
                          }))}
                          value={row.additionalComponents.map(comp => ({
                            value: comp,
                            label: comp
                          }))}
                          onChange={(selected) => handleComponentChange(index, 'additional', selected)}
                          className="react-select"
                          classNamePrefix="react-select"
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.isMandatory}
                          onChange={(e) => handleMandatoryChange(index, e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">UIN Number</label>
            <input
              type="text"
              name="uanNumber"
              value={formData.uanNumber}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Workflows</label>
            <input
              type="number"
              name="workflow"
              value={formData.workflow}
              onChange={handleChange}
              className="form-input"
              min="0"
              max="5"
            />
          </div>
          {workflowSections.map((workflow, workflowIndex) => (
            <div key={workflow.id} className="workflow-container">
              <h3 className="workflow-title">{workflow.id}</h3>
              
              {workflowData[workflow.id]?.sections?.map((section, sectionIndex) => (
                <div key={`${workflow.id}-section-${sectionIndex}`} className="section-container">
                  <h4>Section: {section.name}</h4>
                  
                  <div className="fields-container">
                    {section.fields?.map((field, fieldIndex) => (
                      <div key={`field-${fieldIndex}`} className="field-row">
                        <div className="field-input-group">
                          <input
                            type="text"
                            placeholder="Label"
                            value={field.label}
                            onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'label', e.target.value)}
                            className="field-input"
                          />
                          
                          <select
                            value={field.type}
                            onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'type', e.target.value)}
                            className="field-type-select"
                          >
                            {fieldTypeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          
                          <label className="field-required-container">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'required', e.target.checked)}
                              className="field-required-checkbox"
                            />
                            Required
                          </label>

                          {/* Dropdown specific options UI */}
                          {field.type === 'dropdown' && (
                            <div className="field-options-container">
                              <input
                                type="text"
                                placeholder="Options (comma-separated)"
                                value={field.options?.join(',') || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                                className="field-input"
                              />
                              <div className="field-dependency-container">
                                <input
                                  type="text"
                                  placeholder="Depends On Field"
                                  value={field.dependsOn || ''}
                                  onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'dependsOn', e.target.value)}
                                  className="field-input"
                                />
                              </div>
                            </div>
                          )}

                          {/* Toggle options */}
                          {field.type === 'toggle' && (
                            <div className="field-options-container">
                              <input
                                type="text"
                                placeholder="Options (comma-separated)"
                                value={field.options?.join(',') || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                                className="field-input"
                              />
                              <input
                                type="text"
                                placeholder="Default Value"
                                value={field.default || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'default', e.target.value)}
                                className="field-input"
                              />
                            </div>
                          )}

                          {/* Other field type specific options */}
                          {(field.type === 'date' || field.type === 'time') && (
                            <div className="field-dependency-container">
                              <input
                                type="text"
                                placeholder="Depends On Field"
                                value={field.dependsOn || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'dependsOn', e.target.value)}
                                className="field-input"
                              />
                            </div>
                          )}

                          {field.type === 'date' && (
                            <div className="field-date-constraints">
                              <input
                                type="text"
                                placeholder="Max Date (e.g., oneMonthFromNow)"
                                value={field.maxDate || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'maxDate', e.target.value)}
                                className="field-input"
                              />
                              <input
                                type="text"
                                placeholder="Duration (e.g., oneYear)"
                                value={field.duration || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'duration', e.target.value)}
                                className="field-input"
                              />
                            </div>
                          )}

                          {field.type === 'time' && (
                            <div className="field-time-settings">
                              <input
                                type="text"
                                placeholder="Default Time (HH:mm)"
                                value={field.default || ''}
                                onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'default', e.target.value)}
                                className="field-time-default"
                              />
                              <label className="field-editable-container">
                                <input
                                  type="checkbox"
                                  checked={field.editable}
                                  onChange={(e) => handleFieldChange(workflow.id, sectionIndex, fieldIndex, 'editable', e.target.checked)}
                                  className="field-editable-checkbox"
                                />
                                Editable
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="add-fields-container">
                    <input
                      type="number"
                      placeholder="Number of fields"
                      className="fields-count-input"
                      min="1"
                      id={`${workflow.id}-${sectionIndex}-fields-count`}
                    />
                    <button
                      onClick={() => {
                        const fieldCount = document.getElementById(`${workflow.id}-${sectionIndex}-fields-count`).value;
                        handleAddFields(workflow.id, sectionIndex, fieldCount);
                      }}
                      className="add-fields-button"
                    >
                      Add Fields
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="add-section-container">
                <div className="section-template-selector">
                  <label>Section Template:</label>
                  <Select
                    options={sectionTemplateOptions}
                    value={selectedSectionTemplate}
                    onChange={(option) => handleSectionTemplateChange(option, workflow.id)}
                    className="section-template-select"
                    placeholder="Select a template or custom"
                  />
                </div>
                <input
                  type="text"
                  placeholder="New Section Name"
                  className="section-name-input"
                  id={`${workflow.id}-new-section`}
                />
                <button
                  onClick={() => {
                    const sectionName = document.getElementById(`${workflow.id}-new-section`).value;
                    handleAddSection(workflow.id, sectionName);
                    document.getElementById(`${workflow.id}-new-section`).value = '';
                  }}
                  className="add-section-button"
                >
                  Add Section
                </button>
              </div>
            </div>
          ))}

          <div className="button-container">
            <button onClick={handleSubmit} className="submit-button">
              {isEditing ? 'Update' : 'Submit'}
            </button>
            {submittedProducts.length > 0 && (
              <button onClick={() => setShowForm(false)} className="view-all-button">
                View All Products
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <ProductDetails 
            productDataList={submittedProducts}
            onEdit={handleEditProduct}
          />
        </div>
      )}
    </div>
  );
};

export default Product;