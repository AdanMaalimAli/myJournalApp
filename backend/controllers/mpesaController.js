const axiosModule = require('axios');
const axios = axiosModule.default || axiosModule;
const User = require('../models/User');

// Helper for Browser-like Headers to bypass Incapsula Firewall
const safaricomHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Content-Type': 'application/json'
};

// @desc      Initiate Mpesa STK Push
// @route     POST /api/payments/stkpush
exports.initiateSTKPush = async (req, res) => {
  console.log('--- START STK PUSH INITIATION ---');
  console.log('Request Body:', req.body);
  console.log('User ID:', req.user?._id);
  
  let { phoneNumber, amount } = req.body;

  if (!phoneNumber || !amount) {
    console.error('Missing phoneNumber or amount');
    return res.status(400).json({ success: false, error: 'Please provide phone number and amount' });
  }

  // Format phone number to 254XXXXXXXXX
  phoneNumber = phoneNumber.replace(/[\s\+]/g, '');
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '254' + phoneNumber.slice(1);
  } else if ((phoneNumber.startsWith('7') || phoneNumber.startsWith('1')) && phoneNumber.length === 9) {
    phoneNumber = '254' + phoneNumber;
  }
  
  if (phoneNumber.length !== 12 || !phoneNumber.startsWith('254')) {
    console.error('Invalid phone format:', phoneNumber);
    return res.status(400).json({ success: false, error: 'Invalid Safaricom phone number format' });
  }

  try {
    // 1. Generate OAuth Token
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      console.error('CRITICAL: MPESA_CONSUMER_KEY or SECRET missing from .env');
      return res.status(500).json({ success: false, error: 'M-Pesa credentials not configured on server' });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    console.log('Requesting OAuth Token from Safaricom...');
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { 
          ...safaricomHeaders,
          Authorization: `Basic ${auth}` 
        },
        timeout: 20000
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('OAuth Token obtained successfully');

    // 2. Prepare Parameters
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!passkey || !callbackUrl) {
      console.error('CRITICAL: MPESA_PASSKEY or CALLBACK_URL missing from .env');
      return res.status(500).json({ success: false, error: 'M-Pesa configuration incomplete on server' });
    }
    
    const now = new Date();
    const timestamp = 
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // 3. Trigger STK Push
    console.log(`Triggering STK Push for ${phoneNumber} (Amount: ${amount})...`);
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: 'MyJournal Pro',
        TransactionDesc: 'Upgrade to Pro'
      },
      {
        headers: { 
          ...safaricomHeaders,
          'Authorization': `Bearer ${accessToken}` 
        },
        timeout: 30000
      }
    );

    console.log('Safaricom STK Response:', stkResponse.data);
    const checkoutID = stkResponse.data.CheckoutRequestID;

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { 
        mpesaPhoneNumber: phoneNumber,
        lastCheckoutRequestID: checkoutID,
        lastPaymentStatus: 'Pending'
      });
      console.log('User updated with CheckoutRequestID:', checkoutID);
    }

    console.log('--- STK PUSH INITIATED SUCCESSFULLY ---');
    res.status(200).json({ success: true, checkoutRequestID: checkoutID });

  } catch (error) {
    console.error('--- STK PUSH FAILED ---');
    if (error.response) {
      console.error('Safaricom Error Status:', error.response.status);
      console.error('Safaricom Error Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Error Message:', error.message);
    }
    
    const errorMessage = error.response?.data?.errorMessage || 
                         error.response?.data?.ResponseDescription || 
                         error.response?.data?.customerMessage || 
                         'Payment initiation failed. Safaricom sandbox may be busy.';

    res.status(500).json({ 
      success: false, 
      error: errorMessage
    });
  }
};

