import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import InternalEvent from '../models/InternalEvent.js';
import { generateCertificates } from '../controllers/certificateController.js';

const router = express.Router();

// Needed for __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File upload config


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads'); // Adjust path based on this file's location
        cb(null, uploadPath); // Make sure this folder exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/upload', upload.fields([
    { name: 'participationList', maxCount: 1 },
    { name: 'certificateTemplate', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log("Received upload request.");
        console.log("Request Body:", req.body);
        console.log("Request Files:", req.files);

        const { eventName, eventDate, points } = req.body;

        // Make sure both files are present
        if (!req.files || !req.files.participationList || !req.files.certificateTemplate) {
            return res.status(400).json({ message: 'Missing files in upload' });
        }
        const participationListPath = req.files.participationList[0].filename;
        const certificateTemplatePath = req.files.certificateTemplate[0].filename;


        const newEvent = new InternalEvent({
            eventName,
            eventDate,
            points,
            participationListPath,
            certificateTemplatePath,
            status: 'pending',
        });
        console.log("New Event ------------------");
        console.log(newEvent);

        await newEvent.save();
        res.status(201).json({ message: 'Event uploaded successfully' });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: 'Failed to upload event' });
    }
});


// Get events (all or filtered by status)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const events = await InternalEvent.find(query).sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Update status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'verified'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await InternalEvent.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: 'Status updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating status' });
    }
});

// PATCH /api/internal-events/:id/verify
router.patch('/:id/verify', async (req, res) => {
    try {
        const event = await InternalEvent.findById(req.params.id);

        if (!event) return res.status(404).json({ message: 'Event not found' });
        console.log("Event passed to generateCertificates:", event);

        const certificateUrls = await generateCertificates(event);

        // Optional: Save generated certificate links in event doc (if needed)
        event.status = 'verified';
        event.generatedCertificates = certificateUrls; // Add this field in your schema
        await event.save();

        res.status(200).json({ message: 'Certificates generated', certificateUrls: event.generatedCertificates, });
    } catch (error) {
        console.error('Error generating certificates:', error);
        res.status(500).json({ message: 'Failed to generate certificates' });
    }
});

router.delete('/deleteBeforeDate', async (req, res) => {
    try {
        const { deleteDate } = req.body;

        if (!deleteDate) {
            return res.status(400).json({ message: 'Date is required.' });
        }

        const date = new Date(deleteDate);
        date.setHours(0, 0, 0, 0); // Normalize time

        const result = await InternalEvent.deleteMany({ eventDate: { $lt: date } });

        res.json({ deletedCount: result.deletedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete events.' });
    }
});


export default router;
