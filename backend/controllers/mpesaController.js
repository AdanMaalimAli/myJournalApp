const axiosModule = require('axios');
const axios = axiosModule.default || axiosModule;
const https = require('https');
const User = require('../models/User');

// HTTPS Agent to prevent socket hang ups
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  timeout: 60000
});

const safaricomHeaders = {
  'Content-Type': 'application/json'
};

const safaricomRequest = async (config, retries = 2) => {
  try {
    return await axios({
      ...config,
      httpsAgent,
      timeout: config.timeout || 30000
    });
  } catch (err) {
    if (retries > 0 && (err.code === 'ECONNRESET' || err.message.includes('socket hang up') || !err.response)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await safaricomRequest(config, retries - 1);
    }
    throw err;
  }
};

// @desc      Initiate Mpesa STK Push
exports.initiateSTKPush = async (req, res) => {
  let { phoneNumber, amount } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({ success: false, error: 'Please provide phone number and amount' });
  }

  // Format phone number
  phoneNumber = phoneNumber.replace(/[\s\+]/g, '');
  if (phoneNumber.startsWith('0')) phoneNumber = '254' + phoneNumber.slice(1);
  else if ((phoneNumber.startsWith('7') || phoneNumber.startsWith('1')) && phoneNumber.length === 9) phoneNumber = '254' + phoneNumber;
  
  if (phoneNumber.length !== 12 || !phoneNumber.startsWith('254')) {
    return res.status(400).json({ success: false, error: 'Invalid Safaricom phone number format' });
  }

  try {
    // 0. Reset payment status for this user before starting
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { 
        lastPaymentStatus: 'Pending',
        lastCheckoutRequestID: 'initiating...', // Temporary placeholder
        lastPaymentCheck: new Date()
      });
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const tokenResponse = await safaricomRequest({
      method: 'get',
      url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      headers: { ...safaricomHeaders, Authorization: `Basic ${auth}` }
    });

    const accessToken = tokenResponse.data.access_token;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    const now = new Date();
    const timestamp = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0') + now.getSeconds().toString().padStart(2, '0');
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkResponse = await safaricomRequest({
      method: 'post',
      url: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      data: {
        BusinessShortCode: shortcode, Password: password, Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', Amount: amount, PartyA: phoneNumber,
        PartyB: shortcode, PhoneNumber: phoneNumber, CallBackURL: callbackUrl,
        AccountReference: 'MyJournal Pro', TransactionDesc: 'Upgrade to Pro'
      },
      headers: { ...safaricomHeaders, 'Authorization': `Bearer ${accessToken}` }
    });

    const checkoutID = stkResponse.data.CheckoutRequestID;

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { 
        mpesaPhoneNumber: phoneNumber,
        lastCheckoutRequestID: checkoutID,
        lastPaymentStatus: 'Pending'
      });
    }

    res.status(200).json({ success: true, checkoutRequestID: checkoutID });

  } catch (error) {
    console.error('STK Initiation Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment initiation failed. Safaricom sandbox may be busy.' });
  }
};

// @desc      Manual Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const checkoutID = user.lastCheckoutRequestID;

    if (!checkoutID || checkoutID === 'initiating...') return res.status(400).json({ success: false, error: 'No active transaction' });

    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await safaricomRequest({
      method: 'get',
      url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      headers: { ...safaricomHeaders, Authorization: `Basic ${auth}` }
    });

    const accessToken = tokenResponse.data.access_token;
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const now = new Date();
    const timestamp = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0') + now.getSeconds().toString().padStart(2, '0');
    const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const queryResponse = await safaricomRequest({
      method: 'post',
      url: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      data: { BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutID },
      headers: { ...safaricomHeaders, Authorization: `Bearer ${accessToken}` }
    });

    if (queryResponse.data.ResultCode === '0' || queryResponse.data.ResultCode === 0) {
      await User.findByIdAndUpdate(user._id, {
        isPro: true,
        proSubscriptionDate: new Date(),
        lastPaymentStatus: 'Success',
        lastCheckoutRequestID: null // Clear once done
      });
      return res.status(200).json({ success: true, isPro: true });
    }

    res.status(200).json({ success: true, isPro: false, message: queryResponse.data.ResultDesc });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// @desc      Mpesa Callback
exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) return res.status(200).json({ "ResponseCode": "1", "ResponseDesc": "Invalid Format" });

    const { stkCallback } = Body;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    if (resultCode === 0 || resultCode === '0') {
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const phoneItem = metadata.find(item => item.Name === 'PhoneNumber');
      const phoneNumber = phoneItem?.Value?.toString();

      let user = await User.findOne({ lastCheckoutRequestID: checkoutRequestID });
      const proData = { isPro: true, proSubscriptionDate: new Date(), lastPaymentStatus: 'Success', lastCheckoutRequestID: null };

      if (!user && phoneNumber) {
        await User.findOneAndUpdate({ mpesaPhoneNumber: { $regex: phoneNumber.slice(-9) } }, proData);
      } else if (user) {
        await User.findByIdAndUpdate(user._id, proData);
      }
    } else {
      await User.findOneAndUpdate({ lastCheckoutRequestID: checkoutRequestID }, { lastPaymentStatus: 'Failed' });
    }
    return res.status(200).json({ "ResponseCode": "00000000", "ResponseDesc": "success" });
  } catch (error) {
    return res.status(200).json({ ResultCode: 1, ResultDesc: "Internal Error" });
  }
};

// @desc      Check status (Enhanced)
exports.checkPaymentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // If they just got upgraded (maybe via callback), return success
    if (user.isPro) {
      return res.status(200).json({ success: true, isPro: true, paymentStatus: 'Success' });
    }

    const now = new Date();
    const fifteenSecondsAgo = new Date(now.getTime() - 15000);

    // ONLY query Safaricom if we are actually PENDING and haven't checked too recently
    if (user.lastCheckoutRequestID && user.lastCheckoutRequestID !== 'initiating...' && 
        user.lastPaymentStatus === 'Pending' &&
        (!user.lastPaymentCheck || user.lastPaymentCheck < fifteenSecondsAgo)) {
      
      try {
        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const tokenResponse = await safaricomRequest({
          method: 'get',
          url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
          headers: { ...safaricomHeaders, Authorization: `Basic ${auth}` },
          timeout: 10000
        });

        const accessToken = tokenResponse.data.access_token;
        const shortcode = process.env.MPESA_SHORTCODE || '174379';
        const passkey = process.env.MPESA_PASSKEY;
        const timestamp = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0') + now.getSeconds().toString().padStart(2, '0');
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const queryResponse = await safaricomRequest({
          method: 'post',
          url: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
          data: { BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: user.lastCheckoutRequestID },
          headers: { ...safaricomHeaders, Authorization: `Bearer ${accessToken}` },
          timeout: 15000
        });

        let updateData = { lastPaymentCheck: now };
        if (queryResponse.data.ResultCode === '0' || queryResponse.data.ResultCode === 0) {
          updateData.isPro = true;
          updateData.proSubscriptionDate = new Date();
          updateData.lastPaymentStatus = 'Success';
          updateData.lastCheckoutRequestID = null;
        } else if (queryResponse.data.ResultCode === '1032' || queryResponse.data.ResultCode === 1032) {
          updateData.lastPaymentStatus = 'Cancelled';
        } else if (queryResponse.data.ResultCode) {
          updateData.lastPaymentStatus = 'Failed';
        }
        
        const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
        return res.status(200).json({ success: true, isPro: updatedUser.isPro, paymentStatus: updatedUser.lastPaymentStatus });

      } catch (queryErr) {
        console.warn('Status Query Fail:', queryErr.message);
        await User.findByIdAndUpdate(req.user.id, { lastPaymentCheck: now });
      }
    }

    res.status(200).json({ success: true, isPro: user.isPro, paymentStatus: user.lastPaymentStatus || 'Pending' });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
