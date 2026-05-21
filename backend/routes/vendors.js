const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/vendors — all logged-in users can view
router.get('/', protect, async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/vendors — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, category, rating, phone, address } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email required' });
    const vendor = await Vendor.create({ name, email, category, rating, phone, address });
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/vendors/:id — admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/vendors/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: 'Vendor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
