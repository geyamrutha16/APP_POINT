import mongoose from "mongoose";

// Define the Form schema
const formSchema = new mongoose.Schema({
    hallticket_number: { type: String, required: true, unique: true },
    student_name: { type: String, required: true },
    sem: { type: String, required: true },
    section: { type: String, required: true },
    certificates: [
        {
            fileUrl: String,
            eventType: { type: String },
            points_added: { type: Number },
        }
    ],
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    dateUploaded: { type: Date, default: Date.now },
});

const Form = mongoose.model("Form", formSchema);
export default Form;
