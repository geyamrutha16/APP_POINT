import mongoose from "mongoose";

const participationSchema = new mongoose.Schema({
    filename: String,
    filePath: String,
    uploadedBy: String,
    uploadDate: { type: Date, default: Date.now },
    eventType: String,
    verified: { type: Boolean, default: false }
});

participationSchema = mongoose.model("Particiation", participationSchema);
export default participationSchema;
