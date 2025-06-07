import Approval from "../models/approvalSchema.js";
import Form from "../models/formSchema.js"
import { deleteFileFromCloudinary } from "../services/cloudinaryService.js";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import Student from "../models/Student.js";
import { Console } from "console";


// Set up multer storage
const upload = multer({ dest: "uploads/" });

// Upload Excel file
export const uploadParticipationList = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;

        // Read and parse the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Log parsed data
        console.log("Parsed Excel Data:", sheetData);

        // Save data to the database
        const participationList = sheetData.map((student) => ({
            hallticketNumber: student.hallticketNumber,
            name: student.name,
            section: student.section,
            year: student.year,
            points: student.points,
        }));

        await Student.insertMany(participationList);

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        res.json({ message: "Participation list uploaded successfully", data: participationList });
    } catch (error) {
        console.error("Excel upload error:", error);
        res.status(500).json({ message: "File upload failed", error: error.message });
    }
};

// Get Participation List
export const getParticipationList = async (req, res) => {
    try {
        const students = await Student.find({});
        res.json(students);
    } catch (error) {
        console.error("Error retrieving participation list:", error);
        res.status(500).json({ message: "Failed to retrieve participation list" });
    }
};

/*
export const submitForm = async (req, res) => {
    try {
        const { hallticket_number, student_name, sem, section, certificates } = req.body;
        console.log("Request body:", req.body);

        if (!certificates || certificates.length === 0) {
            return res.status(400).json({ message: "Please upload certificates." });
        }

        console.log("📝 Certificates received:", req.body.certificates);

        // Fetch student record using correct field names
        const studentRecord = await Student.findOne({
            hallticketNumber: hallticket_number,
            name: student_name,
            sec: section,
        });

        if (!studentRecord) {
            return res.status(400).json({ message: "Invalid hall ticket number, student name, or section" });
        }

        console.log("Fetched Student Record:", studentRecord);

        // Check for existing approval
        const existingApproval = await Approval.findOne({ hallticket_number: hallticket_number.trim() });

        if (existingApproval) {
            const updatedCertificates = certificates.map((cert, index) => ({
                fileUrl: cert.fileUrl || `/uploads/${req.files[index]?.filename}`,
                eventType: cert.eventType || "Unknown",
                pointsAdded: cert.pointsAdded || "",
                verified: false,
            }));

            existingApproval.certificates.push(...updatedCertificates);

            if (existingApproval.status === 'verified') {
                existingApproval.status = 'pending';
            }

            existingApproval.dateUploaded = new Date();
            await existingApproval.save();

            return res.status(200).json({
                message: "Certificates added successfully!",
                approval: existingApproval,
            });
        }

        // Create a new approval entry
        const newApproval = new Approval({
            hallticket_number: hallticket_number.trim(),
            student_name: student_name.trim(),
            sem: sem.trim(),
            section: section.trim(),
            certificates: certificates.map((cert, index) => ({
                fileUrl: cert.fileUrl || `/uploads/${req.files[index]?.filename}`,
                eventType: cert.eventType || "Unknown",
                pointsAdded: cert.pointsAdded || "",
                verified: false,
            })),
            status: 'pending',
            dateUploaded: new Date(),
        });

        await newApproval.save();

        return res.status(201).json({
            message: "Form submitted successfully!",
            approval: newApproval,
        });

    } catch (error) {
        console.error("Error submitting form:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
};
*/

