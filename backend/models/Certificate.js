import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "InternalEvent", required: true },
    name: String,
    regNo: String,
    year: String,
    sem: String,
    department: String,
    event: String,
    eventDate: String,
    academicYear: String,
    cloudinaryUrl: String,
    iacNo: { type: String, unique: true },
    qrUrl: { type: String },
}, { timestamps: true });

export default mongoose.model("Certificate", certificateSchema);
