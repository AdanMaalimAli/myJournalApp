const axiosModule = require('axios');
const axios = axiosModule.default || axiosModule;
const User = require('../models/User');

// @desc      Initiate Mpesa STK Push
// @route     POST /api/payments/stkpush
// @access    Private
exports.initiateSTKPush = async (req, res) => {
  console.log('STK Push Request Received:', req.body);
  let { phoneNumber, amount } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({ success: false, error: 'Please provide phone number and amount' });
  }

  // Format phone number to 254XXXXXXXXX
  phoneNumber = phoneNumber.replace(/[\s\+]/g, ''); // Remove spaces and plus sign
  
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '254' + phoneNumber.slice(1);
  } else if (phoneNumber.startsWith('7') || phoneNumber.startsWith('1')) {
    if (phoneNumber.length === 9) {
      phoneNumber = '254' + phoneNumber;
    }
  }
  
  // Final check: must be 12 characters and start with 254
  if (phoneNumber.length !== 12 || !phoneNumber.startsWith('254')) {
    return res.status(400).json({ success: false, error: 'Invalid Safaricom phone number format' });
  }

  try {
    // 1. Generate OAuth Token (Safaricom Daraja)
    console.log('Generating OAuth Token...');
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        },
        timeout: 15000 // Increased timeout to 15s
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('OAuth Token Generated Successfully');

    // 2. STK Push Parameters
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    
    const date = new Date();
    const timestamp = 
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    // 3. Trigger STK Push
    console.log(`Step 3: Sending STK Push request to Safaricom for ${phoneNumber}...`);
    
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: 'MyJournal',
        TransactionDesc: 'Upgrade to Pro'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        timeout: 15000 // Increased timeout to 15s for sandbox
      }
    );

    console.log('Safaricom Response Received:', stkResponse.data);

    const checkoutID = stkResponse.data.CheckoutRequestID;

    // Update user's phone number and store the CheckoutRequestID
    if (req.user && req.user.id) {
      console.log('Updating user info for ID:', req.user.id);
      await User.findByIdAndUpdate(req.user.id, { 
        mpesaPhoneNumber: phoneNumber,
        lastCheckoutRequestID: checkoutID
      });
    }

    res.status(200).json({
      success: true,
      message: 'STK Push initiated successfully',
      checkoutRequestID: checkoutID 
    });

  } catch (error) {
    console.error('Mpesa STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.errorMessage || 'Payment initiation failed' 
    });
  }
};

// @desc      Manual Verify payment by querying Safaricom
// @route     GET /api/payments/verify
// @access    Private
exports.verifyPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const checkoutID = user.lastCheckoutRequestID;

    if (!checkoutID) {
      return res.status(400).json({ success: false, error: 'No transaction to verify' });
    }

    // 1. Get Token
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 10000
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Query Transaction Status
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    
    const date = new Date();
    const timestamp = 
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const queryResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutID
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    // 0 means success
    if (queryResponse.data.ResultCode === '0') {
      user.isPro = true;
      user.proSubscriptionDate = new Date();
      await user.save();
      
      return res.status(200).json({
        success: true,
        isPro: true,
        message: 'Payment verified successfully!'
      });
    }

    res.status(200).json({
      success: true,
      isPro: false,
      message: queryResponse.data.ResultDesc
    });

  } catch (error) {
    console.error('Verify Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// @desc      Mpesa Callback (Called by Safaricom)
// @route     POST /api/payments/callback
// @access    Public
exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    const resultDesc = stkCallback.ResultDesc;
    const resultCode = stkCallback.ResultCode;
    const checkoutRequestID = stkCallback.CheckoutRequestID;

    if (resultCode === 0) {
      // Payment Successful
      // Find the user who initiated this and upgrade them to Pro
      // Note: You'll need to store the CheckoutRequestID in the DB temporarily to map this back
      
      // Simulation: find user by phone number from the callback data
      const metadata = stkCallback.CallbackMetadata.Item;
      const phoneItem = metadata.find(item => item.Name === 'PhoneNumber');
      const phoneNumber = phoneItem.Value.toString();

      const user = await User.findOneAndUpdate(
        { mpesaPhoneNumber: { $regex: phoneNumber.slice(-9) } }, // Match last 9 digits
        { 
          isPro: true, 
          proSubscriptionDate: new Date() 
        }
      );

      console.log(`Payment successful for user ${user?.username}. Upgraded to Pro.`);
    } else {
      console.log(`Payment failed: ${resultDesc}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Mpesa Callback Error:', error);
    res.status(500).json({ success: false });
  }
};

// @desc      Check payment status (Frontend polling)
// @route     GET /api/payments/status
// @access    Private
exports.checkPaymentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Debug log to see what the frontend is seeing
    console.log(`Polling status for user ${user.username}: isPro = ${user.isPro}`);
    
    res.status(200).json({
      success: true,
      isPro: user.isPro,
      username: user.username
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ success: false });
  }
};
