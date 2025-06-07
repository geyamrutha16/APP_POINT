const Form = require('../models/approvalSchema');

// Submit form
router.post('/submit', async (req, res) => {
    try {
        const newForm = new Form(req.body);
        await newForm.save();
        res.json({ message: 'Form submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get pending forms
router.get('/pending', async (req, res) => {
    try {
        const forms = await Form.find({ status: 'pending' });
        res.json(forms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify form
router.put('/verify/:id', async (req, res) => {
    try {
        await Form.findByIdAndUpdate(req.params.id, { status: 'verified' });
        res.json({ message: 'Form verified successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

