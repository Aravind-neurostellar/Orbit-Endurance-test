/**
 * Orbit Cognitive Assessment Suite - Google Sheets Backend
 * 
 * Paste this code into your Google Sheets Apps Script Editor:
 * 1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1A2ZqoX-TkrOWKKVfYG4Hb-WBzo4pHPY7QBFi18aMNB8/edit
 * 2. Click "Extensions" > "Apps Script" in the top menu.
 * 3. Delete any default code in Code.gs and paste this script.
 * 4. Save (click the disk icon).
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Click the gear icon ("Select type") > select "Web app".
 * 7. Configure:
 *    - Description: "Orbit Assessment Sync"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial to allow incoming fetch requests from the web page)
 * 8. Click "Deploy" and authorize access when prompted.
 * 9. Copy the "Web App URL" (ends in /exec). Paste this URL into the web page's setup form.
 */

function doPost(e) {
  try {
    // Parse the incoming JSON payload
    var data = JSON.parse(e.postData.contents);
    var participant = data.participantName || "Unknown";
    var timestamp = data.timestamp || new Date().toISOString();
    var sessionMode = data.sessionMode || "standard";
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ----------------------------------------------------
    // 1. WRITE SESSION SUMMARY TO "Session_Summaries" SHEET
    // ----------------------------------------------------
    var summarySheet = ss.getSheetByName("Session_Summaries");
    if (!summarySheet) {
      summarySheet = ss.insertSheet("Session_Summaries");
    }
    
    // Set headers if this is a fresh sheet
    if (summarySheet.getLastRow() === 0) {
      summarySheet.appendRow([
        "Timestamp", 
        "Participant Name", 
        "Session Mode",
        "SART2 Accuracy (%)", 
        "SART2 Mean RT (ms)", 
        "SART2 RT StdDev (ms)", 
        "SART2 Commission Errors", 
        "SART2 Omission Errors",
        "N-Back Accuracy (%)", 
        "N-Back Mean RT (ms)", 
        "N-Back Hit Rate (%)", 
        "N-Back False Alarm Rate (%)", 
        "N-Back Hits", 
        "N-Back Misses", 
        "N-Back False Alarms", 
        "N-Back Correct Rejections"
      ]);
      // Format headers
      summarySheet.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#e0e7ff");
    }
    
    summarySheet.appendRow([
      timestamp,
      participant,
      sessionMode,
      data.sartMetrics.accuracy,
      data.sartMetrics.meanRT !== null ? data.sartMetrics.meanRT : "N/A",
      data.sartMetrics.sdRT !== null ? data.sartMetrics.sdRT : "N/A",
      data.sartMetrics.commissionErrors,
      data.sartMetrics.omissionErrors,
      data.nbackMetrics.accuracy,
      data.nbackMetrics.meanRT !== null ? data.nbackMetrics.meanRT : "N/A",
      data.nbackMetrics.hitRate,
      data.nbackMetrics.faRate,
      data.nbackMetrics.hits,
      data.nbackMetrics.misses,
      data.nbackMetrics.falseAlarms,
      data.nbackMetrics.correctRejections
    ]);
    
    // ----------------------------------------------------
    // 2. WRITE INDIVIDUAL TRIAL LOGS TO "Trial_Logs" SHEET
    // ----------------------------------------------------
    var logsSheet = ss.getSheetByName("Trial_Logs");
    if (!logsSheet) {
      logsSheet = ss.insertSheet("Trial_Logs");
    }
    
    // Set headers if this is a fresh sheet
    if (logsSheet.getLastRow() === 0) {
      logsSheet.appendRow([
        "Timestamp", 
        "Participant Name", 
        "Session Mode", 
        "Task", 
        "Trial Number", 
        "Stimulus", 
        "Stimulus Size or N", 
        "Is Target", 
        "Response Key", 
        "Reaction Time (ms)", 
        "Is Correct", 
        "Trial Outcome Details"
      ]);
      // Format headers
      logsSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#f3e8ff");
    }
    
    // Batch write trial logs to optimize performance (crucial for 200+ SART rows)
    var rowsToWrite = [];
    
    // Process SART2 trials
    if (data.sartLogs && data.sartLogs.length > 0) {
      data.sartLogs.forEach(function(t) {
        var isTarget = (t.digit === 3);
        rowsToWrite.push([
          timestamp,
          participant,
          sessionMode,
          "SART2",
          t.trialNum,
          t.digit.toString(),
          t.fontSize.toString(),
          isTarget ? "TRUE" : "FALSE",
          t.keyPressed,
          t.reactionTime !== null ? t.reactionTime : "N/A",
          t.isCorrect ? "TRUE" : "FALSE",
          t.errorType
        ]);
      });
    }
    
    // Process N-Back trials
    if (data.nbackLogs && data.nbackLogs.length > 0) {
      data.nbackLogs.forEach(function(t) {
        rowsToWrite.push([
          timestamp,
          participant,
          sessionMode,
          "2-Back",
          t.trialNum,
          t.letter,
          "2",
          t.isMatch ? "TRUE" : "FALSE",
          t.keyPressed,
          t.reactionTime !== null ? t.reactionTime : "N/A",
          t.isCorrect ? "TRUE" : "FALSE",
          t.outcome
        ]);
      });
    }
    
    // Append all rows at once to prevent Google Quota limits & connection timeouts
    if (rowsToWrite.length > 0) {
      logsSheet.getRange(logsSheet.getLastRow() + 1, 1, rowsToWrite.length, rowsToWrite[0].length).setValues(rowsToWrite);
    }
    
    // Return Success Response
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Results logged to sheets" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*' // CORS enable
      });
      
  } catch (error) {
    // Return Error Response
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*' // CORS enable
      });
  }
}
