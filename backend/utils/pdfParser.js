import Tesseract from 'tesseract.js';

const extractTextFromPDF = async (filePath) => {
    try {
        const { data } = await Tesseract.recognize(filePath, 'eng');
        return data.text;
    } catch (error) {
        throw new Error("Error extracting text from PDF");
    }
};

export default extractTextFromPDF;
