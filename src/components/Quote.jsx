import React, { useState, useEffect } from 'react';
import { fetchQuotes } from '../api/api';
import Handlebars from 'handlebars';
import '../styles/Quote.css';

const Quote = ({setProductExactName}) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'summary_id', direction: 'ascending' });

  // Fetch quote summaries
  const loadQuoteSummaries = async () => {
    try {
      setLoading(true);
      const data = await fetchQuotes(); 
      setSummaries(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch quote summaries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuoteSummaries();
  }, []);

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

  const initiateSchedule = (full_summary, summary) => {
    setCurrentSummary({ full_summary, summary });
    setShowPaymentDialog(true);
  };
  
  // Method to handle payment confirmation
  const handlePaymentConfirmation = (isPaymentDone) => {
    setShowPaymentDialog(false);
    
    if (isPaymentDone && currentSummary) {
      // Proceed with schedule generation
      processSchedule(currentSummary.full_summary, currentSummary.summary);
    }
    // Reset current summary
    setCurrentSummary(null);
  };

  const processMarineSchedule = async (full_summary, summary) => {
    try {
      const data = typeof full_summary === 'string' ? JSON.parse(full_summary) : full_summary;
      
      if (!data) {
        console.error("Data is undefined or null");
        return "";
      }
      
      let templateContent;
      
      try {
        const template = await fetch("temp/Marine_files/sheet001.htm");
        templateContent = await template.text();
      } catch (error) {
        console.error("Error fetching template:", error);
        return "Error fetching template: " + error.message;
      }
      
      if (!templateContent) {
        console.error("Template content is empty");
        return "Template content is empty";
      }

      function getSumInsuredForEquipment(address, equipment) {
        // Try to find sum insured in packageSumInsured using equipment name as key
        const equipmentKey = `${equipment.equipment}-${address.selectedPackage}`;
        
        if (address.packageSumInsured && address.packageSumInsured[equipmentKey]) {
          return address.packageSumInsured[equipmentKey];
        }
        
        // Check if it's in another location
        if (address.packageSumInsured) {
          for (const key in address.packageSumInsured) {
            if (key.startsWith(equipment.equipment)) {
              return address.packageSumInsured[key];
            }
          }
        }
        
        return 0;
      }
  
      const addresses = Array.isArray(data.submittedAddresses) ? data.submittedAddresses : [data];
      const allEquipmentDetails = [];
      let locationAddress;
      let serialNumber = 1;
      let totalSumInsured = 0;
      let totalPremiumBeforeGST = 0;
      let totalTerrorPremium = 0;
      let totalGST = 0;
      let totalGrossPremium = 0;
      let firstAddress;
      let allLocations = [];
  
      // First, collect all equipment details
      addresses[0].forEach((address, addressIndex) => {
        if (address && address.equipmentDetails && address.equipmentDetails.length > 0) {
          if (!firstAddress) firstAddress = address;
          
          const name = address.name || "Unknown";
          const addressLine1 = address.addressLine1 || "";
          const areaVillage = address.areaVillage || "";
          const districtCity = address.districtCity || "";
          const state = address.state || "";
          const pincode = address.pincode || "";
  
          locationAddress = `${name} - ${addressLine1}, ${areaVillage}, ${districtCity}, ${state}, ${pincode}`;
          allLocations.push(locationAddress);
          
          address.equipmentDetails.forEach(item => {
            const equipmentSumInsured = getSumInsuredForEquipment(address, item) || 0;
            totalSumInsured += equipmentSumInsured;
            
            allEquipmentDetails.push({
              serialNumber: serialNumber++,
              location: locationAddress,
              machineName: item.equipment || "N/A",
              machineSerialNo: item.serialNo || "N/A",
              makeModel: `${item.make || ""} ${item.model || ""}`.trim() || "N/A",
              capacity: "1",
              yearOfMake: item.yom || "N/A",
              sumInsured: equipmentSumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2}),
              escalation: "N/A",
              excess: "N/A"
            });
          });
        }
      });
  
      // Calculate premium details
      const baseRate = 0.15;
      totalPremiumBeforeGST = totalSumInsured * (baseRate / 100);
      totalGST = totalPremiumBeforeGST * 0.18;
      totalGrossPremium = totalPremiumBeforeGST + totalGST;
      
      const currentDate = new Date().toLocaleDateString('en-IN');
  
      const results = [];
      
      for (const equipment of allEquipmentDetails) {
        let htmlContent = templateContent;
        
        // Apply all other replacements
        const replacements = {
          '{total}': totalSumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{total-pre}': (totalPremiumBeforeGST-totalTerrorPremium).toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{gst}': (totalGST/2).toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{overall-pre}': totalGrossPremium.toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{name}': firstAddress.name,
          '{address}': locationAddress, 
          '{pan}': firstAddress.panNumber,
          '{now}': currentDate,
          '{location-address}': allLocations.join('\n'),
          '{from}': firstAddress.policyPeriod || '',
          '{to}': firstAddress.policyEndPeriod || '',
          '{phone}': firstAddress.mobile,
          '{equipment}': `${equipment.machineName}, ${equipment.machineSerialNo}, ${equipment.makeMode}, ${equipment.yearOfMake}`,
        };
        
        Object.entries(replacements).forEach(([key, value]) => {
          htmlContent = htmlContent.replace(new RegExp(key, 'g'), value || '');
        });
        
        results.push(htmlContent);
      }
      
      // Open each template in a new window or handle as needed
      results.forEach((html, index) => {
        const newWindow = window.open("", `_blank_${index}`, "width=700,height=600,title=CPM Preview - Equipment ${index+1}");
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
        } else {
          console.error(`Failed to open preview window for equipment ${index+1}`);
        }
      });
      
      return `Successfully generated ${results.length} equipment templates`;
    }
    catch(error){
      console.error("Error generating Marine CPM preview:", error);
      return "Error generating Marine CPM preview: " + error.message;
    }
  };

  const getRomanNumeral = (num) => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
    return romanNumerals[num - 1] || num.toString();
  };

  const processSchedule = async (full_summary, summary) => {
    const data = typeof full_summary === 'string' ? JSON.parse(full_summary) : full_summary;
    const addresses = Array.isArray(data.submittedAddresses) ? data.submittedAddresses : [data];
    const product = addresses[0][0].title !== "CPM";
    
    if(product){
      try {
        let template = await fetch("temp/Schedule_files/sheet001.htm");
        let htmlContent = await template.text();
    
        // Process multiple addresses
        const allAddresses = addresses[0] || [];
        
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
            excess: excessText
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
            <td class="xl008" style="border-bottom: none;border-top: none;"></td>
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
              <td colspan=8 class=xl008>${sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td colspan=4 class=xl008>${premium.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td colspan=7 class=xl008>${terrorismPremium.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td colspan=4 class=xl008>${total.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td class="xl008" style="border-bottom: none;border-top: none;"></td>
            </tr>`;
        }).join('');

        const closingRow = `
          <tr height=12>
            <td colspan=35 style="background-color: #1e4c8c; border: none;"></td>
          </tr>`;
  
        // Replace coverage section in template
        const coverageSection = coverageDetails + sectionRows + closingRow;
        htmlContent = htmlContent.replace(
          /<tr height=24>\s*<td colspan=35.*?6\. COVERAGE DETAILS.*?(?=<tr height=7)/s,
          coverageSection
        );

        const grossPremium = totalPremium + gstAmount;
        
        // Use first address for general info
        const firstAddress = allAddresses[0] || {};

        function formatDateWithTime(dateString, isEndDate = false) {
          // Split the date string to extract the date part
          const dateParts = dateString.split('-');
          
          // Format as DD/MM/YYYY
          const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          
          // Add the appropriate time suffix
          
          return formattedDate;
        }
    
        // Replace other dynamic values
        const replacements = {
          '{PRODUCT_TITLE}': firstAddress.title || '',
          '{{Policy No}}': '',
          '{UIN_NUMBER}': '',
          '{branch-add}': '',
          '{sac-code}': '',
          '{sac-des}': '',
          '{{INSURED_NAME}}': firstAddress.name || '',
          '{{POLICY_DATE}}': new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          '{from}': formatDateWithTime(firstAddress.policyPeriod) + " 00:01 Hrs" || '',
          '{to}': formatDateWithTime(firstAddress.policyEndPeriod) + " 23:59 Hrs" || '',
          '{PAN No}': firstAddress.panNumber || '',
          '{address}': locationAddressText || '',
          '{phone}': firstAddress.mobile || '',
          'premium exlcude terr': Number(totalPremium-terrorismValue).toLocaleString('en-IN', {maximumFractionDigits: 2}),
          'terrorism opt' : Number(terrorismValue).toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{SGST}': Number(gstAmount/2).toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{CGST}': Number(gstAmount/2).toLocaleString('en-IN', {maximumFractionDigits: 2}),
          '{Gross Premium}': Number(grossPremium).toLocaleString('en-IN', {maximumFractionDigits: 2})
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
      processCPMSchedule(full_summary, summary);
    }
  }

  const processCPMSchedule = async (full_summary, summary) => {
    try {
      // Parse the JSON string or use the object directly
      const data = typeof full_summary === 'string' ? JSON.parse(full_summary) : full_summary;
      
      // Check if data exists
      if (!data) {
        console.error("Data is undefined or null");
        return "";
      }
      
      // Try to fetch the template
      let template;
      let htmlContent;
      
      try {
        template = await fetch("temp/cpmps_files/sheet001.htm");
        htmlContent = await template.text();
      } catch (error) {
        console.error("Error fetching template:", error);
        return "Error fetching template: " + error.message;
      }
      
      // Check if template was loaded successfully
      if (!htmlContent) {
        console.error("Template content is empty");
        return "Template content is empty";
      }
      
      // Extract all equipment details from data
      let allEquipmentDetails = [];
      let serialNumber = 1;
      const allAddonNames = [];
      let locationAddress;

      
      // Check if we're dealing with a single address or an array of addresses
      const addresses = Array.isArray(data.submittedAddresses) ? data.submittedAddresses : [data];
      let isMarine = addresses[0][0].isMarine;
      
      addresses[0].forEach((address, addressIndex) => {
        if (address && address.equipmentDetails && address.equipmentDetails.length > 0) {
          // Build location string with available fields
          const name = address.name || "Unknown";
          const addressLine1 = address.addressLine1 || "";
          const areaVillage = address.areaVillage || "";
          const districtCity = address.districtCity || "";
          const state = address.state || "";
          const pincode = address.pincode || "";

          locationAddress = `${name} - ${addressLine1}, ${areaVillage}, ${districtCity}, ${state}, ${pincode}`;
          
          address.equipmentDetails.forEach(item => {
            // Map equipment properties based on your actual data structure
            allEquipmentDetails.push({
              serialNumber: serialNumber++,
              location: locationAddress,
              machineName: item.equipment || "N/A",
              machineSerialNo: item.serialNo || "N/A", // Changed from serialNumber to serialNo
              makeModel: `${item.make || ""} ${item.model || ""}`.trim() || "N/A", // Combined make and model
              capacity: "1", // Not in your data structure
              yearOfMake: item.yom || "N/A", // Changed from yearOfMake to yom
              sumInsured: (getSumInsuredForEquipment(address, item) || 0).toLocaleString('en-IN', {maximumFractionDigits: 2}),
              escalation: "N/A", // Not in your data structure
              excess: "N/A" // Not in your data structure
            });
          });

          if(address.addonDetails){
            address.addonDetails.forEach(addon => {
              allAddonNames.push({
                addonCoverName: addon.addonCoverName || "N/A",
                sumInsured: addon.sumInsured
              });
            });
          }
        }
      });
      
      // Helper function to get sum insured for a specific equipment
      function getSumInsuredForEquipment(address, equipment) {
        // Try to find sum insured in packageSumInsured using equipment name as key
        const equipmentKey = `${equipment.equipment}-${address.selectedPackage}`;
        
        if (address.packageSumInsured && address.packageSumInsured[equipmentKey]) {
          return address.packageSumInsured[equipmentKey];
        }
        
        // Check if it's in another location
        if (address.packageSumInsured) {
          for (const key in address.packageSumInsured) {
            if (key.startsWith(equipment.equipment)) {
              return address.packageSumInsured[key];
            }
          }
        }
        
        return 0;
      }
      let addonCoversHtml = '';
      let detailAddonCoversHtml = '';

      if (allAddonNames.length === 0) {
        // Handle case when no addon details are found
        addonCoversHtml = `
          <tr height=21 style='mso-height-source:userset;height:16.0pt'>
            <td colspan=23 height=21 class=xl123 width=823 style='border-right:.5pt solid black;
            height:16.0pt;width:627pt'>No add-on covers found</td>
            <td></td>
          </tr>`;
      } else {
        allAddonNames.forEach(addon => {
          addonCoversHtml += `
            <tr height=21 style='mso-height-source:userset;height:16.0pt'>
              <td colspan=23 height=21 class=xl123 width=823 style='border-right:.5pt solid black;
              height:16.0pt;width:627pt'>${addon.addonCoverName}</td>
              <td></td>
            </tr>`;
        });
      }

      if (allAddonNames.length === 0) {
        // Handle case when no addon details are found
        addonCoversHtml = `
          <tr height=21 style='mso-height-source:userset;height:16.0pt'>
            <td colspan=23 height=21 class=xl123 width=823 style='border-right:.5pt solid black;
            height:16.0pt;width:627pt'>No add-on covers found</td>
            <td></td>
          </tr>`;
      } else {
        allAddonNames.forEach(addon => {
          detailAddonCoversHtml += `
            <tr height=19 style='mso-height-source:userset;height:14.0pt'>
            <td colspan=17 height=19 class=xl123 width=609 style='border-right:.5pt solid black;
            height:14.0pt;width:465pt'>${addon.addonCoverName}</td>
            <td colspan=6 class=xl123 width=214 style='border-right:.5pt solid black;
            border-left:none;width:162pt'>${addon.sumInsured}</td>
            <td></td>
          </tr>`;
        });
      }

      if (htmlContent.includes('<tr>New2</tr>') && htmlContent.includes('<tr>End2</tr>')) {
        htmlContent = htmlContent.replace(
          /<tr>New2<\/tr>[\s\S]*?<tr>End2<\/tr>/,
          `${detailAddonCoversHtml}`
        );
      } else {
        console.warn("Could not find addon section markers in template");
        // Try to find another place to inject the addon details
        const alternateInsertPoint = htmlContent.indexOf('<div id="addonCovers">');
        if (alternateInsertPoint !== -1) {
          htmlContent = htmlContent.slice(0, alternateInsertPoint + '<div id="addonCovers">'.length) + 
                       addonCoversHtml + 
                       htmlContent.slice(alternateInsertPoint + '<div id="addonCovers">'.length);
        } else {
          console.error("No suitable insertion point found for addon details");
        }
      }
      
      // Replace the template addon section with our generated HTML
      if (htmlContent.includes('<tr>New1</tr>') && htmlContent.includes('<tr>End1</tr>')) {
        htmlContent = htmlContent.replace(
          /<tr>New1<\/tr>[\s\S]*?<tr>End1<\/tr>/,
          `${addonCoversHtml}`
        );
      } else {
        console.warn("Could not find addon section markers in template");
        // Try to find another place to inject the addon details
        const alternateInsertPoint = htmlContent.indexOf('<div id="addonCovers">');
        if (alternateInsertPoint !== -1) {
          htmlContent = htmlContent.slice(0, alternateInsertPoint + '<div id="addonCovers">'.length) + 
                       addonCoversHtml + 
                       htmlContent.slice(alternateInsertPoint + '<div id="addonCovers">'.length);
        } else {
          console.error("No suitable insertion point found for addon details");
        }
      }
      
      // Generate HTML for equipment schedule
      let equipmentScheduleHtml = '';
      
      if (allEquipmentDetails.length === 0) {
        // Handle case when no equipment details are found
        equipmentScheduleHtml = `
          <tr height=23 style='mso-height-source:userset;height:17.0pt'>
            <td colspan=23 height=23 class=xl90 style='border-right:.5pt solid black;
            height:17.0pt'><font class="font16">No equipment details found</font></td>
            <td></td>
          </tr>`;
      } else {
        allEquipmentDetails.forEach(machine => {
          equipmentScheduleHtml += `
            <tr height=23 style='mso-height-source:userset;height:17.0pt'>
              <td colspan=3 height=23 class=xl90 width=230 style='border-right:.5pt solid black;
              height:17.0pt;width:174pt'><font class="font16">S. No.</font></td>
              <td colspan=20 class=xl131 style='border-right:.5pt solid black;border-left:
              none'>${machine.serialNumber}</td>
              <td></td>
            </tr>
            <tr height=19 style='mso-height-source:userset;height:14.0pt'>
              <td colspan=3 height=19 class=xl90 width=230 style='border-right:.5pt solid black;
              height:14.0pt;width:174pt'><font class="font16">Location</font></td>
              <td colspan=20 class=xl123 width=593 style='border-right:.5pt solid black;
              border-left:none;width:453pt'>${machine.location}</td>
              <td></td>
            </tr>
            <tr height=31 style='mso-height-source:userset;height:23.0pt'>
              <td colspan=3 height=31 class=xl90 width=230 style='border-right:.5pt solid black;
              height:23.0pt;width:174pt'><font class="font16">Machine Insured</font></td>
              <td colspan=2 class=xl129 width=92 style='border-right:.5pt solid black;
              border-left:none;width:70pt'><font class="font16">Machine Serial No.</font></td>
              <td class=xl71 width=62 style='border-top:none;border-left:none;width:47pt'><font
              class="font16">Make &amp; Model</font></td>
              <td colspan=4 class=xl126 width=68 style='border-right:.5pt solid black;
              border-left:none;width:52pt'><font class="font16">Capacity</font></td>
              <td colspan=3 class=xl99 width=60 style='border-right:.5pt solid black;
              border-left:none;width:47pt'><font class="font16">Year of make</font></td>
              <td colspan=5 class=xl99 width=104 style='border-right:.5pt solid black;
              border-left:none;width:81pt;text-align: right;'><font class="font16">Sum Insured (Amount in Rs.)</font></td>
              <td colspan=2 class=xl126 width=77 style='border-right:.5pt solid black;
              border-left:none;width:58pt'><font class="font16">Escalation</font></td>
              <td colspan=3 class=xl126 width=130 style='border-right:.5pt solid black;
              border-left:none;width:98pt'><font class="font16">Excess</font></td>
              <td></td>
            </tr>
            <tr height=56 style='mso-height-source:userset;height:42.0pt'>
              <td colspan=3 height=56 class=xl114 width=230 style='border-right:.5pt solid black;
              height:42.0pt;width:174pt'>${machine.machineName}</td>
              <td colspan=2 class=xl114 width=92 style='border-right:.5pt solid black;
              border-left:none;width:70pt'>${machine.machineSerialNo}</td>
              <td class=xl66 width=62 style='border-top:none;border-left:none;width:47pt'>${machine.makeModel}</td>
              <td colspan=4 class=xl114 width=68 style='border-right:.5pt solid black;
              border-left:none;width:52pt'>${machine.capacity}</td>
              <td colspan=3 class=xl114 width=60 style='border-right:.5pt solid black;
              border-left:none;width:47pt'>${machine.yearOfMake}</td>
              <td colspan=5 class=xl114 width=104 style='border-right:.5pt solid black;
              border-left:none;width:81pt'>${machine.sumInsured}</td>
              <td colspan=2 class=xl114 width=77 style='border-right:.5pt solid black;
              border-left:none;width:58pt'>${machine.escalation}</td>
              <td colspan=3 class=xl114 width=130 style='border-right:.5pt solid black;
              border-left:none;width:98pt'>${machine.excess}</td>
              <td></td>
            </tr>
          `;
        });
      }
      
      // Replace the template equipment section with our generated HTML
      if (htmlContent.includes('<tr>New</tr>') && htmlContent.includes('<tr>End</tr>')) {
        htmlContent = htmlContent.replace(
          /<tr>New<\/tr>[\s\S]*?<tr>End<\/tr>/,
          `${equipmentScheduleHtml}`
        );
      } else {
        console.warn("Could not find equipment section markers in template");
        // Try to find another place to inject the equipment details
        const alternateInsertPoint = htmlContent.indexOf('<div id="multilEquipment">');
        if (alternateInsertPoint !== -1) {
          htmlContent = htmlContent.slice(0, alternateInsertPoint + '<div id="multilEquipment">'.length) + 
                       equipmentScheduleHtml + 
                       htmlContent.slice(alternateInsertPoint + '<div id="multilEquipment">'.length);
        } else {
          console.error("No suitable insertion point found for equipment details");
        }
      }
      
      // Process other template replacements similar to CPMPreview
      // Calculate consolidated values from addresses
      let totalSumInsured = 0;
      let totalTerrorPremium = 0;
      let totalPremiumBeforeGST = 0;
      let totalGST = 0;
      let totalGrossPremium = 0;
      let allEquipments = [];
      let allLocations = [];
      
      // Process addresses to calculate combined totals
      addresses[0].forEach((address, i) => {
        if (!address) return;
       
        
        // Add location to consolidated locations list
        const locationAddress = `${address.addressLine1 || ""}, ${address.areaVillage || ""}, ${address.districtCity || ""}, ${address.state || ""}, ${address.pincode || ""}`;
        allLocations.push(`Location ${i+1}: ${address.name || "Unknown"} - ${locationAddress}`);
        
        // Add equipment details to consolidated equipment list
        if (address.equipmentDetails && address.equipmentDetails.length > 0) {
          address.equipmentDetails.forEach(item => {
            allEquipments.push(`${item.equipment || "Unknown"} (Location ${i+1}: ${address.name || "Unknown"})`);
          });
        }
        
        // Process sum insured and premiums
        totalSumInsured += address.totalSumInsured || 0;
        
        // Process premium (simplified, adjust as needed for your specific calculations)
        if (address.premium) {
          totalPremiumBeforeGST += address.premium || 0;
          totalGST += ((address.premium) * 18) / 100;
          totalGrossPremium += address.premium + ((address.premium) * 18) / 100;
        }

        if (address.sections) {
          Object.values(address.sections).forEach(section => {
            if (section.terrorism) {
              totalTerrorPremium += section.terrorism;
            }
          });
        }
      });
      
      // Get first address for some fields that won't be combined
      const firstAddress = addresses[0][0] || {};
      const currentDate = formatDate(new Date().toISOString())

      // Create consolidated replacements
      const replacements = {
        '{total}': totalSumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{over-sum}': totalSumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{terror-sum}': totalSumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{terror-premium}': totalTerrorPremium.toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{total-pre}': (totalPremiumBeforeGST-totalTerrorPremium).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{gst}': (totalGST/2).toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{overall-pre}': totalGrossPremium.toLocaleString('en-IN', {maximumFractionDigits: 2}),
        '{name}': firstAddress.name, // Could be changed to a list of all names if preferred
        '{address}': locationAddress, 
        '{pan}': firstAddress.panNumber,
        '{now}': currentDate,
        '{location-address}': allLocations.join('\n'),
        '{from}': firstAddress.policyPeriod || '',
        '{to}': firstAddress.policyEndPeriod || '',
        '{phone}': firstAddress.mobile,
      };
      
      // Apply all replacements
      Object.entries(replacements).forEach(([key, value]) => {
        htmlContent = htmlContent.replace(new RegExp(key, 'g'), value);
      });
      
      // Create addon rows similarly to CPMPreview
      let addonRows = "";
      const allAddons = {};
      
      // Combine addons from all addresses
      addresses.forEach((address, index) => {
        if (address && address.addonDetails && address.addonDetails.length > 0) {
          address.addonDetails.forEach(addon => {
            const addonKey = addon.addonCoverName || addon.name || "N/A";
            
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
      });
      
      // Generate rows for consolidated addons
      Object.entries(allAddons).forEach(([addonName, data]) => {
        addonRows += `
          <tr height=19 style='height:14.5pt'>
            <td height=19 class=xl83 style='height:14.5pt;border-top:none'>${addonName}</td>
            <td class=xl81 style='border-top:none;border-left:none'><span
            style='mso-spacerun:yes'></span>${data.sumInsured.toLocaleString('en-IN', {maximumFractionDigits: 2})}<span
            style='mso-spacerun:yes'></span></td>
            <td class=xl82 style='border-top:none;border-left:none'><span
            style='mso-spacerun:yes'></span>${data.rate.toLocaleString('en-IN', {maximumFractionDigits: 2})}<span
            style='mso-spacerun:yes'></span></td>
            <td class=xl72 style='border-top:none;border-left:none'><span
            style='mso-spacerun:yes'></span>${data.premium.toLocaleString('en-IN', {maximumFractionDigits: 2})}<span
            style='mso-spacerun:yes'></span></td>
          </tr>`;
      });
      
      // Replace addon section in template
      const addonReplacementPattern = /<tr>AddonNew<\/tr>[\s\S]*?<tr>AddonEnd<\/tr>/;
      if (htmlContent.match(addonReplacementPattern)) {
        htmlContent = htmlContent.replace(
          addonReplacementPattern,
          `<tr>AddonNew</tr>${addonRows}<tr>AddonEnd</tr>`
        );
      } else {
        console.warn("Could not find addon section markers in template");
      }
      
      // Open the preview in a new window
      const newWindow = window.open("", "_blank", "width=700,height=600,title=CPM Preview");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        console.error("Failed to open preview window");
        return "Failed to open preview window - pop-up may be blocked";
      }

      if(isMarine){
        processMarineSchedule(full_summary, summary);
      }
      
      return "Policy generated successfully";
    } catch (error) {
      console.error("Error generating CPM preview:", error);
      return "Error generating CPM preview: " + error.message;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedSummaries = React.useMemo(() => {
    let sortableSummaries = [...summaries];
    if (sortConfig.key) {
      sortableSummaries.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableSummaries;
  }, [summaries, sortConfig]);

  const filteredSummaries = sortedSummaries.filter(summary => 
    summary.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.summary_id.toString().includes(searchTerm)
  );

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <span className="error-icon">⚠️</span>
        <div className="error-message">{error}</div>
        <button 
          onClick={loadQuoteSummaries}
          className="error-retry"
        >
          <span>↻</span> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="quote-container">
      {showPaymentDialog && (
        <div className="payment-dialog-overlay">
          <div className="payment-dialog">
            <div className="payment-dialog-header">
              <h3>Payment Confirmation</h3>
            </div>
            <div className="payment-dialog-content">
              <p>Has the payment been completed for this quote?</p>
            </div>
            <div className="payment-dialog-actions">
              <button 
                onClick={() => handlePaymentConfirmation(true)}
                className="button button-primary"
              >
                Yes
              </button>
              <button 
                onClick={() => handlePaymentConfirmation(false)}
                className="button button-secondary"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="quote-header">
        <h2 className="quote-title">
          <span className="quote-title-icon">📋</span>
          Insurance Quote Summaries
        </h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by ID or User..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <button 
            onClick={loadQuoteSummaries}
            className="button button-primary"
          >
            <span className="button-icon">↻</span> Refresh
          </button>
        </div>
      </div>
      
      {filteredSummaries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p className="empty-title">No quote summaries found</p>
          <p className="empty-subtitle">Try adjusting your search or create a new quote</p>
        </div>
      ) : (
        <div className="quote-table-container">
          <table className="quote-table">
            <thead className="table-header">
              <tr>
                <th onClick={() => requestSort('summary_id')}>
                  <div className="table-header-cell">
                    ID {getSortIndicator('summary_id')}
                  </div>
                </th>
                <th onClick={() => requestSort('user')}>
                  <div className="table-header-cell">
                    User {getSortIndicator('user')}
                  </div>
                </th>
                <th>
                  <div className="table-header-cell">
                    <span className="header-icon">📍</span> Locations
                  </div>
                </th>
                <th>
                  <div className="table-header-cell">
                    <span className="header-icon">📑</span> Sections
                  </div>
                </th>
                <th>
                  <div className="table-header-cell">
                    <span className="header-icon">📦</span> Components
                  </div>
                </th>
                <th onClick={() => requestSort('sum_insured')}>
                  <div className="table-header-cell">
                    <span className="header-icon">💰</span> Sum Insured {getSortIndicator('sum_insured')}
                  </div>
                </th>
                <th onClick={() => requestSort('premium')}>
                  <div className="table-header-cell">
                    <span className="header-icon">💵</span> Premium {getSortIndicator('premium')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredSummaries.map((summary) => (
                <tr key={summary.summary_id}>
                  <td className="cell-id">
                    #{summary.summary_id}
                  </td>
                  <td className="cell-user">
                    {summary.user}
                  </td>
                  <td>
                    <div className="tags-container">
                      {summary.locations?.split('., ').map((location, idx) => (
                        <div key={idx} className="location-tag">
                          {location.trim()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="tags-container">
                      {summary.sections?.split(',').map((section, idx) => (
                        <span key={idx} className="section-tag">
                          {section.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="tags-container">
                      {summary.components?.split(',').map((component, idx) => (
                        <span key={idx} className="component-tag">
                          {component.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="amount-cell">
                    {formatCurrency(summary.sum_insured)}
                  </td>
                  <td className="amount-cell">
                    {formatCurrency(summary.premium)}
                  </td>
                  <td className="amount-cell">
                    <button
                      onClick={() => initiateSchedule(summary.full_summary, summary)}
                      className="button button-secondary"
                    >
                     Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="table-footer">
        <span>Showing {filteredSummaries.length} of {summaries.length} quotes</span>
      </div>
    </div>
  );
};

export default Quote;