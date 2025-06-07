import express from 'express';
const router = express.Router();
import { login } from "../controllers/authController.js";

router.post("/login", login);

export default router;


// POST /api/auth/login
/*
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log("Login attempt - Username:", username, "Password:", password);

    // Check if the user exists (for operator login)
    const operator = await Operator.findOne({ username });
    if (!operator) {
        return res.status(400).json({ message: 'User not found' });
    }

    console.log("Input password:", password.trim());
    console.log("Stored password:", operator.password);
    if (password.trim() !== operator.password) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create a token (you might want to include more info)
    const token = jwt.sign({ username: operator.username, role: 'operator' }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, role: 'operator' });
});*/

// controllers/authController.js

