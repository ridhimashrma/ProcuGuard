const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    trim: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4.0
  },

  phone: {
    type: String,
    trim: true
  },

  address: {
    type: String,
    trim: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);