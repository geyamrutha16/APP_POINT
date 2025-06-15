import path from "path";
import { createCanvas, loadImage } from "canvas";
import Certificate from "../models/Certificate.js";
import cloudinary from "../services/cloudinaryService.js";
import { PDFExtract } from "pdf.js-extract";
import { fileURLToPath } from "url";
import Student from "../models/Student.js";
import { deleteFileFromCloudinary } from "../services/cloudinaryService.js"; // adjust path if needed
import { v4 as uuidv4 } from 'uuid';
import QRCode from "qrcode";
import { Console } from "console";

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Extract text from PDF
const extractTextFromPDF = async (filePath) => {
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extract(filePath, {});
    const textLines = [];

    for (const page of data.pages) {
        const pageLines = page.content
            .map(item => item.str.trim())
            .filter(str => str.length > 0);
        textLines.push(...pageLines);
    }

    return textLines;
};

export const listCertificates = async (req, res) => {
    try {
        const certs = await Certificate.find().populate("eventId");
        res.json(certs);
    } catch (err) {
        console.error("Error fetching certificates:", err);
        res.status(500).json({ error: "Failed to fetch certificates" });
    }
};

const extractPublicId = (cloudinaryUrl) => {
    if (!cloudinaryUrl) return null;

    try {
        // Split the URL into parts
        const parts = cloudinaryUrl.split('/');

        // Extract filename with extension (e.g., abc123.jpg)
        const filenameWithExt = parts.pop();

        // Remove version info (e.g., v1743925841)
        const maybeVersion = parts[parts.length - 1];
        if (/^v\d+$/.test(maybeVersion)) {
            parts.pop(); // remove version part
        }

        // Find the folder path after "upload/"
        const uploadIndex = parts.findIndex(p => p === 'upload');
        const folderPath = parts.slice(uploadIndex + 1).join('/');

        // Remove file extension
        const filename = filenameWithExt.split('.')[0];

        return `${folderPath}/${filename}`; // e.g., certificates/abc123
    } catch (error) {
        console.error("Error extracting public_id from Cloudinary URL:", cloudinaryUrl);
        return null;
    }
};

export const deleleCertificates = async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const cutoffDate = new Date(date);

    try {
        const oldCertificates = await Certificate.find({ createdAt: { $lt: cutoffDate } });

        // Delete from Cloudinary
        for (const cert of oldCertificates) {
            const publicId = extractPublicId(cert.cloudinaryUrl);
            if (publicId) {
                await deleteFileFromCloudinary(publicId);
            }
        }

        // Delete from MongoDB
        const result = await Certificate.deleteMany({ createdAt: { $lt: cutoffDate } });

        res.json({ message: `${result.deletedCount} certificate(s) deleted.` });
    } catch (error) {
        console.error("Error deleting certificates and files:", error);
        res.status(500).json({ message: 'Server error while deleting' });
    }
};

