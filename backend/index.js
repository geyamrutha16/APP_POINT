import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './db/connectDB.js';
import adminRoutes from './routes/adminRoutes.js';
import operatorRoutes from "./routes/operatorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import internalEventRoutes from './routes/internalEventRoutes.js';
import certificateRoutes from "./routes/certificateRoutes.js";
import cors from 'cors';
import path from 'path';
const __dirname = path.resolve();

/*---------------deployment--------------


if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "./frontend/build")));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("API id running successfully");
    });
}

//---------------deployment--------------*/

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/internal-events', internalEventRoutes);
app.use("/api/certificates", certificateRoutes);
//app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
