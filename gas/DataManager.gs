/**
 * Data Manager for TVRI Equipment Management System
 * Handles CRUD operations for borrowing and returning equipment
 */

/**
 * Record equipment borrowing
 */
function recordBorrowing(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let borrowSheet = spreadsheet.getSheetByName(SHEET_NAMES.BORROW);
    
    if (!borrowSheet) {
      borrowSheet = createBorrowSheet(spreadsheet);
    }
    
    // Generate unique ID
    const borrowId = generateId('BRW');
    
    // Prepare row data
    const rowData = [
      borrowId,                           // ID
      new Date().toLocaleString('id-ID'), // Timestamp
      data.borrowerName || '',            // Nama Peminjam
      data.eventName || '',               // Nama Acara
      data.equipmentType || '',           // Jenis Alat
      data.equipmentName || '',           // Nama Alat
      data.pickupDate || '',              // Tanggal Pengambilan
      data.pickupTime || '',              // Waktu Pengambilan
      data.expectedReturnDate || '',      // Perkiraan Tanggal Kembali
      data.borrowCondition || '',         // Kondisi Saat Dipinjam
      data.borrowNotes || '',             // Catatan
      'DIPINJAM',                         // Status
      Session.getActiveUser().getEmail() || 'System' // User
    ];
    
    // Add data to sheet
    borrowSheet.appendRow(rowData);
    
    Logger.log(`Peminjaman dicatat: ${data.equipmentName} oleh ${data.borrowerName}`);
    
    return {
      id: borrowId,
      equipment: data.equipmentName,
      borrower: data.borrowerName,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Gagal mencatat peminjaman: ${error.message}`);
  }
}

/**
 * Record equipment return
 */
function recordReturn(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let returnSheet = spreadsheet.getSheetByName(SHEET_NAMES.RETURN);
    
    if (!returnSheet) {
      returnSheet = createReturnSheet(spreadsheet);
    }
    
    // Generate unique ID
    const returnId = generateId('RTN');
    
    // Prepare row data
    const rowData = [
      returnId,                            // ID
      new Date().toLocaleString('id-ID'),  // Timestamp
      data.returnBorrowerName || '',       // Nama Peminjam
      data.returnEquipmentName || '',      // Nama Alat
      data.returnDate || '',               // Tanggal Pengembalian
      data.returnTime || '',               // Waktu Pengembalian
      data.returnCondition || '',          // Kondisi Saat Dikembalikan
      data.returnNotes || '',              // Catatan Pengembalian
      'DIKEMBALIKAN',                      // Status
      Session.getActiveUser().getEmail() || 'System' // User
    ];
    
    // Add data to sheet
    returnSheet.appendRow(rowData);
    
    // Update corresponding borrow record
    updateBorrowStatus(data.returnEquipmentName, 'DIKEMBALIKAN', returnId);
    
    Logger.log(`Pengembalian dicatat: ${data.returnEquipmentName} oleh ${data.returnBorrowerName}`);
    
    return {
      id: returnId,
      equipment: data.returnEquipmentName,
      returnedBy: data.returnBorrowerName,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Gagal mencatat pengembalian: ${error.message}`);
  }
}

/**
 * Update borrow record status when equipment is returned
 */
function updateBorrowStatus(equipmentName, status, returnId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const borrowSheet = spreadsheet.getSheetByName(SHEET_NAMES.BORROW);
    
    if (!borrowSheet) return;
    
    const data = borrowSheet.getDataRange().getValues();
    
    // Find the most recent borrow record for this equipment that's still active
    for (let i = data.length - 1; i >= 1; i--) { // Start from bottom, skip header
      const row = data[i];
      const rowEquipmentName = row[5]; // Equipment name column
      const rowStatus = row[11]; // Status column
      
      if (rowEquipmentName === equipmentName && rowStatus === 'DIPINJAM') {
        // Update the status and add return reference
        borrowSheet.getRange(i + 1, 12).setValue(status); // Status column
        borrowSheet.getRange(i + 1, 13).setValue(Session.getActiveUser().getEmail() || 'System'); // User column
        
        // Add return ID as reference (assuming we add a new column for this)
        if (borrowSheet.getLastColumn() >= 14) {
          borrowSheet.getRange(i + 1, 14).setValue(returnId);
        }
        
        break; // Only update the first (most recent) matching record
      }
    }
    
  } catch (error) {
    Logger.log(`Gagal update status peminjaman: ${error.message}`);
  }
}

/**
 * Create borrow sheet with proper structure
 */
function createBorrowSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SHEET_NAMES.BORROW);
  
  // Header columns
  const headers = [
    'ID Peminjaman',
    'Waktu Pencatatan',
    'Nama Peminjam',
    'Nama Acara',
    'Jenis Alat',
    'Nama/Model Alat',
    'Tanggal Pengambilan',
    'Waktu Pengambilan',
    'Perkiraan Tanggal Kembali',
    'Kondisi Saat Dipinjam',
    'Catatan',
    'Status',
    'User',
    'Return ID Reference'
  ];
  
  // Set header
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setWrap(true);
  headerRange.setVerticalAlignment('middle');
  
  // Set column widths
  const columnWidths = [120, 150, 150, 200, 120, 200, 120, 100, 120, 120, 300, 100, 150, 120];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create return sheet with proper structure
 */
function createReturnSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SHEET_NAMES.RETURN);
  
  // Header columns
  const headers = [
    'ID Pengembalian',
    'Waktu Pencatatan',
    'Nama Peminjam',
    'Nama/Model Alat',
    'Tanggal Pengembalian',
    'Waktu Pengembalian',
    'Kondisi Saat Dikembalikan',
    'Catatan Pengembalian',
    'Status',
    'User'
  ];
  
  // Set header
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#34A853');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setWrap(true);
  headerRange.setVerticalAlignment('middle');
  
  // Set column widths
  const columnWidths = [120, 150, 150, 200, 120, 100, 120, 300, 100, 150];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Generate unique ID for records
 */
function generateId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get borrowing history for a specific equipment
 */
function getEquipmentHistory(equipmentName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const borrowSheet = spreadsheet.getSheetByName(SHEET_NAMES.BORROW);
    const returnSheet = spreadsheet.getSheetByName(SHEET_NAMES.RETURN);
    
    const history = {
      equipment: equipmentName,
      borrows: [],
      returns: [],
      currentStatus: 'TERSEDIA'
    };
    
    // Get borrow records
    if (borrowSheet) {
      const borrowData = borrowSheet.getDataRange().getValues();
      for (let i = 1; i < borrowData.length; i++) {
        const row = borrowData[i];
        if (row[5] === equipmentName) { // Equipment name column
          history.borrows.push({
            id: row[0],
            timestamp: row[1],
            borrower: row[2],
            event: row[3],
            pickupDate: row[6],
            pickupTime: row[7],
            condition: row[9],
            status: row[11]
          });
          
          if (row[11] === 'DIPINJAM') {
            history.currentStatus = 'DIPINJAM';
          }
        }
      }
    }
    
    // Get return records
    if (returnSheet) {
      const returnData = returnSheet.getDataRange().getValues();
      for (let i = 1; i < returnData.length; i++) {
        const row = returnData[i];
        if (row[3] === equipmentName) { // Equipment name column
          history.returns.push({
            id: row[0],
            timestamp: row[1],
            returnedBy: row[2],
            returnDate: row[4],
            returnTime: row[5],
            condition: row[6],
            notes: row[7]
          });
        }
      }
    }
    
    return history;
    
  } catch (error) {
    throw new Error(`Gagal mengambil riwayat peralatan: ${error.message}`);
  }
}

/**
 * Get all active borrowings
 */
function getActiveBorrowings() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const borrowSheet = spreadsheet.getSheetByName(SHEET_NAMES.BORROW);
    
    if (!borrowSheet) return [];
    
    const data = borrowSheet.getDataRange().getValues();
    const activeBorrowings = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[11] === 'DIPINJAM') { // Status column
        activeBorrowings.push({
          id: row[0],
          borrower: row[2],
          equipment: row[5],
          pickupDate: row[6],
          expectedReturn: row[8],
          condition: row[9]
        });
      }
    }
    
    return activeBorrowings;
    
  } catch (error) {
    throw new Error(`Gagal mengambil data peminjaman aktif: ${error.message}`);
  }
}

/**
 * Search equipment by various criteria
 */
function searchEquipment(searchTerm, searchType = 'name') {
  try {
    const inventory = getInventoryData();
    const results = [];
    
    Object.entries(inventory).forEach(([type, items]) => {
      items.forEach(item => {
        let match = false;
        
        switch (searchType) {
          case 'name':
            match = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            break;
          case 'type':
            match = type.toLowerCase().includes(searchTerm.toLowerCase());
            break;
          case 'status':
            match = item.status.toLowerCase().includes(searchTerm.toLowerCase());
            break;
          case 'borrower':
            match = item.borrower && item.borrower.toLowerCase().includes(searchTerm.toLowerCase());
            break;
          default:
            match = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   type.toLowerCase().includes(searchTerm.toLowerCase());
        }
        
        if (match) {
          results.push({
            ...item,
            type: type
          });
        }
      });
    });
    
    return results;
    
  } catch (error) {
    throw new Error(`Gagal mencari peralatan: ${error.message}`);
  }
}
