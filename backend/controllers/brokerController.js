const User = require('../models/User');

// @desc      Connect broker account
// @route     POST /api/broker/connect
// @access    Private
exports.connectBroker = async (req, res) => {
  const { platform, accountNumber, brokerServer, apiKey } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        brokerAccount: {
          platform,
          accountNumber,
          brokerServer,
          apiKey,
          connectionStatus: 'Pending',
          lastSync: new Date()
        }
      },
      { new: true }
    );

    // Placeholder: This is where you would call MetaAPI or your broker bridge
    // For now, we simulate success
    setTimeout(async () => {
        await User.findByIdAndUpdate(req.user.id, { 'brokerAccount.connectionStatus': 'Connected' });
    }, 5000);

    res.status(200).json({
      success: true,
      data: user.brokerAccount
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc      Sync trades from broker
// @route     POST /api/broker/sync
// @access    Private
exports.syncBrokerTrades = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.isPro) {
        return res.status(403).json({ success: false, error: 'Upgrade to Pro for automated sync' });
    }

    if (user.brokerAccount.connectionStatus !== 'Connected') {
        return res.status(400).json({ success: false, error: 'Broker not connected' });
    }

    // Placeholder: Logic to fetch trades from MetaAPI/Broker
    // Then call bulkCreateTrades logic internally or return them to frontend
    
    res.status(200).json({
      success: true,
      message: 'Sync initiated. Your dashboard will update shortly.'
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
