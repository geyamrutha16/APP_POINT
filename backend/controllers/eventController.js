import xlsx from "xlsx";
import Student from "../models/Student.js";
import Event from "../models/eventModel.js";

// Upload Event Handler
export const uploadEvent = async (req, res) => {
    try {
        const { eventName, eventDate } = req.body;
        const filePath = req.file.path;

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const students = data.map(row => ({
            hallticket_number: row.HallticketNumber,
            name: row.Name,
            points: row.Points,
            semester: row.Semester,
        }));

        // Creating a new Event using the Mongoose model
        const event = new Event({
            eventName,
            eventDate,
            fileName: req.file.originalname,
            filePath,
            students,
            status: "pending",
        });

        await event.save();
        res.status(201).json({ message: "Event uploaded successfully!" });
    } catch (error) {
        console.error("Error uploading event:", error.message);
        res.status(500).json({ error: "Error uploading event" });
    }
};

export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error.message);
        res.status(500).json({ error: "Error fetching events" });
    }
};

export const verifyEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the event
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if the event is already verified
        if (event.status === "verified") {
            return res.status(400).json({ message: "Event is already verified" });
        }

        // Check if the event is rejected
        if (event.status === 'rejected') {
            return res.status(400).json({ message: "Event is already rejected" });
        }

        // Only add points if the event is being verified (not rejected)
        if (req.body.status === "verified") {
            console.log(event.students);
            // Update points for all students in the event
            for (const studentData of event.students) {
                const student = await Student.findOne({ hallticketNumber: studentData.hallticket_number });
                console.log(student);
                if (student) {
                    const pointsToAdd = Number(studentData.points) || 0;
                    const semIndex = Number(studentData.semester);
                    if (!isNaN(semIndex) && semIndex >= 0 && semIndex < 8) {
                        student.points[semIndex - 1] += pointsToAdd;
                        await student.save();
                        console.log(`Points verified for student ${student.name} (Sem ${semIndex}): +${pointsToAdd}`);
                    }
                } else {
                    console.log(`Student not found: ${studentData.name}`);
                }
            }
        }

        // Update the event status
        event.status = req.body.status || "verified";
        await event.save();

        res.json({ message: `Event ${event.status} successfully!`, event });
    } catch (error) {
        console.error("Error verifying event:", error.message);
        res.status(500).json({ error: "Error verifying event" });
    }
};

/*
export const verifyEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the event and update the status to "verified"
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.status === 'rejected') {
            return res.status(400).json({ message: "Event is rejected successfully..!" });
        }

        // Check if the event is already verified
        if (event.status === "verified") {
            return res.status(400).json({ message: "Event is already verified" });
        }

        console.log(event.students);

        // Update points for all students in the event
        for (const studentData of event.students) {
            const student = await Student.findOne({ hallticketNumber: studentData.hallticket_number });
            console.log(student);
            if (student) {
                const pointsToAdd = Number(studentData.points) || 0;
                const semIndex = Number(studentData.semester);
                if (!isNaN(semIndex) && semIndex >= 0 && semIndex < 8) {
                    student.points[semIndex - 1] += pointsToAdd;
                    await student.save();
                    console.log(`Points verified for student ${student.name} (Sem ${semIndex}): +${pointsToAdd}`);
                }
            } else {
                console.log(`Student not found: ${studentData.name}`);
            }
        }

        event.status = "verified";
        await event.save();

        res.json({ message: "Event verified successfully!", event });
    } catch (error) {
        console.error("Error verifying event:", error.message);
        res.status(500).json({ error: "Error verifying event" });
    }
};
*/


export const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: "File not found" });
        }

        res.download(event.filePath, event.fileName);
    } catch (error) {
        console.error("Error downloading file:", error.message);
        res.status(500).json({ error: "Error downloading file" });
    }
};

// Backend: Delete events before a specific date
export const deleteEventsBeforeDate = async (req, res) => {
    try {
        const { deleteDate } = req.body;

        if (!deleteDate) {
            return res.status(400).json({ message: "Delete date is required" });
        }

        // Delete events before the specified date
        const result = await Event.deleteMany({ eventDate: { $lt: new Date(deleteDate) } });

        res.json({
            message: `${result.deletedCount} events deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Error deleting events:", error);
        res.status(500).json({ message: "Error deleting events", error: error.message });
    }
};