// @desc      Manual Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const checkoutID = user.lastCheckoutRequestID;

    if (!checkoutID) return res.status(400).json({ success: false, error: 'No transaction to verify' });

    // 1. Get Token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { 
        headers: { ...safaricomHeaders, Authorization: `Basic ${auth}` },
        timeout: 20000
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Query Status
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const now = new Date();
    const timestamp = 
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
      
    const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const queryResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutID
      },
      { 
        headers: { ...safaricomHeaders, Authorization: `Bearer ${accessToken}` },
        timeout: 20000
      }
    );

    if (queryResponse.data.ResultCode === '0' || queryResponse.data.ResultCode === 0) {
      user.isPro = true;
      user.proSubscriptionDate = new Date();
      user.lastPaymentStatus = 'Success';
      await user.save();
      console.log(`Manual verification successful for user ${user.username}`);
      return res.status(200).json({ success: true, isPro: true });
    }

    res.status(200).json({ success: true, isPro: false, message: queryResponse.data.ResultDesc });

  } catch (error) {
    if (error.response?.data?.fault?.detail?.errorcode === 'policies.ratelimit.SpikeArrestViolation') {
        return res.status(429).json({ success: false, error: 'Slow down! Safaricom rate limit reached.' });
    }
    console.error('Verify Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// @desc      Mpesa Callback
exports.mpesaCallback = async (req, res) => {
  console.log('--- RECEIVED MPESA CALLBACK ---');
  console.log('Callback Body:', JSON.stringify(req.body, null, 2));

  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      console.error('Invalid Callback Format: Body or stkCallback missing');
      return res.status(200).json({ "ResponseCode": "1", "ResponseDesc": "Invalid Format" });
    }

    const { stkCallback } = Body;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log(`CheckoutRequestID: ${checkoutRequestID}`);
    console.log(`ResultCode: ${resultCode}`);
    console.log(`ResultDesc: ${resultDesc}`);

    if (resultCode === 0 || resultCode === '0') {
      console.log('Payment Successful! Processing user upgrade...');
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const phoneItem = metadata.find(item => item.Name === 'PhoneNumber');
      const phoneNumber = phoneItem?.Value?.toString();

      console.log(`Searching for user with CheckoutRequestID: ${checkoutRequestID} or Phone: ${phoneNumber}`);

      let user = await User.findOne({ lastCheckoutRequestID: checkoutRequestID });
      
      if (!user && phoneNumber) {
        console.log('User not found by CheckoutRequestID, searching by phone suffix...');
        user = await User.findOneAndUpdate(
          { mpesaPhoneNumber: { $regex: phoneNumber.slice(-9) } }, 
          { isPro: true, proSubscriptionDate: new Date(), lastPaymentStatus: 'Success' },
          { new: true }
        );
      } else if (user) {
        user.isPro = true;
        user.proSubscriptionDate = new Date();
        user.lastPaymentStatus = 'Success';
        await user.save();
      }

      if (user) {
        console.log(`SUCCESS: User ${user.username} (ID: ${user._id}) has been upgraded to Pro.`);
      } else {
        console.warn('CRITICAL: Could not find user to upgrade for this successful payment.');
      }
    } else {
      console.warn(`Payment failed or cancelled by user. ResultCode: ${resultCode}`);
      // Update user status if we can find them
      await User.findOneAndUpdate(
        { lastCheckoutRequestID: checkoutRequestID },
        { lastPaymentStatus: 'Failed' }
      );
    }

    return res.status(200).json({ "ResponseCode": "00000000", "ResponseDesc": "success" });

  } catch (error) {
    console.error('CRITICAL Callback Error:', error.message);
    console.error(error.stack);
    return res.status(200).json({ ResultCode: 1, ResultDesc: "Internal Error" });
  }
};
// @desc      Check status (Enhanced with Query fallback)
exports.checkPaymentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // 0. If already Pro, return success immediately
    if (user.isPro) {
      return res.status(200).json({ 
        success: true, 
        isPro: true, 
        paymentStatus: 'Success' 
      });
    }

    // 1. Fallback: If status is still Pending, try to verify directly with Safaricom
    if (user.lastCheckoutRequestID) {
      try {
        const checkoutID = user.lastCheckoutRequestID;
        // ...

        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        const shortcode = process.env.MPESA_SHORTCODE || '174379';
        const passkey = process.env.MPESA_PASSKEY;

        if (consumerKey && consumerSecret && passkey) {
            const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
            const tokenResponse = await axios.get(
              'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
              { headers: { ...safaricomHeaders, Authorization: `Basic ${auth}` }, timeout: 10000 }
            );
            const accessToken = tokenResponse.data.access_token;

            const now = new Date();
            const timestamp = 
                now.getFullYear().toString() +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getDate().toString().padStart(2, '0') +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');
            
            const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

            const queryResponse = await axios.post(
              'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
              { BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutID },
              { headers: { ...safaricomHeaders, Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
            );

            // ResultCode 0 is success
            if (queryResponse.data.ResultCode === '0' || queryResponse.data.ResultCode === 0) {
              user.isPro = true;
              user.proSubscriptionDate = new Date();
              user.lastPaymentStatus = 'Success';
              await user.save();
              console.log(`Auto-query verification successful for ${user.username}`);
            } else if (queryResponse.data.ResultCode === '1032' || queryResponse.data.ResultCode === 1032) {
              user.lastPaymentStatus = 'Cancelled';
              await user.save();
            } else if (queryResponse.data.ResultCode) {
              user.lastPaymentStatus = 'Failed';
              await user.save();
            }
        }
      } catch (queryErr) {
        console.warn('Silent Query Error during poll:', queryErr.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      isPro: user.isPro, 
      paymentStatus: user.lastPaymentStatus 
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
