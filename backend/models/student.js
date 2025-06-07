import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        hallticketNumber: { type: String, required: true, unique: true },
        sem: { type: Number, required: true },
        sec: { type: String, required: true },
        name: { type: String, required: true },
        year: { type: Number, required: true },
        points: {
            type: [Number],
            default: () => [0, 0, 0, 0, 0, 0, 0, 0],
        },
        totalPoints: { type: Number, default: 0 },
        status: { type: String, default: "Active" },
    },
    { timestamps: true }
);


const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