export const verifyCertificate = async (req, res) => {
    try {
        console.log("🔍 Route hit with IAC No:", req.params.iacNo);
        console.log("Request headers:", req.headers);
        console.log("Request IP:", req.ip);

        const { iacNo } = req.params;
        const cert = await Certificate.findOne({ iacNo: new RegExp(`^${iacNo}$`, 'i') }).populate('eventId');

        if (!cert) {
            console.log("❌ Certificate not found for IAC:", iacNo);
            return res.status(404).send(`
                <html>
                    <head><title>Certificate Not Found</title></head>
                    <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                        <h1 style="color: red;">❌ Certificate Not Found</h1>
                        <p>The certificate with IAC No <strong>${iacNo}</strong> does not exist.</p>
                        <p>Scanned at: ${new Date().toLocaleString()}</p>
                    </body>
                </html>
            `);
        }

        console.log("✅ Found certificate:", {
            name: cert.name,
            regNo: cert.regNo,
            event: cert.eventId?.eventName
        });

        res.send(`
            <html>
                <head>
                    <title>Certificate Verification</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', sans-serif;
                            background-color: #f3f3f3;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            background: white;
                            padding: 30px 40px;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            max-width: 800px;
                            width: 90%;
                        }
                        .header {
                            border-bottom: 1px solid #ccc;
                            margin-bottom: 20px;
                            padding-bottom: 10px;
                            display: flex;
                            align-items: center;
                        }
                        .header img {
                            height: 50px;
                        }
                        .status-bar {
                            background-color: #28a745;
                            color: white;
                            padding: 12px 20px;
                            border-radius: 6px;
                            font-weight: bold;
                            margin: 20px 0;
                            text-align: center;
                            font-size: 18px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                        }
                        td {
                            padding: 12px 15px;
                            border: 1px solid #ddd;
                            font-size: 16px;
                        }
                        .image-preview {
                            margin-top: 20px;
                            text-align: center;
                        }
                        .image-preview img {
                            max-width: 100%;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://th.bing.com/th/id/R.59213678243bd1208cbe326db74b9e34?rik=kobU1oUkWq%2fUcw&riu=http%3a%2f%2fnecg.ac.in%2fimages%2flogo-engg.png&ehk=ZREqNGZgA6ZXMWqjGsLzQF7ucDpxFoosrAnC2MNlVfE%3d&risl=&pid=ImgRaw&r=0" alt="Logo" />
                        </div>
                        <div class="status-bar">✅ Certificate Verified</div>
                        <table>
                            <tr><td><strong>Name:</strong></td><td>${cert.name}</td></tr>
                            <tr><td><strong>Hall Ticket Number:</strong></td><td>${cert.regNo}</td></tr>
                            <tr><td><strong>Year:</strong></td><td>${cert.year}</td></tr>
                            <tr><td><strong>Semester:</strong></td><td>${cert.sem}</td></tr>
                            <tr><td><strong>Department:</strong></td><td>${cert.department}</td></tr>
                            <tr><td><strong>IAC Number:</strong></td><td>${cert.iacNo}</td></tr>
                            <tr><td><strong>Event:</strong></td><td>${cert.eventId?.eventName || "N/A"}</td></tr>
                        </table>
                                            <p>Scanned at: ${new Date().toLocaleString()}</p>

                    </div>
                </body>
            </html>
        `);

    } catch (err) {
        console.error("Error verifying certificate:", err);
        res.status(500).send(`
            <html>
                <head><title>Server Error</title></head>
                <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                    <h1 style="color: red;">⚠️ Server Error</h1>
                    <p>Something went wrong while verifying the certificate.</p>
                    <p>Error: ${err.message}</p>
                </body>
            </html>
        `);
    }
};
/*
export const verifyCertificate = async (req, res) => {
    try {
        console.log("🔍 Route hit with IAC No:", req.params.iacNo);
        const { iacNo } = req.params;
        const cert = await Certificate.findOne({ iacNo: new RegExp(`^${iacNo}$`, 'i') }).populate('eventId');

        if (!cert) {
            return res.status(404).send(`
                <html>
                    <head><title>Certificate Not Found</title></head>
                    <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                        <h1 style="color: red;">❌ Certificate Not Found</h1>
                        <p>The certificate with IAC No <strong>${iacNo}</strong> does not exist.</p>
                    </body>
                </html>
            `);
        }

        res.send(`
            <html>
                <head>
                    <title>Certificate Verification</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', sans-serif;
                            background-color: #f3f3f3;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            background: white;
                            padding: 30px 40px;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            max-width: 800px;
                            width: 90%;
                        }
                        .header {
                            border-bottom: 1px solid #ccc;
                            margin-bottom: 20px;
                            padding-bottom: 10px;
                            display: flex;
                            align-items: center;
                        }
                        .header img {
                            height: 50px;
                        }
                        .status-bar {
                            background-color: #28a745;
                            color: white;
                            padding: 12px 20px;
                            border-radius: 6px;
                            font-weight: bold;
                            margin: 20px 0;
                            text-align: center;
                            font-size: 18px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                        }
                        td {
                            padding: 12px 15px;
                            border: 1px solid #ddd;
                            font-size: 16px;
                        }
                        .image-preview {
                            margin-top: 20px;
                            text-align: center;
                        }
                        .image-preview img {
                            max-width: 100%;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://th.bing.com/th/id/R.59213678243bd1208cbe326db74b9e34?rik=kobU1oUkWq%2fUcw&riu=http%3a%2f%2fnecg.ac.in%2fimages%2flogo-engg.png&ehk=ZREqNGZgA6ZXMWqjGsLzQF7ucDpxFoosrAnC2MNlVfE%3d&risl=&pid=ImgRaw&r=0" alt="Logo" />
                        </div>
                        <div class="status-bar">✅ Certificate Verified</div>
                        <table>
                            <tr><td><strong>Name:</strong></td><td>${cert.name}</td></tr>
                            <tr><td><strong>Hall Ticket Number:</strong></td><td>${cert.regNo}</td></tr>
                            <tr><td><strong>Year:</strong></td><td>${cert.year}</td></tr>
                            <tr><td><strong>Semester:</strong></td><td>${cert.sem}</td></tr>
                            <tr><td><strong>Department:</strong></td><td>${cert.department}</td></tr>
                            <tr><td><strong>IAC Number:</strong></td><td>${cert.iacNo}</td></tr>
                            <tr><td><strong>Event:</strong></td><td>${cert.eventId?.eventName || "N/A"}</td></tr>
                        </table>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        console.error("Error verifying certificate:", err);
        res.status(500).send(`
            <html>
                <head><title>Server Error</title></head>
                <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                    <h1 style="color: red;">⚠️ Server Error</h1>
                    <p>Something went wrong while verifying the certificate.</p>
                </body>
            </html>
        `);
    }
};
*/

