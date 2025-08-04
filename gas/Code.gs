/**
 * Google Apps Script untuk Sistem Pencatatan Alat Digital TVRI World
 * Versi dengan Inventaris Terpusat dan Status Real-time
 * 
 * Deployment Instructions:
 * 1. Buka Google Apps Script (script.google.com)
 * 2. Buat proyek baru
 * 3. Copy semua file .gs ke dalam proyek
 * 4. Update SPREADSHEET_ID dengan ID spreadsheet Anda
 * 5. Deploy sebagai Web App dengan akses "Anyone"
 * 6. Copy URL deployment ke CONFIG.GAS_WEB_APP_URL di frontend
 */

// GANTI INI DENGAN ID SPREADSHEET ANDA
const SPREADSHEET_ID = '1iSMUBc8z6D4si7fT-brAFCuBW1FyE9cJobIhyAdg-0w';

// Nama sheet untuk setiap jenis data
const SHEET_NAMES = {
  BORROW: 'Data_Peminjaman',
  RETURN: 'Data_Pengembalian', 
  INVENTORY: 'Master_Inventaris',
  LOG: 'System_Log'
};

// Lock untuk mencegah concurrent access
const LOCK_TIMEOUT = 30000; // 30 seconds

/**
 * Fungsi utama untuk menangani request POST dari frontend
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // Acquire lock dengan timeout
    if (!lock.tryLock(LOCK_TIMEOUT)) {
      throw new Error('System sedang sibuk, silakan coba lagi dalam beberapa saat');
    }
    
    // Parse request data
    const data = JSON.parse(e.postData.contents);
    logSystemActivity('POST_REQUEST', data.action, data);
    
    let result;
    
    switch (data.action) {
      case 'borrow':
        result = processBorrowRequest(data);
        break;
        
      case 'return':
        result = processReturnRequest(data);
        break;
        
      case 'get_inventory':
        result = getInventoryData();
        break;
        
      case 'test_connection':
        result = testConnection();
        break;
        
      default:
        throw new Error(`Tipe aksi tidak valid: ${data.action}`);
    }
    
    logSystemActivity('SUCCESS', data.action, result);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data berhasil diproses',
        result: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorMessage = error.toString();
    logSystemActivity('ERROR', e.postData ? JSON.parse(e.postData.contents).action : 'UNKNOWN', {
      error: errorMessage,
      stack: error.stack
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    // Release lock
    lock.releaseLock();
  }
}

/**
 * Fungsi untuk menangani request GET (untuk testing dan health check)
 */
function doGet(e) {
  try {
    const healthCheck = {
      message: 'TVRI Equipment Management System - Google Apps Script berjalan dengan baik!',
      timestamp: new Date().toISOString(),
      status: 'OK',
      version: '2.0.0',
      spreadsheetId: SPREADSHEET_ID,
      uptime: Session.getTemporaryActiveUserKey() ? 'Active' : 'Ready'
    };
    
    logSystemActivity('HEALTH_CHECK', 'GET_REQUEST', healthCheck);
    
    return ContentService
      .createTextOutput(JSON.stringify(healthCheck))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test connection function
 */
function testConnection() {
  try {
    // Test spreadsheet access
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetCount = spreadsheet.getSheets().length;
    
    return {
      status: 'connected',
      spreadsheetId: SPREADSHEET_ID,
      sheetCount: sheetCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Gagal terhubung ke spreadsheet: ${error.message}`);
  }
}

/**
 * Process borrow request
 */
function processBorrowRequest(data) {
  try {
    // Validate required fields
    const requiredFields = ['borrowerName', 'eventName', 'equipmentType', 'equipmentName', 'pickupDate', 'pickupTime', 'borrowCondition'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Field ${field} harus diisi`);
      }
    }
    
    // Check if equipment is available
    if (!isEquipmentAvailable(data.equipmentName)) {
      throw new Error(`Alat ${data.equipmentName} sedang dipinjam atau tidak tersedia`);
    }
    
    // Record borrowing
    const borrowResult = recordBorrowing(data);
    
    // Update inventory status
    updateInventoryStatus(data.equipmentName, 'DIPINJAM', data.borrowCondition, data.borrowerName);
    
    return {
      action: 'borrow',
      equipment: data.equipmentName,
      borrower: data.borrowerName,
      borrowId: borrowResult.id
    };
    
  } catch (error) {
    throw new Error(`Gagal memproses peminjaman: ${error.message}`);
  }
}

