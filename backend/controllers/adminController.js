import Operator from "../models/operator.js";

// Add a new operator
export const addOperator = async (req, res) => {
    console.log(req.body);
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: "Please fill all the fields." });
        }
        const newOperator = new Operator({
            name: name.trim(),
            username: username.trim(),
            password: password.trim(),
        });
        await newOperator.save();
        res.status(201).json({ message: "Operator Added!", operator: newOperator });
    } catch (error) {
        console.error("Error saving operator:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Fetch all operators
export const fetchOperator = async (req, res) => {
    try {
        const operators = await Operator.find();
        if (!operators || operators.length === 0) {
            return res.status(200).json({ message: "No Operators found", operators: [] });
        }
        res.status(200).json({ operators });
    } catch (error) {
        console.error("Error fetching operators:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Remove an operator by ID
export const removeOperator = async (req, res) => {
    try {
        const { id } = req.params;
        const removedOperator = await Operator.findByIdAndDelete(id);
        if (!removedOperator) {
            return res.status(404).json({ message: "Operator not found" });
        }
        res.status(200).json({ message: "Operator removed", operator: removedOperator });
    } catch (error) {
        console.error("Error removing operator:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// Update an operator by ID
export const updateOperator = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, password } = req.body;
        const updateData = { name, username };
        if (password) {
            updateData.password = password; // For security, consider hashing the new password
        }
        const updatedOperator = await Operator.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedOperator) {
            return res.status(404).json({ message: "Operator not found" });
        }
        res.status(200).json({ message: "Operator updated", operator: updatedOperator });
    } catch (error) {
        console.error("Error updating operator:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

