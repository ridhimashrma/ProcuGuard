const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  stock: {
    type: Number,
    required: true,
    min: 0
  },

  image: {
    type: String,
    trim: true
  },

  features: [
    {
      type: String,
      trim: true
    }
  ],

  rating: {
    type: Number,
    default: 0
  },

  totalReviews: {
    type: Number,
    default: 0
  },

  inStock: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);