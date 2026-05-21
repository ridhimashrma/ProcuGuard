const express = require('express');

const router = express.Router();

const Product = require('../models/Product');

const Vendor = require('../models/Vendor');

const {
  protect,
  adminOnly
} = require('../middleware/auth');


// ===============================
// CREATE PRODUCT
// Vendor only
// ===============================
router.post('/', protect, async (req, res) => {

  try {

    // Only vendors allowed
    if (req.user.role !== 'vendor') {

      return res.status(403).json({
        message: 'Only vendors can add products'
      });

    }

    // Find vendor profile linked to logged in user
    const vendorProfile = await Vendor.findOne({
      user: req.user._id
    });

    if (!vendorProfile) {

      return res.status(404).json({
        message: 'Vendor profile not found'
      });

    }

    const {
      name,
      category,
      description,
      price,
      stock,
      image,
      features
    } = req.body;

    const product = await Product.create({

      // IMPORTANT:
      // Store VENDOR id, NOT USER id
      vendor: vendorProfile._id,

      name,

      category,

      description,

      price,

      stock,

      image,

      features,

      inStock: stock > 0

    });

    // Populate vendor before sending response
    const populatedProduct =
      await Product.findById(product._id)
        .populate(
          'vendor',
          'name email category'
        );

    res.status(201).json(populatedProduct);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


// ===============================
// GET ALL PRODUCTS
// ===============================
router.get('/', async (req, res) => {

  try {

    const products = await Product.find()

      .populate(
        'vendor',
        'name email category'
      );

    res.json(products);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


// ===============================
// GET MY PRODUCTS
// Vendor only
// ===============================
router.get('/my-products', protect, async (req, res) => {

  try {

    if (req.user.role !== 'vendor') {

      return res.status(403).json({
        message: 'Only vendors can access this'
      });

    }

    // Find vendor profile
    const vendorProfile = await Vendor.findOne({
      user: req.user._id
    });

    if (!vendorProfile) {

      return res.status(404).json({
        message: 'Vendor profile not found'
      });

    }

    const products = await Product.find({
      vendor: vendorProfile._id
    });

    res.json(products);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


// ===============================
// UPDATE PRODUCT
// ===============================
router.put('/:id', protect, async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    if (!product) {

      return res.status(404).json({
        message: 'Product not found'
      });

    }

    const vendorProfile = await Vendor.findOne({
      user: req.user._id
    });

    if (
      req.user.role !== 'vendor' ||
      !vendorProfile ||
      product.vendor.toString() !== vendorProfile._id.toString()
    ) {

      return res.status(403).json({
        message: 'Not authorized'
      });

    }

    Object.assign(product, req.body);

    product.inStock = product.stock > 0;

    await product.save();

    res.json(product);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});


// ===============================
// DELETE PRODUCT
// ===============================
router.delete('/:id', protect, async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    if (!product) {

      return res.status(404).json({
        message: 'Product not found'
      });

    }

    const vendorProfile = await Vendor.findOne({
      user: req.user._id
    });

    if (
      req.user.role !== 'vendor' ||
      !vendorProfile ||
      product.vendor.toString() !== vendorProfile._id.toString()
    ) {

      return res.status(403).json({
        message: 'Not authorized'
      });

    }

    await product.deleteOne();

    res.json({
      message: 'Product deleted'
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

});

module.exports = router;