
import mongoose from "mongoose";

// Define the Approval schema
const approvalSchema = new mongoose.Schema({
    hallticket_number: { type: String, required: true, unique: true },
    student_name: { type: String, required: true },
    sem: { type: String, required: true },
    section: { type: String, required: true },
    certificates: [
        {
            fileUrl: String,
            eventType: { type: String },
            pointsAdded: { type: String },
            verified: { type: Boolean, default: false },
        }
    ],
    status: { type: String, enum: ["pending", "verified"], default: "pending" }, // Updated status enum
    dateUploaded: { type: Date, default: Date.now },
});

const Approval = mongoose.model("Approval", approvalSchema);
export default Approval;
