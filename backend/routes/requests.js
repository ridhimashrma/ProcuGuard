const express = require('express');
const router = express.Router();

const Request = require('../models/Request');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

const { protect, adminOnly } = require('../middleware/auth');



// ==========================================
// GET ALL REQUESTS
// ==========================================
router.get('/', protect, async (req, res) => {

  try {

    const {
      status,
      search,
      sort
    } = req.query;

    let filter = req.user.role === 'admin'
      ? {}
      : { user: req.user._id };

    // STATUS FILTER
    if (status) {
      filter.status = status;
    }

    // SEARCH FILTER
    if (search) {
      filter.itemName = {
        $regex: search,
        $options: 'i'
      };
    }

    // SORTING
    let sortOption = { createdAt: -1 };

    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    if (sort === 'quantity-high') {
      sortOption = { quantity: -1 };
    }

    if (sort === 'quantity-low') {
      sortOption = { quantity: 1 };
    }

    const requests = await Request.find(filter)
      .populate('user', 'name email')
      .populate('vendor', 'name email category')
      .sort(sortOption);

    res.json(requests);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});



// ==========================================
// CREATE REQUEST
// ==========================================
router.post('/', protect, async (req, res) => {

  try {

    const {
      itemName,
      quantity,
      vendor,
      notes
    } = req.body;

    if (!itemName || !quantity || !vendor) {

      return res.status(400).json({
        message: 'Item name, quantity and vendor are required'
      });

    }

    const request = await Request.create({
      user: req.user._id,
      itemName,
      quantity,
      vendor,
      notes
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('user', 'name email')
      .populate('vendor', 'name email category');

    res.status(201).json(populatedRequest);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


// ==========================================
// UPDATE REQUEST STATUS
// ==========================================
router.put('/:id/status', protect, adminOnly, async (req, res) => {

  try {

    const { status } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {

      return res.status(404).json({
        message: 'Request not found'
      });

    }

    // WORKFLOW RULES
    const workflow = {

      pending: [
        'under-review',
        'cancelled'
      ],

      'under-review': [
        'approved',
        'rejected',
        'cancelled'
      ],

      approved: [
        'ordered',
        'failed',
        'cancelled'
      ],

      ordered: [
        'delivered',
        'failed'
      ],

      delivered: [
        'completed'
      ],

      completed: [],

      rejected: [],

      cancelled: [],

      failed: []
    };

    const currentStatus = request.status;

    const allowedNextStatuses =
      workflow[currentStatus] || [];

    // VALIDATION
    if (!allowedNextStatuses.includes(status)) {

      return res.status(400).json({
        message: `Invalid transition from "${currentStatus}" to "${status}"`
      });

    }

    // UPDATE STATUS
    request.status = status;

    // TIMELINE ENTRY
    request.timeline.push({
      status,
      changedAt: new Date()
    });

    await request.save();

    // GET UPDATED REQUEST
    const populatedRequest = await Request.findById(request._id)
      .populate('user', 'name email')
      .populate('vendor', 'name email category');

    // CREATE NOTIFICATION
    await Notification.create({

      user: request.user,

      message:
        `Your request for "${request.itemName}" is now "${status}"`

    });

    // SEND EMAIL
    await sendEmail({

      to: populatedRequest.user.email,

      subject: `Request Status Updated - ${status}`,

      text: `
Hello ${populatedRequest.user.name},

Your procurement request for "${populatedRequest.itemName}"
has been updated.

New Status: ${status}

Thank you,
ProcuGuard
      `,

      html: `
        <div style="
          font-family:Arial;
          padding:20px;
          background:#f4f7ff;
        ">

          <div style="
            max-width:600px;
            margin:auto;
            background:white;
            border-radius:12px;
            padding:30px;
            border:1px solid #e5e7eb;
          ">

            <h2 style="
              color:#4f7fff;
              margin-bottom:20px;
            ">
              ProcuGuard Notification
            </h2>

            <p>
              Hello
              <strong>${populatedRequest.user.name}</strong>,
            </p>

            <p>
              Your procurement request for
              <strong>${populatedRequest.itemName}</strong>
              has been updated.
            </p>

            <div style="
              margin:20px 0;
              padding:14px;
              background:#eef4ff;
              border-radius:8px;
            ">

              <strong>New Status:</strong>
              ${status}

            </div>

            <p style="color:#666">
              Thank you,<br>
              ProcuGuard Team
            </p>

          </div>

        </div>
      `
    });

    // RETURN RESPONSE
    res.json(populatedRequest);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  }

});



// ==========================================
// UPDATE REQUEST VENDOR
// ==========================================
router.put('/:id/vendor', protect, adminOnly, async (req, res) => {

  try {

    const { vendorId } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {

      return res.status(404).json({
        message: 'Request not found'
      });

    }

    request.vendor = vendorId;

    request.vendorHistory.push({
      vendor: vendorId,
      assignedAt: new Date()
    });

    await request.save();

    const updatedRequest = await Request.findById(request._id)
      .populate('user', 'name email')
      .populate('vendor', 'name email category');

    res.json(updatedRequest);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});



// ==========================================
// DELETE REQUEST
// ==========================================
router.delete('/:id', protect, adminOnly, async (req, res) => {

  try {

    await Request.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Request deleted'
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});



// ==========================================
// DASHBOARD STATS
// ==========================================
router.get('/stats/overview', protect, async (req, res) => {

  try {

    let filter = req.user.role === 'admin'
      ? {}
      : { user: req.user._id };

    const requests = await Request.find(filter);

    const stats = {

      total: requests.length,

      pending: requests.filter(r =>
        r.status === 'pending'
      ).length,

      underReview: requests.filter(r =>
        r.status === 'under-review'
      ).length,

      approved: requests.filter(r =>
        r.status === 'approved'
      ).length,

      ordered: requests.filter(r =>
        r.status === 'ordered'
      ).length,

      delivered: requests.filter(r =>
        r.status === 'delivered'
      ).length,

      completed: requests.filter(r =>
        r.status === 'completed'
      ).length,

      rejected: requests.filter(r =>
        r.status === 'rejected'
      ).length,

      cancelled: requests.filter(r =>
        r.status === 'cancelled'
      ).length,

      failed: requests.filter(r =>
        r.status === 'failed'
      ).length,
    };

    res.json(stats);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


module.exports = router;