import express from "express";
import { deleleCertificates, generateCertificates, listCertificates, verifyCertificate } from "../controllers/certificateController.js";

const router = express.Router();

// Generate certificates for an event
router.post("/generate/:eventId", generateCertificates);

// View all certificates
router.get("/list", listCertificates);

router.get('/verify/:iacNo', verifyCertificate);

router.delete("/delete-certificates", deleleCertificates)

export default router;
