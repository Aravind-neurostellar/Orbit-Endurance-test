/**
 * Orbit Cognitive Assessment Suite - Google Sheets & Drive Backend
 * 
 * Paste this code into your Google Sheets Apps Script Editor:
 * 1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1A2ZqoX-TkrOWKKVfYG4Hb-WBzo4pHPY7QBFi18aMNB8/edit
 * 2. Click "Extensions" > "Apps Script" in the top menu.
 * 3. Delete any default code in Code.gs and paste this script.
 * 4. Save (click the disk icon).
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Click the gear icon ("Select type") > select "Web app".
 * 7. Configure:
 *    - Description: "Orbit Assessment & File Upload Sync"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial to allow incoming requests from the web page)
 * 8. Click "Deploy" and authorize access when prompted.
 * 9. Copy the "Web App URL" (ends in /exec). Paste this URL into app.js.
 */

function doPost(e) {
  try {
    // Parse the incoming JSON payload
    var data = JSON.parse(e.postData.contents);
    var participant = data.participantName || "Unknown";
    var clientTimestamp = data.timestamp || new Date().toISOString();
    var sessionMode = data.sessionMode || "standard";
    
    // Convert client timestamp explicitly to Indian Standard Time (IST - GMT+5:30)
    var dateObj = new Date(clientTimestamp);
    var timestamp = Utilities.formatDate(dateObj, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
    
    var ss = SpreadsheetApp.openById("1A2ZqoX-TkrOWKKVfYG4Hb-WBzo4pHPY7QBFi18aMNB8");
    
    // ----------------------------------------------------
    // 1. SAVE FILE ATTACHMENTS TO GOOGLE DRIVE
    // ----------------------------------------------------
    var baselineFileUrl = "";
    var sartFileUrl = "";
    var nbackFileUrl = "";
    
    // Get or create dedicated folder "Orbit_Recordings"
    var folder = getOrCreateFolder("Orbit_Recordings");
    
    // Save Baseline file if present
    if (data.baselineFile && data.baselineFile.base64) {
      try {
        var baselineDecoded = Utilities.base64Decode(data.baselineFile.base64);
        var baselineFileName = participant + "_Baseline_" + getSafeTimestampString(timestamp) + "_" + data.baselineFile.name;
        var baselineBlob = Utilities.newBlob(baselineDecoded, data.baselineFile.mimeType, baselineFileName);
        
        var file = folder.createFile(baselineBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        baselineFileUrl = file.getUrl();
      } catch (fErr) {
        baselineFileUrl = "Error saving file: " + fErr.toString();
      }
    } else {
      baselineFileUrl = "N/A (Skipped)";
    }
    
    // Save SART2 file if present
    if (data.sartFile && data.sartFile.base64) {
      try {
        var sartDecoded = Utilities.base64Decode(data.sartFile.base64);
        var sartFileName = participant + "_SART2_" + getSafeTimestampString(timestamp) + "_" + data.sartFile.name;
        var sartBlob = Utilities.newBlob(sartDecoded, data.sartFile.mimeType, sartFileName);
        
        var file = folder.createFile(sartBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        sartFileUrl = file.getUrl();
      } catch (fErr) {
        sartFileUrl = "Error saving file: " + fErr.toString();
      }
    } else {
      sartFileUrl = "N/A (Skipped)";
    }
    
    // Save N-Back file if present
    if (data.nbackFile && data.nbackFile.base64) {
      try {
        var nbackDecoded = Utilities.base64Decode(data.nbackFile.base64);
        var nbackFileName = participant + "_NBack_" + getSafeTimestampString(timestamp) + "_" + data.nbackFile.name;
        var nbackBlob = Utilities.newBlob(nbackDecoded, data.nbackFile.mimeType, nbackFileName);
        
        var file = folder.createFile(nbackBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        nbackFileUrl = file.getUrl();
      } catch (fErr) {
        nbackFileUrl = "Error saving file: " + fErr.toString();
      }
    } else {
      nbackFileUrl = "N/A (Skipped)";
    }
    
    // ----------------------------------------------------
    // 2. WRITE SESSION SUMMARY TO "Session_Summaries" SHEET
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
        "N-Back Correct Rejections",
        "Baseline Orbit File Link", // column 17
        "SART2 Orbit File Link",    // column 18
        "N-Back Orbit File Link"     // column 19
      ]);
      // Format headers
      summarySheet.getRange(1, 1, 1, 19).setFontWeight("bold").setBackground("#e0e7ff");
    }
    
    // Format links as actual clickable hyperlinks using formulas
    var baselineLinkFormula = baselineFileUrl.indexOf("http") === 0 ? '=HYPERLINK("' + baselineFileUrl + '", "Open Baseline File ↗")' : baselineFileUrl;
    var sartLinkFormula = sartFileUrl.indexOf("http") === 0 ? '=HYPERLINK("' + sartFileUrl + '", "Open SART2 File ↗")' : sartFileUrl;
    var nbackLinkFormula = nbackFileUrl.indexOf("http") === 0 ? '=HYPERLINK("' + nbackFileUrl + '", "Open N-Back File ↗")' : nbackFileUrl;
    
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
      data.nbackMetrics.correctRejections,
      baselineLinkFormula,
      sartLinkFormula,
      nbackLinkFormula
    ]);
    
    // ----------------------------------------------------
    // 3. WRITE INDIVIDUAL TRIAL LOGS TO "Trial_Logs" SHEET
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
    
    // ----------------------------------------------------
    // 4. CREATE BEAUTIFULLY FORMATTED INDIVIDUAL SHEET FOR THIS PARTICIPANT
    // ----------------------------------------------------
    try {
      var cleanTime = timestamp.split(" ")[1].replace(/:/g, "-");
      // Clean name of non-alphanumeric to keep tab names valid
      var cleanName = participant.replace(/[^a-zA-Z0-9\s]/g, "").substring(0, 15);
      var sheetName = cleanName + " (" + cleanTime + ")";
      
      // Handle name collisions safely
      var finalSheetName = sheetName;
      var counter = 1;
      while (ss.getSheetByName(finalSheetName)) {
        finalSheetName = sheetName + "_" + counter;
        counter++;
      }
      
      var pSheet = ss.insertSheet(finalSheetName);
      
      // Set report card metadata titles
      pSheet.getRange("A1").setValue("Participant Cognitive Assessment Report").setFontSize(14).setFontWeight("bold").setFontColor("#1e3a8a");
      pSheet.getRange("A2").setValue("Name: " + participant).setFontWeight("bold");
      pSheet.getRange("B2").setValue("Session Date/Time: " + timestamp).setFontWeight("bold");
      pSheet.getRange("C2").setValue("Mode: " + sessionMode).setFontWeight("bold");
      
      // Performance stats summary section
      pSheet.getRange("A4").setValue("OVERALL PERFORMANCE SUMMARY").setFontWeight("bold").setFontSize(11).setFontColor("#0369a1");
      
      pSheet.getRange(5, 1, 5, 3).setValues([
        ["Metric", "SART2 Task (Vigilance)", "N-Back Task (Working Memory)"],
        ["Accuracy", data.sartMetrics.accuracy + "%", data.nbackMetrics.accuracy + "%"],
        ["Mean Reaction Time", (data.sartMetrics.meanRT !== null ? data.sartMetrics.meanRT + " ms" : "N/A"), (data.nbackMetrics.meanRT !== null ? data.nbackMetrics.meanRT + " ms" : "N/A")],
        ["Omissions (Misses)", data.sartMetrics.omissionErrors, data.nbackMetrics.misses],
        ["Commissions (False Alarms)", data.sartMetrics.commissionErrors, data.nbackMetrics.falseAlarms]
      ]);
      
      pSheet.getRange(5, 1, 5, 3).setBorder(true, true, true, true, true, true, "#94a3b8", SpreadsheetApp.BorderStyle.SOLID);
      pSheet.getRange(5, 1, 1, 3).setFontWeight("bold").setBackground("#e0f2fe");
      pSheet.getRange(5, 1, 5, 1).setFontWeight("bold");
      
      // Drive file links (Stacked Vertically and Clickable)
      pSheet.getRange("A11").setValue("GOOGLE DRIVE RECORDING LINKS").setFontWeight("bold").setFontSize(11).setFontColor("#0369a1");
      
      pSheet.getRange("A12").setValue("Baseline Orbit File:").setFontWeight("bold");
      if (baselineFileUrl.indexOf("http") === 0) {
        pSheet.getRange("B12").setFormula('=HYPERLINK("' + baselineFileUrl + '", "Open Baseline File ↗")').setFontColor("#1e40af").setFontUnderline(true);
      } else {
        pSheet.getRange("B12").setValue(baselineFileUrl);
      }
      
      pSheet.getRange("A13").setValue("SART2 Orbit File:").setFontWeight("bold");
      if (sartFileUrl.indexOf("http") === 0) {
        pSheet.getRange("B13").setFormula('=HYPERLINK("' + sartFileUrl + '", "Open SART2 File ↗")').setFontColor("#1e40af").setFontUnderline(true);
      } else {
        pSheet.getRange("B13").setValue(sartFileUrl);
      }
      
      pSheet.getRange("A14").setValue("N-Back Orbit File:").setFontWeight("bold");
      if (nbackFileUrl.indexOf("http") === 0) {
        pSheet.getRange("B14").setFormula('=HYPERLINK("' + nbackFileUrl + '", "Open N-Back File ↗")').setFontColor("#1e40af").setFontUnderline(true);
      } else {
        pSheet.getRange("B14").setValue(nbackFileUrl);
      }
      
      // Raw trial data header
      pSheet.getRange("A16").setValue("RAW EVENT LOGS (TRIAL-BY-TRIAL)").setFontWeight("bold").setFontSize(11).setFontColor("#0369a1");
      
      var trialHeaders = ["Task", "Trial Number", "Stimulus", "Stimulus Size / N", "Is Target", "Response Key", "Reaction Time (ms)", "Is Correct", "Outcome Details"];
      pSheet.getRange(17, 1, 1, 9).setValues([trialHeaders]).setFontWeight("bold").setBackground("#f1f5f9");
      
      // Compile individual rows
      var pRows = [];
      if (data.sartLogs && data.sartLogs.length > 0) {
        data.sartLogs.forEach(function(t) {
          pRows.push([
            "SART2",
            t.trialNum,
            t.digit.toString(),
            t.fontSize.toString(),
            (t.digit === 3) ? "TRUE" : "FALSE",
            t.keyPressed,
            t.reactionTime !== null ? t.reactionTime : "N/A",
            t.isCorrect ? "TRUE" : "FALSE",
            t.errorType
          ]);
        });
      }
      
      if (data.nbackLogs && data.nbackLogs.length > 0) {
        data.nbackLogs.forEach(function(t) {
          pRows.push([
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
      
      if (pRows.length > 0) {
        pSheet.getRange(18, 1, pRows.length, pRows[0].length).setValues(pRows);
      }
      
      pSheet.autoResizeColumns(1, 9);
    } catch (sheetErr) {
      Logger.log("Individual sheet creation failed: " + sheetErr.toString());
    }
    
    // Return Success Response with Google Drive file links
    var responseObj = {
      "status": "success", 
      "message": "Results logged to sheets",
      "baselineFileUrl": baselineFileUrl.indexOf("http") === 0 ? baselineFileUrl : null,
      "sartFileUrl": sartFileUrl.indexOf("http") === 0 ? sartFileUrl : null,
      "nbackFileUrl": nbackFileUrl.indexOf("http") === 0 ? nbackFileUrl : null
    };
    
    return ContentService.createTextOutput(JSON.stringify(responseObj))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return Error Response
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper: Get or create Google Drive folder
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

// Helper: Formats timestamp safely for filename purposes (removes colons and dots)
function getSafeTimestampString(timestampStr) {
  return timestampStr.replace(/:/g, "-").replace(/\./g, "-").replace(/\s+/g, "_");
}
