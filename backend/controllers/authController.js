import Operator from "../models/operator.js";

export const login = async (req, res) => {
    const { username, password } = req.body;
    console.log("Login attempt:", req.body); // This should log the credentials

    const operator = await Operator.findOne({ username });
    if (!operator) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If not hashing, use a simple comparison:
    if (password !== operator.password) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ token: 'dummy-token', role: 'operator' });
};