const generateCertificates = async (event) => {
    // Generate verification URL
    try {
        const uploadsDir = path.resolve(__dirname, "../uploads");
        const pdfPath = path.join(uploadsDir, event.participationListPath);
        const templatePath = path.join(uploadsDir, event.certificateTemplatePath);

        const lines = await extractTextFromPDF(pdfPath);
        const eventName = lines[0]?.includes(":") ? lines[0].split(":")[1]?.trim() : "";
        const eventDate = lines[1]?.includes(":") ? lines[1].split(":")[1]?.trim() : "";
        const academicYear = lines[2]?.includes(":") ? lines[2].split(":")[1]?.trim() : "";

        const participants = [];
        const startIndex = lines.findIndex(line => line.trim() === "SEM") + 1;
        const participantLines = lines.slice(startIndex);

        let i = 0;
        while (i < participantLines.length) {
            i++;
            const regNo = participantLines[i++];
            let name = participantLines[i++].trim();
            while (i < participantLines.length && isNaN(participantLines[i])) {
                name += " " + participantLines[i++].trim();
            }
            const year = participantLines[i++];
            const sem = participantLines[i++];

            participants.push({
                regNo,
                name,
                year,
                sem,
                department: "CSE"
            });
        }

        const templateImage = await loadImage(templatePath);
        const certUrls = [];

        for (const p of participants) {
            try {
                const canvas = createCanvas(templateImage.width, templateImage.height);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(templateImage, 0, 0);
                ctx.fillStyle = "#000"; // try white or red if background is dark
                ctx.textAlign = "left";

                // Fit and draw name
                const fitText = (ctx, text, maxWidth, x, y, baseSize = 100) => {
                    let fontSize = baseSize;
                    do {
                        ctx.font = `bold ${fontSize}px Arial`;
                        fontSize--;
                    } while (ctx.measureText(text).width > maxWidth && fontSize > 35); // prevent too-small fonts
                    console.log(`Font size for name "${text}":`, fontSize);
                    ctx.fillText(text, x, y);
                };
                /*
                                ctx.fillStyle = "#000";
                                ctx.textAlign = "left";
                
                                const fitText = (ctx, text, maxWidth, x, y, baseSize = 50) => {
                                    let fontSize = baseSize;
                                    do {
                                        ctx.font = `bold ${fontSize}px Arial`;
                                        fontSize--;
                                    } while (ctx.measureText(text).width > maxWidth && fontSize > 20);
                                    ctx.fillText(text, x, y);
                                };
                */
                // Generate unique IAC number
                const iacNo = uuidv4().split("-")[0].toUpperCase();

                // Generate verification URL
                const verificationUrl = `http://localhost:5000/api/certificates/verify/${iacNo}`;

                // Generate QR Code
                const qrDataUrl = await QRCode.toDataURL(verificationUrl);
                console.log("✅ QR code generated successfully");
                console.log(verificationUrl);
                const qrImage = await loadImage(qrDataUrl);
                //ctx.drawImage(qrImage, templateImage.width - 250, templateImage.height - 250, 200, 200);
                ctx.drawImage(qrImage, 380, 896, 194, 194);

                // Place values
                fitText(ctx, p.name, 1348, 1186);
                ctx.font = "bold 40px Arial";
                ctx.fillText(p.name, 1348, 1186);
                ctx.fillText(p.regNo, 987, 1340);
                ctx.fillText(p.year, 1778, 1336);
                ctx.fillText(p.sem, 2145, 1336);
                ctx.fillText(p.department, 2548, 1337);
                ctx.fillText(eventName, 1120, 1487);
                ctx.fillText(eventDate, 2576, 1488);
                ctx.fillText(academicYear, 1898, 1644);
                ctx.fillText(iacNo, 2810, 772); // Display IAC No on certificate

                const buffer = canvas.toBuffer("image/jpeg");

                const uploadRes = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "certificates", resource_type: "image" },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                    stream.end(buffer);
                });

                const cert = new Certificate({
                    name: p.name,
                    regNo: p.regNo,
                    year: p.year,
                    sem: p.sem,
                    department: p.department,
                    eventId: event._id,
                    cloudinaryUrl: uploadRes.secure_url,
                    iacNo: iacNo,
                    qrUrl: verificationUrl
                });

                await cert.save();
                certUrls.push(uploadRes.secure_url);

                // Update student points
                let semIndex;
                const yearSemMap = {
                    "1-1": 1, "1-2": 2, "2-1": 3, "2-2": 4,
                    "3-1": 5, "3-2": 6, "4-1": 7, "4-2": 8
                };
                semIndex = yearSemMap[`${p.year}-${p.sem}`];
                const student = await Student.findOne({ hallticketNumber: p.regNo });
                if (semIndex !== undefined && student.status === "Active") {
                    const pointsToAdd = event.points || 0;
                    //const pointsToAdd = Math.min(event.points || 0, 20);
                    await Student.updateOne(
                        { hallticketNumber: p.regNo },
                        {
                            $inc: {
                                [`points.${semIndex - 1}`]: pointsToAdd,
                                totalPoints: pointsToAdd > 20 ? 20 : pointsToAdd
                            }
                        }
                    );
                    console.log(`Added ${pointsToAdd} points to ${p.regNo} for semester ${semIndex}`);
                }

            } catch (innerErr) {
                console.error(`❌ Failed to generate certificate for ${p.name}:`, innerErr);
            }
        }

        return certUrls;

    } catch (err) {
        console.error("❌ Certificate generation failed:", err);
        throw err;
    }
};


