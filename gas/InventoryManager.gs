/**
 * Inventory Manager for TVRI Equipment Management System
 * Handles inventory data operations and status management
 */

/**
 * Get complete inventory data with real-time status
 */
function getInventoryData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      inventorySheet = createInventorySheet(spreadsheet);
      populateInitialInventory(inventorySheet);
    }
    
    const data = inventorySheet.getDataRange().getValues();
    const inventory = {};
    
    // Skip header row (index 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const equipmentName = row[0];
      const equipmentType = row[1];
      const status = row[2] || 'TERSEDIA';
      const condition = row[3] || 'Good';
      const borrower = row[4] || '';
      const lastUpdate = row[5] || '';
      const totalBorrows = row[6] || 0;
      
      if (equipmentName && equipmentType) {
        if (!inventory[equipmentType]) {
          inventory[equipmentType] = [];
        }
        
        inventory[equipmentType].push({
          name: equipmentName,
          status: status.toLowerCase() === 'dipinjam' ? 'borrowed' : 'available',
          condition: condition.toLowerCase(),
          borrower: borrower,
          lastUpdate: lastUpdate,
          totalBorrows: totalBorrows
        });
      }
    }
    
    Logger.log(`Inventory data retrieved: ${Object.keys(inventory).length} categories`);
    return inventory;
    
  } catch (error) {
    throw new Error(`Gagal mengambil data inventaris: ${error.message}`);
  }
}

/**
 * Update inventory status when equipment is borrowed or returned
 */
function updateInventoryStatus(equipmentName, status, condition, borrower) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      inventorySheet = createInventorySheet(spreadsheet);
      populateInitialInventory(inventorySheet);
    }
    
    const data = inventorySheet.getDataRange().getValues();
    let equipmentFound = false;
    
    // Find and update the equipment row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowEquipmentName = row[0];
      
      if (rowEquipmentName === equipmentName) {
        // Update status, condition, borrower, last update, and increment borrow count if borrowing
        inventorySheet.getRange(i + 1, 3).setValue(status); // Status
        inventorySheet.getRange(i + 1, 4).setValue(condition); // Condition
        inventorySheet.getRange(i + 1, 5).setValue(borrower); // Current Borrower
        inventorySheet.getRange(i + 1, 6).setValue(new Date().toLocaleString('id-ID')); // Last Update
        
        // Increment total borrows if this is a new borrowing
        if (status === 'DIPINJAM') {
          const currentBorrows = row[6] || 0;
          inventorySheet.getRange(i + 1, 7).setValue(parseInt(currentBorrows) + 1);
        }
        
        equipmentFound = true;
        Logger.log(`Inventory updated: ${equipmentName} -> ${status}`);
        break;
      }
    }
    
    if (!equipmentFound) {
      Logger.log(`Equipment not found in inventory: ${equipmentName}`);
      // Optionally add new equipment to inventory
      addNewEquipmentToInventory(equipmentName, 'other', status, condition, borrower);
    }
    
  } catch (error) {
    throw new Error(`Gagal update status inventaris: ${error.message}`);
  }
}

/**
 * Check if equipment is available for borrowing
 */
function isEquipmentAvailable(equipmentName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      return false;
    }
    
    const data = inventorySheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowEquipmentName = row[0];
      const status = row[2] || 'TERSEDIA';
      
      if (rowEquipmentName === equipmentName) {
        return status.toUpperCase() === 'TERSEDIA';
      }
    }
    
    return false; // Equipment not found
    
  } catch (error) {
    Logger.log(`Error checking equipment availability: ${error.message}`);
    return false;
  }
}

/**
 * Check if equipment is currently borrowed
 */
function isEquipmentBorrowed(equipmentName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      return false;
    }
    
    const data = inventorySheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowEquipmentName = row[0];
      const status = row[2] || 'TERSEDIA';
      
      if (rowEquipmentName === equipmentName) {
        return status.toUpperCase() === 'DIPINJAM';
      }
    }
    
    return false; // Equipment not found
    
  } catch (error) {
    Logger.log(`Error checking equipment borrow status: ${error.message}`);
    return false;
  }
}

/**
 * Create inventory sheet with proper structure
 */
function createInventorySheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SHEET_NAMES.INVENTORY);
  
  // Header columns
  const headers = [
    'Nama/Model Alat',
    'Jenis Alat',
    'Status Saat Ini',
    'Kondisi Terakhir',
    'Peminjam Saat Ini',
    'Terakhir Diupdate',
    'Total Peminjaman'
  ];
  
  // Set header
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#FF9800');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setWrap(true);
  headerRange.setVerticalAlignment('middle');
  
  // Set column widths
  const columnWidths = [200, 120, 120, 120, 150, 150, 120];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add data validation for status column
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TERSEDIA', 'DIPINJAM', 'MAINTENANCE', 'RUSAK'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 3, 1000, 1).setDataValidation(statusValidation);
  
  // Add data validation for condition column
  const conditionValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 1000, 1).setDataValidation(conditionValidation);
  
  return sheet;
}

/**
 * Populate initial inventory with sample equipment
 */
function populateInitialInventory(inventorySheet) {
  const currentTime = new Date().toLocaleString('id-ID');
  
  const initialData = [
    // Kamera
    ['Canon EOS R6', 'camera', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Sony A7 III', 'camera', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Nikon D850', 'camera', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Canon 5D Mark IV', 'camera', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Fujifilm X-T4', 'camera', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    
    // Laptop
    ['MacBook Pro 16" M1', 'laptop', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['MacBook Air 13" M2', 'laptop', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Dell XPS 15', 'laptop', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['ThinkPad X1 Carbon', 'laptop', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Surface Laptop 5', 'laptop', 'TERSEDIA', 'Good', '', currentTime, 0],
    
    // Proyektor
    ['Epson EB-X05', 'projector', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['BenQ MH535FHD', 'projector', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Sony VPL-EX315', 'projector', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Canon LV-X420', 'projector', 'TERSEDIA', 'Good', '', currentTime, 0],
    
    // Mikropon
    ['Shure SM58', 'microphone', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Audio-Technica AT2020', 'microphone', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Rode PodMic', 'microphone', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Blue Yeti', 'microphone', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Sennheiser e935', 'microphone', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    
    // Speaker
    ['JBL Xtreme 3', 'speaker', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Bose SoundLink', 'speaker', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Harman Kardon Onyx', 'speaker', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Sony SRS-XB43', 'speaker', 'TERSEDIA', 'Good', '', currentTime, 0],
    
    // Tablet
    ['iPad Pro 12.9"', 'tablet', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['iPad Air 5', 'tablet', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Samsung Galaxy Tab S8', 'tablet', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Surface Pro 9', 'tablet', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    
    // Monitor
    ['Dell UltraSharp 27"', 'monitor', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['LG 4K 32"', 'monitor', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Samsung Odyssey G7', 'monitor', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['ASUS ProArt 24"', 'monitor', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    
    // Printer
    ['HP LaserJet Pro', 'printer', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Canon Pixma Pro', 'printer', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Epson EcoTank', 'printer', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Brother HL-L2350DW', 'printer', 'TERSEDIA', 'Good', '', currentTime, 0],
    
    // Lainnya
    ['Tripod Manfrotto', 'other', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Gimbal DJI OM5', 'other', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Power Bank Anker', 'other', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['External SSD 1TB', 'other', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Memory Card 64GB', 'other', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Camera Lens 24-70mm', 'other', 'TERSEDIA', 'Excellent', '', currentTime, 0],
    ['Lighting Kit Studio', 'other', 'TERSEDIA', 'Good', '', currentTime, 0],
    ['Extension Cable 10m', 'other', 'TERSEDIA', 'Good', '', currentTime, 0]
  ];
  
  // Insert data starting from row 2 (after header)
  const range = inventorySheet.getRange(2, 1, initialData.length, 7);
  range.setValues(initialData);
  
  Logger.log(`Initial inventory populated with ${initialData.length} items`);
}

/**
 * Add new equipment to inventory
 */
function addNewEquipmentToInventory(equipmentName, equipmentType, status, condition, borrower) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      inventorySheet = createInventorySheet(spreadsheet);
    }
    
    const newRow = [
      equipmentName,
      equipmentType,
      status,
      condition,
      borrower,
      new Date().toLocaleString('id-ID'),
      status === 'DIPINJAM' ? 1 : 0
    ];
    
    inventorySheet.appendRow(newRow);
    Logger.log(`New equipment added to inventory: ${equipmentName}`);
    
  } catch (error) {
    throw new Error(`Gagal menambah peralatan baru: ${error.message}`);
  }
}

/**
 * Get equipment by type and status
 */
function getEquipmentByTypeAndStatus(equipmentType, status) {
  try {
    const inventory = getInventoryData();
    const equipmentList = inventory[equipmentType] || [];
    
    return equipmentList.filter(item => {
      const itemStatus = item.status === 'borrowed' ? 'DIPINJAM' : 'TERSEDIA';
      return itemStatus === status.toUpperCase();
    });
    
  } catch (error) {
    throw new Error(`Gagal mengambil peralatan berdasarkan tipe dan status: ${error.message}`);
  }
}

/**
 * Get inventory statistics
 */
function getInventoryStats() {
  try {
    const inventory = getInventoryData();
    const stats = {
      total: 0,
      available: 0,
      borrowed: 0,
      byType: {},
      lastUpdate: new Date().toISOString()
    };
    
    Object.entries(inventory).forEach(([type, items]) => {
      stats.byType[type] = {
        total: items.length,
        available: 0,
        borrowed: 0
      };
      
      items.forEach(item => {
        stats.total++;
        stats.byType[type].total++;
        
        if (item.status === 'available') {
          stats.available++;
          stats.byType[type].available++;
        } else if (item.status === 'borrowed') {
          stats.borrowed++;
          stats.byType[type].borrowed++;
        }
      });
    });
    
    return stats;
    
  } catch (error) {
    throw new Error(`Gagal mengambil statistik inventaris: ${error.message}`);
  }
}

/**
 * Backup inventory data
 */
function backupInventoryData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      throw new Error('Inventory sheet not found');
    }
    
    // Create backup sheet with timestamp
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    const backupSheetName = `Backup_Inventory_${timestamp}`;
    
    const backupSheet = inventorySheet.copyTo(spreadsheet);
    backupSheet.setName(backupSheetName);
    
    Logger.log(`Inventory backup created: ${backupSheetName}`);
    return backupSheetName;
    
  } catch (error) {
    throw new Error(`Gagal backup inventaris: ${error.message}`);
  }
}

/**
 * Validate inventory data integrity
 */
function validateInventoryData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      throw new Error('Inventory sheet not found');
    }
    
    const data = inventorySheet.getDataRange().getValues();
    const issues = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const equipmentName = row[0];
      const equipmentType = row[1];
      const status = row[2];
      const condition = row[3];
      
      // Check for missing required fields
      if (!equipmentName) {
        issues.push(`Row ${i + 1}: Missing equipment name`);
      }
      
      if (!equipmentType) {
        issues.push(`Row ${i + 1}: Missing equipment type`);
      }
      
      // Check for valid status values
      const validStatuses = ['TERSEDIA', 'DIPINJAM', 'MAINTENANCE', 'RUSAK'];
      if (status && !validStatuses.includes(status.toUpperCase())) {
        issues.push(`Row ${i + 1}: Invalid status '${status}'`);
      }
      
      // Check for valid condition values
      const validConditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
      if (condition && !validConditions.includes(condition)) {
        issues.push(`Row ${i + 1}: Invalid condition '${condition}'`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      totalRows: data.length - 1,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Gagal validasi data inventaris: ${error.message}`);
  }
}

/**
 * Clean up inventory data (removes duplicates, fixes formatting)
 */
function cleanupInventoryData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    if (!inventorySheet) {
      throw new Error('Inventory sheet not found');
    }
    
    const data = inventorySheet.getDataRange().getValues();
    const cleanData = [];
    const seenEquipment = new Set();
    
    // Keep header
    cleanData.push(data[0]);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const equipmentName = row[0];
      
      // Skip empty rows
      if (!equipmentName) continue;
      
      // Remove duplicates (keep first occurrence)
      if (seenEquipment.has(equipmentName)) {
        Logger.log(`Duplicate removed: ${equipmentName}`);
        continue;
      }
      
      seenEquipment.add(equipmentName);
      
      // Fix formatting
      row[2] = row[2] ? row[2].toString().toUpperCase() : 'TERSEDIA'; // Status
      row[3] = row[3] ? row[3].toString() : 'Good'; // Condition
      row[6] = parseInt(row[6]) || 0; // Total borrows
      
      cleanData.push(row);
    }
    
    // Update sheet with clean data
    inventorySheet.clear();
    inventorySheet.getRange(1, 1, cleanData.length, cleanData[0].length).setValues(cleanData);
    
    Logger.log(`Inventory cleanup completed. ${cleanData.length - 1} items remaining.`);
    
    return {
      originalCount: data.length - 1,
      cleanCount: cleanData.length - 1,
      duplicatesRemoved: (data.length - 1) - (cleanData.length - 1),
      timestamp: new Date().toISOString()
    };
    
    
  } catch (error) {
    throw new Error(`Gagal cleanup inventaris: ${error.message}`);
  }
}
