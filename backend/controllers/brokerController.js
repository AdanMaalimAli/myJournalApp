const User = require('../models/User');
const Trade = require('../models/Trade');
const metaApi = require('../utils/metaApi');

// @desc      Connect broker account
// @route     POST /api/broker/connect
// @access    Private
exports.connectBroker = async (req, res) => {
  const { platform, accountNumber, brokerServer, apiKey } = req.body;

  try {
    // 1. Provision account in MetaAPI
    const provisionedAccount = await metaApi.provisionAccount({
        name: `User-${req.user.id}`,
        login: accountNumber,
        password: apiKey, // Using apiKey field as MT4/MT5 password
        server: brokerServer,
        platform: platform.toLowerCase() // 'mt4' or 'mt5'
    });

    // 2. Save MetaAPI account ID and details to user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        brokerAccount: {
          platform,
          accountNumber,
          brokerServer,
          apiKey,
          metaApiAccountId: provisionedAccount.id,
          connectionStatus: 'Pending',
          lastSync: new Date()
        }
      },
      { new: true }
    );

    // 3. Deploy the account (starts the connection)
    const account = await metaApi.api.metatraderAccountApi.getAccount(provisionedAccount.id);
    await account.deploy();

    res.status(200).json({
      success: true,
      data: user.brokerAccount
    });

  } catch (error) {
    console.error('MetaAPI Connection Error:', error);
    
    let errorMessage = error.message;
    if (error.status === 403) {
        errorMessage = 'MetaAPI account limit reached or top-up required. Please check your MetaAPI dashboard.';
    } else if (error.message.includes('not found')) {
        errorMessage = 'Broker server not found. Please check the server name.';
    }

    res.status(error.status || 400).json({ success: false, error: errorMessage });
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

    if (!user.brokerAccount.metaApiAccountId) {
        return res.status(400).json({ success: false, error: 'Broker not connected' });
    }

    // Connect and fetch history (e.g., last 30 days)
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);
    const endTime = new Date();

    const connection = await metaApi.getRpcConnection(user.brokerAccount.metaApiAccountId);
    
    // Using getHistoryDealsByTimeRange for actual closed trades/profits
    const deals = await connection.getHistoryDealsByTimeRange(startTime, endTime);
    
    // Filter and map to our Trade model
    // Note: This is a simplified mapping. Real deal history can be complex (entries vs exits)
    const tradesToSave = deals.filter(deal => deal.entryType === 'DEAL_ENTRY_OUT').map(deal => ({
        user: req.user.id,
        ticket: deal.id,
        date: new Date(deal.time).toISOString().split('T')[0],
        pair: deal.symbol,
        type: deal.type.includes('BUY') ? 'Buy' : 'Sell',
        pnl: deal.profit + (deal.commission || 0) + (deal.swap || 0),
        lots: deal.volume,
        entry: deal.price, // For 'OUT' deal, this is actually the exit price, but simple sync for now
        commission: deal.commission,
    }));

    // Simple bulk upsert (avoid duplicates by ticket)
    for (const tradeData of tradesToSave) {
        await Trade.findOneAndUpdate(
            { user: req.user.id, ticket: tradeData.ticket },
            tradeData,
            { upsert: true, new: true }
        );
    }

    // Update connection status and last sync
    user.brokerAccount.connectionStatus = 'Connected';
    user.brokerAccount.lastSync = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Successfully synced ${tradesToSave.length} trades.`,
      count: tradesToSave.length
    });

  } catch (error) {
    console.error('MetaAPI Sync Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
