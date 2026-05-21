const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      businessName,
      businessType
    } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // ROLE LOGIC
      let assignedRole = 'user';

      // ADMIN GUARD
      if (
        role === 'admin' &&
        req.headers['x-admin-secret'] === 'PROCUGUARD_ADMIN'
      ) {

        assignedRole = 'admin';

      }

      // VENDOR REGISTRATION
      else if (role === 'vendor') {

        assignedRole = 'vendor';

      }

      const user = await User.create({

        name,
        email,
        password,
      
        role: assignedRole,
      
        businessName:
          assignedRole === 'vendor'
            ? businessName
            : '',
      
        businessType:
          assignedRole === 'vendor'
            ? businessType
            : ''
      
      });
      if (assignedRole === 'vendor') {

        await Vendor.create({
      
          name: businessName || name,
      
          email,
      
          category: businessType || 'General',
      
          user: user._id,
      
          rating: 4
      
        });
      
      }
      
    const token = signToken(user._id);
    await sendEmail({

      to: user.email,
    
      subject: 'Welcome to ProcuGuard 🎉',
    
      html: `
    
        <div style="font-family:sans-serif">
    
          <h2>Welcome ${user.name}</h2>
    
          <p>
            Your account has been registered successfully.
          </p>
    
          <p>
            Role: <b>${user.role}</b>
          </p>
    
        </div>
    
      `
    
    });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
   
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (
      user.role === 'vendor' &&
      !user.vendorApproved
    ) {
    
      return res.status(403).json({
        message: 'Vendor account awaiting admin approval'
      });
    
    }

    const token = signToken(user._id);
    await sendEmail({

      to: user.email,
    
      subject: 'New Login Detected',
    
      html: `
    
        <div style="font-family:sans-serif">
    
          <h2>Hello ${user.name}</h2>
    
          <p>
            A new login was detected on your account.
          </p>
    
          <p>
            If this wasn't you, please secure your account.
          </p>
    
        </div>
    
      `
    
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

module.exports = router;
