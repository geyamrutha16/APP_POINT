import express from "express";
import {
    addOperator,
    fetchOperator,
    removeOperator,
    updateOperator
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/addOperator", addOperator); // POST: Submit Form
router.get("/fetchOperator", fetchOperator);// Route to update a form
router.delete("/removeOperator/:id", removeOperator);
router.put("/updateOperator/:id", updateOperator);// Route to update a form

export default router;
