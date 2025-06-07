import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    eventName: String,
    eventDate: String,
    fileName: String,
    filePath: String,
    status: { type: String, default: 'pending' },
    students: [
        {
            hallticket_number: String,
            name: String,
            points: Number,
            semester: String,
        },
    ],
    dateUploaded: { type: Date, default: Date.now },
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
