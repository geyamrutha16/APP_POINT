import mongoose from 'mongoose';

const uploadSchema = mongoose.Schema({
    fileName: String,
    fileType: String,
    year: String,
    academicYear: String,
    uploadedAt: { type: Date, default: Date.now }
});

const Upload = mongoose.model('Upload', uploadSchema);
export default Upload;
/*
import mongoose from 'mongoose';

const uploadSchema = mongoose.Schema({
    fileName: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
});

const Upload = mongoose.model('Upload', uploadSchema);
export default Upload;
*/
