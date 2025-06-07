import express from 'express';
import multer from 'multer';
import { uploadEvent, getAllEvents, verifyEvent, downloadFile, deleteEventsBeforeDate } from '../controllers/eventController.js';

const router = express.Router();

// Multer configuration to store files with original names
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), uploadEvent);
router.get('/', getAllEvents);
router.put('/verifyEvent/:id', verifyEvent);
router.get('/download/:id', downloadFile);
router.delete('/deleteEventsBeforeDate', deleteEventsBeforeDate);

export default router;
