import xlsx from "xlsx";
import Student from "../models/Student.js";
import Upload from '../models/Upload.js';

export const getAllStudents = async (req, res) => {
    try {
        const { years, sections, search } = req.query;
        let query = {}; // Fetch all students (both active and inactive)
        console.log("Query:", query);

        if (years) {
            const yearsArray = years.split(',');
            query.year = { $in: yearsArray };
        }

        if (sections) {
            const sectionsArray = sections.split(',');
            query.sec = { $in: sectionsArray };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hallticketNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const students = await Student.find(query);
        console.log("Fetched students:", students);
        res.json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Error fetching student records" });
    }
};

export const getInactiveStudents = async (req, res) => {
    try {
        const { years, sections, search } = req.query;
        let query = { status: "Inactive" }; // Fetch only active students

        if (years) {
            const yearsArray = years.split(',');
            query.year = { $in: yearsArray };
        }

        if (sections) {
            const sectionsArray = sections.split(',');
            query.sec = { $in: sectionsArray };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hallticketNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const students = await Student.find(query).sort({ hallticketNumber: 1 });
        res.json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Error fetching student records" });
    }
};

export const getStudents = async (req, res) => {
    try {
        const { years, sections, search } = req.query;
        let query = { status: "Active" }; // Fetch only active students

        if (years) {
            const yearsArray = years.split(',');
            query.year = { $in: yearsArray };
        }

        if (sections) {
            const sectionsArray = sections.split(',');
            query.sec = { $in: sectionsArray };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hallticketNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const students = await Student.find(query).sort({ hallticketNumber: 1 });
        res.json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Error fetching student records" });
    }
};

export const exportStudents = async (req, res) => {
    try {
        const { years = "", sections = "", search = "" } = req.query;
        let query = { status: "Active" }; // Only Active students

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { hallticketNumber: { $regex: search, $options: "i" } }
            ];
        }

        if (years) {
            const yearsArray = years.split(',');
            query.year = { $in: yearsArray };
        }

        if (sections) {
            const sectionsArray = sections.split(',');
            query.sec = { $in: sectionsArray };
        }

        const students = await Student.find(query);
        const formattedData = students.map(student => ({
            "Hallticket Number": student.hallticketNumber,
            "Name": student.name,
            "Semester": student.sem,
            "Section": student.sec,
            "Year": student.year,
            "Sem1 Points": (student.points && student.points[0]) || 0,
            "Sem2 Points": (student.points && student.points[1]) || 0,
            "Sem3 Points": (student.points && student.points[2]) || 0,
            "Sem4 Points": (student.points && student.points[3]) || 0,
            "Sem5 Points": (student.points && student.points[4]) || 0,
            "Sem6 Points": (student.points && student.points[5]) || 0,
            "Sem7 Points": (student.points && student.points[6]) || 0,
            "Sem8 Points": (student.points && student.points[7]) || 0,
        }));

        const worksheet = xlsx.utils.json_to_sheet(formattedData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Active Students");
        const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

        res.setHeader("Content-Disposition", "attachment; filename=active_students.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (error) {
        console.error("Error exporting data:", error);
        res.status(500).json({ message: "Failed to export data" });
    }
};

export const uploadExcel = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: "Please upload an Excel file." });
        }

        if (!req.body.year || !req.body.academicYear) {
            return res.status(400).json({
                message: "Year and Academic Year are required.",
                receivedData: {
                    year: req.body.year,
                    academicYear: req.body.academicYear
                }
            });
        }

        // Save upload record
        const uploadRecord = new Upload({
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            year: req.body.year,
            academicYear: req.body.academicYear
        });

        const savedUpload = await uploadRecord.save();

        // Process Excel file
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const studentsData = xlsx.utils.sheet_to_json(sheet);

        if (!studentsData.length) {
            return res.status(400).json({ message: "No student data found in the file." });
        }

        const formattedStudents = studentsData.map((student) => {
            if (!student["Semester"]) {
                throw new Error(
                    `Semester is missing for student ${student["Hallticket Number"] || "N/A"}`
                );
            }
            const sem = Number(student["Semester"]);
            let pointsArray = Array(8).fill(0);

            if (!isNaN(student["Points-1"])) pointsArray[0] = Number(student["Points-1"]);
            if (!isNaN(student["Points-2"])) pointsArray[1] = Number(student["Points-2"]);
            if (!isNaN(student["Points"]) && sem >= 1 && sem <= 8) {
                pointsArray[sem - 1] = Number(student["Points"]);
            }

            return {
                hallticketNumber: student["Hallticket Number"] || "N/A",
                sem: sem,
                sec: student["Section"] || "N/A",
                name: student["Name"] || "Unknown",
                year: Number(student["Year"]) || 0,
                points: pointsArray,
                totalPoints: pointsArray.reduce((acc, val) => acc + val, 0),
            };
        });

        // Check for existing students
        const existingStudents = [];
        const newStudents = [];

        for (const student of formattedStudents) {
            const exists = await Student.findOne({
                hallticketNumber: student.hallticketNumber
            });
            if (exists) {
                existingStudents.push(student.hallticketNumber);
            } else {
                newStudents.push(student);
            }
        }

        // Save only new students
        if (newStudents.length > 0) {
            await Student.insertMany(newStudents);
        }

        // Prepare response
        let responseMessage = '';
        if (newStudents.length > 0 && existingStudents.length > 0) {
            responseMessage = `${newStudents.length} new students added. ${existingStudents.length} students already exist.`;
        } else if (newStudents.length > 0) {
            responseMessage = `${newStudents.length} students added successfully!`;
        } else {
            responseMessage = `All ${existingStudents.length} students already exist.`;
        }

        return res.status(201).json({
            message: responseMessage,
            uploadId: savedUpload._id,
            newStudentsCount: newStudents.length,
            existingStudentsCount: existingStudents.length,
            existingStudents: existingStudents
        });

    } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).json({
            message: "Error processing file",
            error: error.message
        });
    }
};

