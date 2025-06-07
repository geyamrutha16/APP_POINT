import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteFileFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image', // Adjust this if it's not an image
        });
        console.log(`Deleted file from Cloudinary: ${publicId}, result:`, result);
        return result;
    } catch (error) {
        console.error(`Error deleting file from Cloudinary: ${publicId}`, error);
        throw error;
    }
};


export default cloudinary; 
