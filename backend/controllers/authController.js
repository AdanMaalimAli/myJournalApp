const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// continue with google
exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, error: 'No token provided' });
  }

  try {
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email, name, picture, sub } = ticket.getPayload();

    // 1. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 2. If new, create them with a unique username and random password
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const uniqueUsername = name.split(' ')[0].toLowerCase() + crypto.randomInt(100, 999);

      user = await User.create({
        username: uniqueUsername,
        email,
        password: tempPassword,
        profilePicture: picture,
        googleId: sub, // Store this to link the account
      });
    }

    // 3. Generate your app's JWT and send it back
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
};



// @route     POST /api/auth/register
// @access    Public
exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.create({
      username,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
      // Check for duplicate field error
      if (err.code === 11000) {
           return res.status(400).json({ success: false, error: 'Email already exists' });
      }
      res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Login user
// @route     POST /api/auth/login
// @access    Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate emil & password
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide an email and password' });
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
      res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Get current logged in user
// @route     GET /api/auth/me
// @access    Private
exports.getMe = async (req, res, next) => {
  try {
      const user = await User.findById(req.user.id);
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        },
      });
  } catch (err) {
      res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Forgot password
// @route     POST /api/auth/forgotpassword
// @access    Public
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ success: false, error: 'There is no user with that email' });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  // Note: FRONTEND_URL should be in .env, e.g., http://localhost:5173
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to:${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
};

// @desc      Reset password
// @route     PUT /api/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid token' });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
};

// @desc      Update user details
// @route     PUT /api/auth/updatedetails
// @access    Private
exports.updateDetails = async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.username,
    email: req.body.email,
  };

  if (req.file) {
    fieldsToUpdate.profilePicture = req.file.filename;
  }

  try {
      const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
      });
    
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        },
      });
  } catch(err) {
      res.status(400).json({ success: false, error: err.message });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    // .cookie('token', token, options) // Optional: if you want to use cookies
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
};
