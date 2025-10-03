/**
 * Google Apps Script Web App Backend with JSONP Support
 * Handles inventory data operations without CORS issues
 */

// Configuration - Update these values for your specific setup
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your actual Sheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your actual sheet name

/**
 * Main doGet function - handles all requests
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const callback = params.callback;
    // GET requests are only for reading data
    const action = 'getData';
    
    const result = getData();
    
    // Return JSONP response if callback is provided
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(result) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Return regular JSON response
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorResult = {
      status: 'error',
      message: 'Server error: ' + error.toString()
    };
    
    const callback = e.parameter?.callback;
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(errorResult) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main doPost function - handles POST requests with JSON body
 */
function doPost(e) {
  try {
    // Parse JSON body from POST request
    const postData = e.postData;
    if (!postData || !postData.contents) {
      throw new Error('No POST data received');
    }
    
    let requestData;
    try {
      requestData = JSON.parse(postData.contents);
    } catch (parseError) {
      throw new Error('Invalid JSON in POST body: ' + parseError.toString());
    }
    
    const action = requestData.action;
    let result;
    
    switch (action) {
      case 'updateChecked':
        result = updateChecked(requestData.VFID, requestData.Checked);
        break;
      case 'updateNote':
        result = updateNote(requestData.VFID, requestData.Note);
        break;
      case 'updateBoth':
        result = updateBoth(requestData.VFID, requestData.Checked, requestData.Note);
        break;
      case 'testConnection':
        result = testConnection();
        break;
      default:
        result = {
          status: 'error',
          message: 'Invalid action. Supported POST actions: updateChecked, updateNote, updateBoth, testConnection'
        };
    }
    
    // Always return JSON for POST requests
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorResult = {
      status: 'error',
      message: 'POST request error: ' + error.toString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all data from the sheet
 */
function getData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      return {
        status: 'success',
        data: [],
        message: 'No data found in sheet'
      };
    }
    
    // Get headers from first row
    const headers = values[0];
    const data = [];
    
    // Convert rows to objects
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const item = {};
      
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Handle different data types
        if (header === 'Checked') {
          item[header] = value === true || value === 'TRUE' || value === 'true';
        } else if (header === 'Quantity' || header === 'OrdersCount' || !isNaN(Number(header))) {
          item[header] = Number(value) || 0;
        } else {
          item[header] = String(value || '');
        }
      });
      
      data.push(item);
    }
    
    return {
      status: 'success',
      data: data,
      message: `Successfully loaded ${data.length} items`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to get data: ' + error.toString()
    };
  }
}

/**
 * Update checked status for a specific VFID
 */
function updateChecked(vfid, checked) {
  try {
    if (!vfid) {
      throw new Error('VFID is required');
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0];
    
    // Find VFID and Checked column indices
    const vfidIndex = headers.indexOf('VFID');
    const checkedIndex = headers.indexOf('Checked');
    
    if (vfidIndex === -1) {
      throw new Error('VFID column not found');
    }
    if (checkedIndex === -1) {
      throw new Error('Checked column not found');
    }
    
    // Find the row with matching VFID
    let rowFound = false;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][vfidIndex]) === String(vfid)) {
        const checkedValue = checked === 'true' || checked === true;
        sheet.getRange(i + 1, checkedIndex + 1).setValue(checkedValue);
        rowFound = true;
        break;
      }
    }
    
    if (!rowFound) {
      throw new Error(`VFID "${vfid}" not found`);
    }
    
    return {
      status: 'success',
      message: `Successfully updated checked status for VFID: ${vfid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to update checked status: ' + error.toString()
    };
  }
}

/**
 * Update note for a specific VFID
 */
function updateNote(vfid, note) {
  try {
    if (!vfid) {
      throw new Error('VFID is required');
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0];
    
    // Find VFID and Notes column indices
    const vfidIndex = headers.indexOf('VFID');
    const notesIndex = headers.indexOf('Notes');
    
    if (vfidIndex === -1) {
      throw new Error('VFID column not found');
    }
    if (notesIndex === -1) {
      throw new Error('Notes column not found');
    }
    
    // Find the row with matching VFID
    let rowFound = false;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][vfidIndex]) === String(vfid)) {
        sheet.getRange(i + 1, notesIndex + 1).setValue(note || '');
        rowFound = true;
        break;
      }
    }
    
    if (!rowFound) {
      throw new Error(`VFID "${vfid}" not found`);
    }
    
    return {
      status: 'success',
      message: `Successfully updated note for VFID: ${vfid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to update note: ' + error.toString()
    };
  }
}

/**
 * Update both checked status and note for a specific VFID
 */
function updateBoth(vfid, checked, note) {
  try {
    if (!vfid) {
      throw new Error('VFID is required');
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0];
    
    // Find column indices
    const vfidIndex = headers.indexOf('VFID');
    const checkedIndex = headers.indexOf('Checked');
    const notesIndex = headers.indexOf('Notes');
    
    if (vfidIndex === -1) {
      throw new Error('VFID column not found');
    }
    if (checkedIndex === -1) {
      throw new Error('Checked column not found');
    }
    if (notesIndex === -1) {
      throw new Error('Notes column not found');
    }
    
    // Find the row with matching VFID
    let rowFound = false;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][vfidIndex]) === String(vfid)) {
        const checkedValue = checked === 'true' || checked === true;
        sheet.getRange(i + 1, checkedIndex + 1).setValue(checkedValue);
        sheet.getRange(i + 1, notesIndex + 1).setValue(note || '');
        rowFound = true;
        break;
      }
    }
    
    if (!rowFound) {
      throw new Error(`VFID "${vfid}" not found`);
    }
    
    return {
      status: 'success',
      message: `Successfully updated both checked status and note for VFID: ${vfid}`
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to update both fields: ' + error.toString()
    };
  }
}

/**
 * Test connection endpoint
 */
function testConnection() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }
    
    return {
      status: 'success',
      message: 'Connection test successful',
      timestamp: new Date().toISOString(),
      sheetName: SHEET_NAME
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: 'Connection test failed: ' + error.toString()
    };
  }
}

/**
 * Deployment Instructions:
 * 
 * 1. Update SHEET_ID and SHEET_NAME constants at the top of this file
 * 2. Save the script
 * 3. Click "Deploy" > "New deployment"
 * 4. Choose type: "Web app"
 * 5. Set execute as: "Me"
 * 6. Set access: "Anyone"
 * 7. Click "Deploy"
 * 8. Copy the web app URL
 * 
 * Usage Examples:
 * 
 * Get all data (GET request):
 * https://script.google.com/.../exec
 * 
 * Update data (POST request with JSON body):
 * POST https://script.google.com/.../exec
 * Body: {"action": "updateChecked", "VFID": "VF001", "Checked": true}
 * 
 * Update note (POST request with JSON body):
 * POST https://script.google.com/.../exec
 * Body: {"action": "updateNote", "VFID": "VF001", "Note": "My note"}
 * 
 * Update both (POST request with JSON body):
 * POST https://script.google.com/.../exec
 * Body: {"action": "updateBoth", "VFID": "VF001", "Checked": true, "Note": "My note"}
 */