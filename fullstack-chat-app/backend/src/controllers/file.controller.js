import cloudinary from "../lib/cloudinary.js";
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const sessionId = req.params.sessionId;
    const fileId = uuidv4();

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: `collab/${sessionId}`,
      resource_type: 'auto',
      public_id: fileId,
    });

    // Here you would typically save the file reference to your database
    // For now, we'll just return the Cloudinary response
    
    res.status(200).json({
      success: true,
      file: {
        id: fileId,
        name: file.name,
        url: result.secure_url,
        type: file.mimetype,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { sessionId, fileId } = req.params;
    
    // Delete file from Cloudinary
    await cloudinary.uploader.destroy(`collab/${sessionId}/${fileId}`);
    
    // Here you would typically remove the file reference from your database
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
