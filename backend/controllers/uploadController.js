import Upload from '../models/Upload.js';
import extractTextFromPDF from '../utils/pdfParser.js';

export const uploadFile = async (req, res) => {
    try {
        console.log('Upload request received', req.file); // Debug log

        const { file } = req;
        if (!file) {
            console.error('No file uploaded');
            return res.status(400).json({ message: "No file uploaded" });
        }

        console.log('Creating new upload document:', {
            fileName: file.originalname,
            fileType: file.mimetype
        });

        const newUpload = new Upload({
            fileName: file.originalname,
            fileType: file.mimetype,
        });

        const savedUpload = await newUpload.save();
        console.log('Document saved successfully:', savedUpload);

        // Only process PDF if the file is actually a PDF
        let extractedData = null;
        if (file.mimetype === 'application/pdf') {
            extractedData = await extractTextFromPDF(file.path);
        }

        res.json({
            message: "File uploaded successfully",
            uploadId: savedUpload._id,
            fileName: savedUpload.fileName,
            extractedData
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            message: "File upload failed",
            error: error.message
        });
    }
};