import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { demote, exportStudents, getStudents, promote, updatePoints, uploadExcel, activateStudent, getInactiveStudents, getUploads, promoteSelected } from "../controllers/studentController.js";

const router = express.Router();
router.post("/upload", upload.single("file"), uploadExcel);
router.get("/getStudents", getStudents);
router.get("/getInactiveStudents", getInactiveStudents);
router.get("/getAllStudents", getStudents);
router.post("/exportStudents", exportStudents);
router.put("/demote/:id", demote);
router.put("/promoteAll", promote);
router.put("/promoteSelected", promoteSelected);
router.put("/update/:hallticketNumber", updatePoints);
router.get('/uploads', getUploads);
router.put('/activate/:id', activateStudent);


export default router;