export const submitForm = async (req, res) => {
    try {
        const { hallticket_number, student_name, sem, section, certificates } = req.body;
        console.log("Request body:", req.body);

        const semesterMap = {
            '1-1': 1, '1-2': 2, '2-1': 3, '2-2': 4,
            '3-1': 5, '3-2': 6, '4-1': 7, '4-2': 8,
        };
        const sem_number = semesterMap[sem] || 0;

        console.log("Semester number determined:", sem_number);

        if (!certificates || certificates.length === 0) {
            return res.status(400).json({ message: "Please upload certificates." });
        }

        console.log("📝 Certificates received:", req.body.certificates);

        // Fetch student record using correct field names
        const studentRecord = await Student.findOne({
            hallticketNumber: hallticket_number,
            name: student_name,
            sec: section,
        });

        if (!studentRecord) {
            return res.status(400).json({ message: "Invalid hall ticket number, student name, or section" });
        }

        console.log("Fetched Student Record:", studentRecord);

        console.log("CURRENT SEM POINTS : ", studentRecord.points[sem_number - 1]);

        if (studentRecord.points[sem_number - 1] >= 20) {
            return res.status(400).json({ message: "20 points reached in this semester, no more points will be added." });
        }

        // Check for existing approval
        let existingApproval = await Approval.findOne({
            hallticket_number: hallticket_number.trim(),
            sem: sem.trim(),
        });

        if (existingApproval) {
            const updatedCertificates = certificates.map((cert, index) => ({
                fileUrl: cert.fileUrl || `/uploads/${req.files[index]?.filename}`,
                eventType: cert.eventType || "Unknown",
                pointsAdded: cert.pointsAdded || "",
                verified: false,
            }));

            existingApproval.certificates.push(...updatedCertificates);

            if (existingApproval.status === 'verified') {
                existingApproval.status = 'pending';
            }

            existingApproval.dateUploaded = new Date();
            await existingApproval.save();

            return res.status(200).json({
                message: "Certificates added successfully!",
                approval: existingApproval,
            });
        }

        // Create a new approval entry if no existing record
        const newApproval = new Approval({
            hallticket_number: hallticket_number.trim(),
            student_name: student_name.trim(),
            sem: sem.trim(),
            section: section.trim(),
            certificates: certificates.map((cert, index) => ({
                fileUrl: cert.fileUrl || `/uploads/${req.files[index]?.filename}`,
                eventType: cert.eventType || "Unknown",
                pointsAdded: cert.pointsAdded || "",
                verified: false,
            })),
            status: 'pending',
            dateUploaded: new Date(),
        });

        await newApproval.save();

        return res.status(201).json({
            message: "Form submitted successfully!",
            approval: newApproval,
        });

    } catch (error) {
        console.error("Error submitting form:", error);

        // Fix: Use optional chaining to access error code safely
        if (error?.code === 11000 || error?.errorResponse?.code === 11000) {
            return res.status(400).json({ message: "Promote the student" });
        }

        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
};

export const verifyForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificates, totalPoints } = req.body; // Receive updated certificates and total points

        console.log("Verifying form ID:", id);

        const form = await Approval.findById(id);
        if (!form) {
            console.log("Form not found:", id);
            return res.status(404).json({ message: `Form with ID ${id} not found` });
        }

        console.log("Form found:", form);

        const hallticketNumber = form.hallticket_number;

        // Update certificates with the new points and mark them as verified
        form.certificates = certificates.map((cert) => ({
            ...cert,
            verified: true, // Mark all certificates as verified
        }));

        form.totalPoints = totalPoints; // Update the total points
        form.status = "verified"; // Set the form status to "verified"

        console.log("Updated Certificates:", form.certificates);
        console.log("Total points calculated:", totalPoints);

        // Save the updated form
        await form.save();

        const semesterMap = {
            '1-1': 1, '1-2': 2, '2-1': 3, '2-2': 4,
            '3-1': 5, '3-2': 6, '4-1': 7, '4-2': 8,
        };
        const sem_number = semesterMap[form.sem] || 0;

        console.log("Semester number determined:", sem_number);

        // Update the student points using $inc
        const updateResult = await Student.updateOne(
            { hallticketNumber },
            { $inc: { [`points.${sem_number - 1}`]: totalPoints } }
        );

        console.log("Update result:", updateResult);

        res.json({ message: "Form verified successfully!" });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
};

/*
export const verifyForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificates, totalPoints } = req.body;
        console.log("Verifying form ID:", id);

        const form = await Approval.findById(id);
        if (!form) {
            console.log("Form not found:", id);
            return res.status(404).json({ message: `Form with ID ${id} not found` });
        }

        console.log("Form found:", form);

        const hallticketNumber = form.hallticket_number;

        let calculatedPoints = 0;

        // Update only unverified certificates and calculate points
        form.certificates = form.certificates.map((cert, index) => {
            if (!cert.verified) {
                const updatedCert = certificates[index];
                const points = Number(updatedCert.pointsAdded) || 0;
                console.log(`Adding points from unverified certificate: ${points}`);
                calculatedPoints += points;  // Add points from unverified certificate
                return { ...cert, pointsAdded: points, verified: true }; // Mark as verified
            }
            return cert; // Keep verified certificates as is
        });

        console.log("Total points calculated:", calculatedPoints);

        // Set the form status to "verified" if all certificates are verified
        form.status = "verified";
        await form.save();

        const semesterMap = {
            '1-1': 1, '1-2': 2, '2-1': 3, '2-2': 4,
            '3-1': 5, '3-2': 6, '4-1': 7, '4-2': 8,
        };
        const sem_number = semesterMap[form.sem] || 0;

        console.log("Semester number determined:", sem_number);

        // Update the student points using $inc
        const updateResult = await Student.updateOne(
            { hallticketNumber },
            {
                $inc: {
                    [`points.${sem_number - 1}`]: calculatedPoints,
                    totalPoints: calculatedPoints
                }
            }
        );

        console.log("Update result:", updateResult);

        res.json({ message: "Form verified successfully!" });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
};
*/