/*
const generateCertificates = async (event) => {
    try {
        console.log(event);
        console.log("🔧 Starting certificate generation...");

        const uploadsDir = path.resolve(__dirname, "../uploads");
        const pdfPath = path.join(uploadsDir, event.participationListPath);
        const templatePath = path.join(uploadsDir, event.certificateTemplatePath);

        console.log("📁 Uploads directory resolved:", uploadsDir);
        console.log("📄 PDF path:", pdfPath);
        console.log("🖼️ Template path:", templatePath);

        // Extract text from participation list PDF
        const lines = await extractTextFromPDF(pdfPath);

        const eventName = lines[0]?.includes(":") ? lines[0].split(":")[1]?.trim() : "";
        const eventDate = lines[1]?.includes(":") ? lines[1].split(":")[1]?.trim() : "";
        const academicYear = lines[2]?.includes(":") ? lines[2].split(":")[1]?.trim() : "";

        const participants = [];
        const startIndex = lines.findIndex(line => line.trim() === "SEM") + 1;
        const participantLines = lines.slice(startIndex);

        let i = 0;
        while (i < participantLines.length) {
            i++; // skip SNO
            const regNo = participantLines[i++];
            let name = participantLines[i++];

            // Handle multiline names
            while (isNaN(participantLines[i])) {
                name += " " + participantLines[i++];
            }

            const year = participantLines[i++];
            const sem = participantLines[i++];

            participants.push({
                regNo,
                name,
                year,
                sem,
                department: "CSE",
            });

            console.log("✅ Parsed participant:", { regNo, name, year, sem, department: "CSE" });
        }

        console.log("👥 Total participants parsed:", participants.length);

        const templateImage = await loadImage(templatePath);
        const certUrls = [];

        for (const p of participants) {
            try {
                const canvas = createCanvas(templateImage.width, templateImage.height);
                const ctx = canvas.getContext("2d");

                ctx.drawImage(templateImage, 0, 0);
                ctx.fillStyle = "#000";
                ctx.textAlign = "left";

                // Fit text helper
                const fitText = (ctx, text, maxWidth, x, y, baseSize = 50) => {
                    let fontSize = baseSize;
                    do {
                        ctx.font = `bold ${fontSize}px Arial`;
                        fontSize--;
                    } while (ctx.measureText(text).width > maxWidth && fontSize > 20);
                    ctx.fillText(text, x, y);
                };

                // Place values on template
                fitText(ctx, p.name, 1700, 890, 810);              // Name
                ctx.font = "bold 40px Arial";
                ctx.fillText(p.regNo, 580, 910);                  // Reg No
                ctx.fillText(p.year, 900, 910);                   // Year
                ctx.fillText(p.sem, 1140, 910);                   // Semester
                ctx.fillText(p.department, 1500, 910);            // Department
                ctx.fillText(eventName, 680, 1010);               // Event Name
                ctx.fillText(eventDate, 1570, 1010);              // Event Date
                ctx.fillText(academicYear, 960, 1110);            // Academic Year

                const buffer = canvas.toBuffer("image/jpeg");

                const uploadRes = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "certificates", resource_type: "image" },
                        (err, result) => {
                            if (err) {
                                console.error("❌ Cloudinary upload failed:", err);
                                reject(err);
                            } else {
                                console.log("☁️ Uploaded to Cloudinary:", result.secure_url);
                                resolve(result);
                            }
                        }
                    );
                    stream.end(buffer);
                });

                const cert = new Certificate({
                    name: p.name,
                    regNo: p.regNo,
                    year: p.year,
                    sem: p.sem,
                    department: p.department,
                    eventId: event._id,
                    cloudinaryUrl: uploadRes.secure_url,
                });

                await cert.save();
                console.log("📄 Certificate record saved to DB for:", p.name);

                certUrls.push(uploadRes.secure_url);

                let semIndex;

                if (p.year == '1' && p.sem == '1') {
                    semIndex = 1;
                } else if (p.year == '1' && p.sem == '2') {
                    semIndex = 2;
                } else if (p.year == '2' && p.sem == '1') {
                    semIndex = 3;
                } else if (p.year == '2' && p.sem == '2') {
                    semIndex = 4;
                } else if (p.year == '3' && p.sem == '1') {
                    semIndex = 5;
                } else if (p.year == '3' && p.sem == '2') {
                    semIndex = 6;
                } else if (p.year == '4' && p.sem == '1') {
                    semIndex = 7;
                } else if (p.year == '4' && p.sem == '2') {
                    semIndex = 8;
                }

                if (semIndex !== undefined) {
                    const pointsToAdd = event.points || 0;
                    const updateRes = await Student.updateOne(
                        { hallticketNumber: p.regNo },
                        {
                            $inc: {
                                [`points.${semIndex - 1}`]: pointsToAdd,
                                totalPoints: pointsToAdd
                            }
                        }
                    );

                    console.log(`🎯 Updated points for ${p.name} (${p.regNo}) => +${pointsToAdd}`);
                } else {
                    console.warn(`⚠️ Invalid semester value '${p.sem}' for student ${p.name}`);
                }


            } catch (innerErr) {
                console.error(`❌ Failed to generate certificate for ${p.name}:`, innerErr);
            }
        }

        console.log("✅ All certificates generated and points updated successfully.");
        return certUrls;

    } catch (err) {
        console.error("❌ Certificate generation failed:", err);
        throw err;
    }
};
*/

export { generateCertificates };
