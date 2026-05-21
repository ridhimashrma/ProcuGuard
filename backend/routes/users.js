const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users — admin only
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ===============================
// APPROVE VENDOR
// Admin only
// ===============================
router.put(
  '/:id/approve-vendor',
  protect,
  adminOnly,
  async (req, res) => {

    try {

      const user = await User.findById(req.params.id);

      if (!user) {

        return res.status(404).json({
          message: 'User not found'
        });

      }

      if (user.role !== 'vendor') {

        return res.status(400).json({
          message: 'This user is not a vendor'
        });

      }

      user.vendorApproved = true;

      await user.save();

      res.json({
        message: 'Vendor approved successfully'
      });

    } catch (err) {

      res.status(500).json({
        message: err.message
      });

    }

  }
);
// DELETE /api/users/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
