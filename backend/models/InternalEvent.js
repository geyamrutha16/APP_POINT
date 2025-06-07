import mongoose from 'mongoose';

const internalEventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    eventDate: { type: Date, required: true },
    points: { type: Number, required: true },
    participationListPath: { type: String, required: true },
    certificateTemplatePath: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending',
    },
}, { timestamps: true });

const InternalEvent = mongoose.model('InternalEvent', internalEventSchema);
export default InternalEvent;
