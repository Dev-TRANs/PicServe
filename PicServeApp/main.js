function doPost(e) {
  try {
    const folderId = PropertiesService.getScriptProperties().getProperty("FOLDER_ID");
    const folder = DriveApp.getFolderById(folderId);
    
    const data = JSON.parse(e.postData.contents); 
    if (!data.data || !data.filename || !data.contentType) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Invalid JSON data"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!data.contentType.startsWith("image/")) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Uploaded file is not an image"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const decoded = Utilities.base64Decode(data.data);
    const blob = Utilities.newBlob(decoded, data.contentType, data.filename);
    const file = folder.createFile(blob);
    
    const fileId = file.getId();
    const imageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      imageUrl: imageUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