// Controller function to get pending forms (for admin)
export const getPendingForms = async (req, res) => {
    try {
        // Step 1: Find forms with at least one unverified certificate
        const forms = await Approval.find({
            "certificates.verified": false,
            status: "pending" // Optional: Only include forms with status "pending"
        });

        if (!forms.length) {
            return res.status(200).json({
                message: "No pending forms with unverified certificates found.",
                forms: []
            });
        }

        // Step 2: Filter certificates to only include unverified ones
        const formsWithUnverifiedCerts = forms.map(form => {
            const unverifiedCerts = form.certificates.filter(
                cert => cert.verified === false
            );
            return {
                ...form.toObject(),
                certificates: unverifiedCerts
            };
        });

        res.status(200).json({
            message: "Pending forms with unverified certificates retrieved successfully.",
            forms: formsWithUnverifiedCerts
        });

    } catch (error) {
        console.error("❌ Error retrieving pending forms:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
/*
export const getPendingForms = async (req, res) => {
    try {
        const pendingForms = await Approval.find({ status: "pending" });

        res.status(200).json({ message: "Pending forms retrieved successfully.", forms: pendingForms });
    } catch (error) {
        console.error("❌ Error retrieving pending forms:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
*/

// Fetch Past Forms
export const getPastForms = async (req, res) => {
    try {
        const forms = await Approval.find();

        if (!forms || forms.length === 0) {
            // Return empty array if no forms are found
            return res.status(200).json({ message: "No forms found", forms: [] });
        }

        const formattedForms = forms.map(form => ({
            ...form.toObject(),
            dateUploaded: form.dateUploaded.toISOString(),  // Make sure the date is in ISO format
        }));

        res.status(200).json({ forms: formattedForms });

    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteFormByDate = async (req, res) => {
    console.log("deleteFormByDate API hit"); // Check if the API is being triggered

    try {
        const { deleteDate } = req.body;
        console.log("Received deleteDate:", deleteDate); // Check received data

        if (!deleteDate) {
            console.log("Error: Delete date is required");
            return res.status(400).json({ message: "Delete date is required" });
        }

        const date = new Date(deleteDate);
        if (isNaN(date.getTime())) {
            console.log("Error: Invalid date format");
            return res.status(400).json({ message: "Invalid date format" });
        }

        // Check if there are any forms before deleting
        const existingForms = await Approval.countDocuments({ dateUploaded: { $lt: date } });
        console.log(`Existing forms count: ${existingForms}`);

        if (existingForms === 0) {
            return res.status(200).json({ message: "No forms to delete", deletedCount: 0 });
        }

        // Perform deletion if forms exist
        const result = await Approval.deleteMany({ dateUploaded: { $lt: date } });
        console.log(`Deleted ${result.deletedCount} forms`); // Log deleted count

        res.status(200).json({
            message: `${result.deletedCount} forms deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("Error deleting forms:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


export const deleteForms = async (req, res) => {
    try {
        const { hallticket_number, publicId } = req.body; // For body-based deletion
        const hallticketNumberParam = req.params.hallticket_number; // For params-based deletion

        const hallticketNumber = hallticket_number || hallticketNumberParam;

        if (!hallticketNumber) {
            return res.status(400).json({ message: "Hall ticket number is required" });
        }

        console.log(`Attempting to delete form with hallticket_number: ${hallticketNumber}`);

        // Check in both Form and Approval models and delete if found
        let deletedForm = await Form.findOneAndDelete({ hallticket_number: hallticketNumber });
        if (!deletedForm) {
            deletedForm = await Approval.findOneAndDelete({ hallticket_number: hallticketNumber });
        }

        if (!deletedForm) {
            return res.status(404).json({ message: "Form not found" });
        }

        // Delete primary file from Cloudinary if publicId is provided
        if (publicId) {
            console.log(`Deleting Cloudinary file: ${publicId}`);
            await deleteFileFromCloudinary(publicId);
        }

        // Delete associated certificates from Cloudinary if they exist
        if (deletedForm.certificates && deletedForm.certificates.length > 0) {
            for (const cert of deletedForm.certificates) {
                try {
                    const fileName = cert.fileUrl.split('/').pop().split('.')[0];
                    console.log(`Deleting Cloudinary file: ${fileName}`);
                    await deleteFileFromCloudinary(fileName);
                } catch (cloudinaryError) {
                    console.error(`Error deleting file from Cloudinary: ${cloudinaryError}`);
                    return res.status(500).json({ message: "Error deleting Cloudinary file", error: cloudinaryError });
                }
            }
        }

        return res.status(200).json({ message: "Form and associated files deleted successfully" });
    } catch (error) {
        console.error("Error deleting form:", error);
        res.status(500).json({ message: "Error deleting form", error });
    }
};

// Update Forms
export const updateForms = async (req, res) => {
    try {
        console.log(req.body);
        const { id } = req.params;
        const updatedFormData = req.body;

        // Log to confirm data received
        console.log('Updating form with data:', updatedFormData);

        const updatedForm = await Approval.findByIdAndUpdate(id, updatedFormData, { new: true });
        if (!updatedForm) {
            return res.status(404).json({ message: 'Form not found' });
        }

        res.json(updatedForm);  // Return the updated form
    } catch (error) {
        console.error("Error updating form:", error);
        res.status(500).json({ message: 'Error updating form' });
    }
};