// New controller to get upload history
export const getUploads = async (req, res) => {
    try {
        const uploads = await Upload.find().sort({ uploadedAt: -1 });
        res.json(uploads);
    } catch (error) {
        console.error("Error fetching uploads:", error);
        res.status(500).json({ message: "Error fetching upload history" });
    }
};
/*
export const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload an Excel file." });
        }

        console.log("File received:", req.file.originalname);
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const studentsData = xlsx.utils.sheet_to_json(sheet);
        if (!studentsData.length) {
            return res.status(400).json({ message: "No student data found in the file." });
        }

        const formattedStudents = studentsData.map((student) => {
            if (!student["Semester"]) {
                throw new Error(
                    `Semester is missing for student ${student["Hallticket Number"] || "N/A"}`
                );
            }
            const sem = Number(student["Semester"]);
            let pointsArray = Array(8).fill(0);

            // Assign Points-1 and Points-2
            if (!isNaN(student["Points-1"])) {
                pointsArray[0] = Number(student["Points-1"]);
            }
            if (!isNaN(student["Points-2"])) {
                pointsArray[1] = Number(student["Points-2"]);
            }

            // Assign main "Points" to respective semester
            if (!isNaN(student["Points"]) && sem >= 1 && sem <= 8) {
                pointsArray[sem - 1] = Number(student["Points"]);
            }

            const totalPoints = pointsArray.reduce((acc, val) => acc + val, 0);

            return {
                hallticketNumber: student["Hallticket Number"] || "N/A",
                sem: sem,
                sec: student["Section"] || "N/A",
                name: student["Name"] || "Unknown",
                year: Number(student["Year"]) || 0,
                points: pointsArray,
                totalPoints: totalPoints,
            };
        });


        console.log("Formatted data:", formattedStudents);
        await Student.insertMany(formattedStudents);
        return res.status(201).json({ message: `${formattedStudents.length} students added successfully!` });
    } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).json({ message: "Error processing file", error: error.message });
    }
};
*/
// Demote a student (set status to Inactive)
// Demote a student (set status to Inactive)
export const demote = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Set status to Inactive
        student.status = "Inactive";

        // Save the updated student
        await student.save();

        res.json({ message: "Student demoted successfully" });
    } catch (error) {
        console.error("Error demoting student:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const activateStudent = async (req, res) => {
    console.log('[activateStudent] Request received to activate student with ID:', req.params.id);

    try {
        console.log('[activateStudent] Searching for student in database...');
        const student = await Student.findById(req.params.id);

        if (!student) {
            console.error('[activateStudent] Error: Student not found with ID:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        console.log('[activateStudent] Current student status:', student.status);

        // Only proceed if student is inactive
        if (student.status === 'Active') {
            console.warn('[activateStudent] Warning: Student is already active');
            return res.status(400).json({
                success: false,
                message: 'Student is already active'
            });
        }

        console.log('[activateStudent] Updating student status to Active...');
        student.status = 'Active';

        // Save the updated student
        const updatedStudent = await student.save();

        console.log('[activateStudent] Student activated successfully:', updatedStudent);
        res.status(200).json({
            success: true,
            message: 'Student activated successfully',
            data: updatedStudent
        });

    } catch (error) {
        console.error('[activateStudent] Error activating student:', error.message);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Error activating student',
            error: error.message
        });
    }
};

// Promote all active students
export const promote = async (req, res) => {
    try {
        // Find all students who are active
        const activeStudents = await Student.find({ status: "Active" });

        console.log("Active students found:", activeStudents.length);

        if (activeStudents.length === 0) {
            return res.status(400).json({ message: "No active students found to promote." });
        }

        let promotionBlocked = false;
        const studentsInSem8 = activeStudents.filter(student => student.sem === 8);

        if (studentsInSem8.length > 0) {
            promotionBlocked = true;
            return res.status(400).json({
                message: "Cannot promote students who are already in semester 8",
                studentsInSem8: studentsInSem8.map(s => s._id)
            });
        }

        for (const student of activeStudents) {
            let newSem = student.sem + 1;
            let newYear = student.year;

            // Ensure semester does not exceed 8
            if (newSem > 8) newSem = 8;

            // Increase year if moving from an even to an odd semester
            if (student.sem % 2 === 0) {
                newYear = student.year + 1;
                if (newYear > 4) newYear = 4;
            }

            console.log(`Updating student ${student._id} - Old Sem: ${student.sem}, New Sem: ${newSem}, Old Year: ${student.year}, New Year: ${newYear}`);

            // Update student
            await Student.findByIdAndUpdate(
                student._id,
                { $set: { sem: newSem, year: newYear } },
                { new: true }
            );
        }

        res.status(200).json({ message: "All active students promoted successfully!" });
    } catch (error) {
        console.error("Error promoting students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Promote selected students (filtered students)
export const promoteSelected = async (req, res) => {
    try {
        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: "Invalid student IDs provided" });
        }

        // Find all selected students (regardless of status)
        const studentsToPromote = await Student.find({ _id: { $in: studentIds } });

        console.log("Students to promote found:", studentsToPromote.length);

        if (studentsToPromote.length === 0) {
            return res.status(400).json({ message: "No students found to promote." });
        }

        // Check for students in semester 8
        const studentsInSem8 = studentsToPromote.filter(student => student.sem === 8);
        if (studentsInSem8.length > 0) {
            return res.status(400).json({
                message: "Cannot promote students who are already in semester 8",
                studentsInSem8: studentsInSem8.map(s => s._id)
            });
        }

        for (const student of studentsToPromote) {
            let newSem = student.sem + 1;
            let newYear = student.year;

            // Ensure semester does not exceed 8
            if (newSem > 8) newSem = 8;

            // Increase year if moving from an even to an odd semester
            if (student.sem % 2 === 0) {
                newYear = student.year + 1;
                if (newYear > 4) newYear = 4;
            }

            console.log(`Updating student ${student._id} - Old Sem: ${student.sem}, New Sem: ${newSem}, Old Year: ${student.year}, New Year: ${newYear}`);

            // Update student
            await Student.findByIdAndUpdate(
                student._id,
                { $set: { sem: newSem, year: newYear } },
                { new: true }
            );
        }

        res.status(200).json({ message: "Selected students promoted successfully!" });
    } catch (error) {
        console.error("Error promoting selected students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
/*
export const demote = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Set status to Inactive
        student.status = "Inactive";

        // Save the updated student
        await student.save();

        res.json({ message: "Student demoted successfully" });
    } catch (error) {
        console.error("Error demoting student:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const promote = async (req, res) => {
    try {
        // Find all students who are active
        const activeStudents = await Student.find({ status: "Active" });

        console.log("Active students found:", activeStudents.length); // Debug log

        if (activeStudents.length === 0) {
            return res.status(400).json({ message: "No active students found to promote." });
        }

        for (const student of activeStudents) {
            let newSem = student.sem + 1;
            let newYear = student.year;

            // Ensure semester does not exceed 8
            if (newSem > 8) newSem = 8;

            // Increase year if moving from an even to an odd semester
            if (student.sem % 2 === 0) {
                newYear = student.year + 1;
                if (newYear > 4) newYear = 4;
            }

            console.log(`Updating student ${student._id} - Old Sem: ${student.sem}, New Sem: ${newSem}, Old Year: ${student.year}, New Year: ${newYear}`);

            // Update student
            const updatedStudent = await Student.findByIdAndUpdate(
                student._id,
                { $set: { sem: newSem, year: newYear } },
                { new: true } // Return the updated document
            );

            console.log("Updated:", updatedStudent);
        }

        res.status(200).json({ message: "All active students promoted successfully!" });
    } catch (error) {
        console.error("Error promoting students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
*/

export const updatePoints = async (req, res) => {
    try {
        const { hallticketNumber } = req.params;
        const { semester, points } = req.body;
        console.log("Updating points for:", hallticketNumber);

        // Find the student by hall ticket number
        const student = await Student.findOne({ hallticketNumber });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        console.log("Semester:", semester);

        // Ensure points is a valid number
        const parsedPoints = Number(points);
        if (isNaN(parsedPoints)) {
            return res.status(400).json({ message: "Invalid points value" });
        }

        // Update the points for the given semester (0-based index)
        student.points[semester - 1] = (Number(student.points[semester - 1]) || 0) + parsedPoints;
        student.totalPoints = (Number(student.totalPoints) || 0) + parsedPoints;
        if (student.totalPoints >= 20) {
            student.totalPoints = 20;
        }
        await student.save();

        res.json({ message: "Student points updated successfully" });
    } catch (error) {
        console.error("Error updating student points:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



