import express from "express";
import { submitForm, getPastForms, updateForms, deleteForms, deleteFormByDate, getPendingForms, verifyForm } from "../controllers/operatorController.js";

const router = express.Router();

router.post("/approval", submitForm); // POST: Submit Form
router.get("/past-forms", getPastForms); // GET: Fetch Past Forms
router.put("/updateForm/:id", updateForms);// Route to update a form
router.delete('/deleteforms/:hallticket_number', deleteForms);
router.delete('/deleteFormsBeforeDate', deleteFormByDate);
router.get("/pending", getPendingForms);
router.put("/verify/:id", verifyForm);
// Route for verifying a single certificate


export default router;