/**
 * Process return request
 */
function processReturnRequest(data) {
  try {
    // Validate required fields
    const requiredFields = ['returnBorrowerName', 'returnEquipmentName', 'returnDate', 'returnTime', 'returnCondition'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Field ${field} harus diisi`);
      }
    }
    
    // Check if equipment is currently borrowed
    if (!isEquipmentBorrowed(data.returnEquipmentName)) {
      throw new Error(`Alat ${data.returnEquipmentName} tidak sedang dipinjam`);
    }
    
    // Record return
    const returnResult = recordReturn(data);
    
    // Update inventory status
    updateInventoryStatus(data.returnEquipmentName, 'TERSEDIA', data.returnCondition, '');
    
    return {
      action: 'return',
      equipment: data.returnEquipmentName,
      returnedBy: data.returnBorrowerName,
      returnId: returnResult.id
    };
    
  } catch (error) {
    throw new Error(`Gagal memproses pengembalian: ${error.message}`);
  }
}

/**
 * Log system activity for debugging and monitoring
 */
function logSystemActivity(type, action, details) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = spreadsheet.getSheetByName(SHEET_NAMES.LOG);
    
    if (!logSheet) {
      logSheet = createLogSheet(spreadsheet);
    }
    
    const logEntry = [
      new Date().toLocaleString('id-ID'),
      type,
      action,
      JSON.stringify(details),
      Session.getActiveUser().getEmail() || 'Anonymous'
    ];
    
    logSheet.appendRow(logEntry);
    
    // Keep only last 1000 log entries
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1001) { // 1000 entries + header
      logSheet.deleteRows(2, lastRow - 1001);
    }
    
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Create log sheet
 */
function createLogSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(SHEET_NAMES.LOG);
  
  const headers = [
    'Timestamp',
    'Type',
    'Action', 
    'Details',
    'User'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#9E9E9E');
  headerRange.setFontColor('#FFFFFF');
  
  // Set column widths
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 100); // Type
  sheet.setColumnWidth(3, 150); // Action
  sheet.setColumnWidth(4, 400); // Details
  sheet.setColumnWidth(5, 200); // User
  
  return sheet;
}

/**
 * Initialize spreadsheet with all required sheets
 */
function initializeSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Check and create required sheets
    if (!spreadsheet.getSheetByName(SHEET_NAMES.BORROW)) {
      createBorrowSheet(spreadsheet);
    }
    
    if (!spreadsheet.getSheetByName(SHEET_NAMES.RETURN)) {
      createReturnSheet(spreadsheet);
    }
    
    if (!spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY)) {
      const inventorySheet = createInventorySheet(spreadsheet);
      populateInitialInventory(inventorySheet);
    }
    
    if (!spreadsheet.getSheetByName(SHEET_NAMES.LOG)) {
      createLogSheet(spreadsheet);
    }
    
    logSystemActivity('INITIALIZATION', 'SPREADSHEET_SETUP', { 
      sheetsCreated: Object.values(SHEET_NAMES) 
    });
    
    return 'Spreadsheet initialized successfully';
    
  } catch (error) {
    throw new Error(`Failed to initialize spreadsheet: ${error.message}`);
  }
}

/**
 * Manual function to setup spreadsheet (run once)
 */
function setupSpreadsheet() {
  return initializeSpreadsheet();
}

/**
 * Get system statistics
 */
function getSystemStats() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    const borrowSheet = spreadsheet.getSheetByName(SHEET_NAMES.BORROW);
    const returnSheet = spreadsheet.getSheetByName(SHEET_NAMES.RETURN);
    const inventorySheet = spreadsheet.getSheetByName(SHEET_NAMES.INVENTORY);
    
    const stats = {
      totalBorrows: borrowSheet ? borrowSheet.getLastRow() - 1 : 0,
      totalReturns: returnSheet ? returnSheet.getLastRow() - 1 : 0,
      totalEquipment: inventorySheet ? inventorySheet.getLastRow() - 1 : 0,
      lastActivity: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID
    };
    
    return stats;
    
  } catch (error) {
    throw new Error(`Failed to get system stats: ${error.message}`);
  }
}
