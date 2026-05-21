const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  itemName: {
    type: String,
    required: true,
    trim: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },

  status: {
    type: String,
    enum: [
      'pending',
      'under-review',
      'approved',
      'ordered',
      'delivered',
      'completed',
      'rejected',
      'cancelled',
      'failed'
    ],
    default: 'pending'
  },

  notes: {
    type: String,
    trim: true
  },

  adminNote: {
    type: String,
    trim: true
  },

  timeline: [
    {
      status: String,

      changedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  vendorHistory: [
    {
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
      },

      assignedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);