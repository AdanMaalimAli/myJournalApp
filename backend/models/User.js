const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  profilePicture: {
    type: String,
    default: 'no-photo.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Don't return password by default
  },
  isPro: {
    type: Boolean,
    default: false,
  },
  proSubscriptionDate: {
    type: Date,
  },
  mpesaPhoneNumber: {
    type: String,
  },
  lastCheckoutRequestID: {
    type: String,
  },
  brokerAccount: {
    platform: {
      type: String, // MT4, MT5, DXTrade, MatchTrader, cTrader
      enum: ['MT4', 'MT5', 'DXTrade', 'MatchTrader', 'cTrader', 'None'],
      default: 'None'
    },
    accountNumber: String,
    brokerServer: String,
    apiKey: String, // Encrypted or from a service like MetaAPI
    connectionStatus: {
      type: String,
      enum: ['Connected', 'Disconnected', 'Error', 'Pending'],
      default: 'Disconnected'
    },
    lastSync: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (e.g., 10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
