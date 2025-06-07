import InternalEvent from '../models/InternalEvent.js';

export const uploadInternalEvent = async (req, res) => {
    const { eventName, eventDate, points } = req.body;
    const participationList = req.files?.participationList?.[0]?.filename;
    const certificateTemplate = req.files?.certificateTemplate?.[0]?.filename;

    try {
        const newInternalEvent = new InternalEvent({
            eventName,
            eventDate,
            points,
            participationList,
            certificateTemplate,
        });
        await newInternalEvent.save();
        res.status(201).json({ message: 'Internal event uploaded successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
};

export const getAllInternalEvents = async (req, res) => {
    const internalEvents = await InternalEvent.find({});
    res.json(internalEvents);
};
