import QRCode from 'qrcode';

const generateQRCode = async (text) => {
    try {
        return await QRCode.toDataURL(text);
    } catch (error) {
        throw new Error("Error generating QR code");
    }
};

export default generateQRCode;
