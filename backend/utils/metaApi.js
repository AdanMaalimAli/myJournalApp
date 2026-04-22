const MetaApi = require('metaapi.cloud-sdk').default;

const token = process.env.META_API_TOKEN;

// FIX for MatchTrader DEPTH_ZERO_SELF_SIGNED_CERT error
// This is required because the AgiliumTrade MatchTrader provisioning endpoint 
// often uses a certificate that Node.js cannot verify (self-signed).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (!token) {
    console.error('META_API_TOKEN is missing from .env');
}

const api = new MetaApi(token);

/**
 * Helper to ensure the correct host is used for the platform
 * @param {string} platform - The platform name
 */
const ensureCorrectHost = (platform) => {
    const client = api.metatraderAccountApi._metatraderAccountClient;
    if (!client) return;

    const currentHost = client._host || '';
    const isMatchTrader = platform && platform.toLowerCase() === 'matchtrader';
    
    if (isMatchTrader && currentHost.includes('mt-provisioning-api-v1')) {
        client._host = currentHost.replace('mt-provisioning-api-v1', 'matchtrader-provisioning-api-v1');
        console.log(`Switched to MatchTrader host: ${client._host}`);
    } else if (!isMatchTrader && currentHost.includes('matchtrader-provisioning-api-v1')) {
        client._host = currentHost.replace('matchtrader-provisioning-api-v1', 'mt-provisioning-api-v1');
        console.log(`Switched to MetaTrader host: ${client._host}`);
    }
};

/**
 * Connect to a MetaTrader account via MetaAPI
 * @param {string} accountId - The MetaAPI account ID
 * @param {string} platform - The platform (optional, helps set correct host)
 * @returns {Promise<object>} - The RPC connection object
 */
const getRpcConnection = async (accountId, platform = 'mt5') => {
    try {
        ensureCorrectHost(platform);
        const account = await api.metatraderAccountApi.getAccount(accountId);
        
        // Update host if platform was different than assumed
        if (account.platform !== platform) {
            ensureCorrectHost(account.platform);
        }

        // Ensure account is deployed and connected
        if (account.state !== 'DEPLOYED') {
            await account.deploy();
        }
        await account.waitConnected();

        const connection = account.getRPCConnection();
        await connection.connect();
        await connection.waitSynchronized();

        return connection;
    } catch (error) {
        console.error(`MetaAPI connection error for account ${accountId}:`, error);
        throw error;
    }
};

/**
 * Fetch trade history for a MetaTrader account
 * @param {string} accountId - The MetaAPI account ID
 * @param {Date} startTime - Start time for history
 * @param {Date} endTime - End time for history
 * @param {string} platform - The platform
 * @returns {Promise<Array>} - List of trades
 */
const getTradeHistory = async (accountId, startTime, endTime, platform = 'mt5') => {
    try {
        const connection = await getRpcConnection(accountId, platform);
        let history;
        
        if (platform.toLowerCase() === 'mt5') {
            history = await connection.getHistoryDealsByTimeRange(startTime, endTime);
        } else {
            history = await connection.getHistoryOrdersByTimeRange(startTime, endTime);
        }
        
        return history;
    } catch (error) {
        console.error(`Error fetching trade history for account ${accountId}:`, error);
        throw error;
    }
};

/**
 * Provision (create) a new MetaTrader account in MetaAPI
 * @param {object} accountDetails - Details (name, login, password, server, platform)
 * @returns {Promise<object>} - The created account object
 */
const provisionAccount = async (accountDetails) => {
    let { name, login, password, server, platform } = accountDetails;
    
    // Determine the account type and platform string based on user input
    let type = 'cloud-g2'; // Recommended default for modern platforms
    let version = 5; // Default version

    if (platform === 'mt4') {
        type = 'cloud-g2';
        version = 4;
    } else if (platform === 'mt5') {
        type = 'cloud-g2';
        version = 5;
    } else if (platform === 'dxtrade') {
        type = 'dxtrade';
        platform = 'dxtrade';
    } else if (platform === 'matchtrader') {
        type = 'cloud-g2';
        platform = 'matchtrader';
    } else if (platform === 'ctrader') {
        type = 'ctrader';
        platform = 'ctrader';
    }

    const accountConfig = {
        name,
        type,
        login,
        password,
        server,
        platform,
        application: 'MetaApi',
        magic: 0
    };

    // MetaTrader accounts usually need the version field
    if (platform === 'mt4' || platform === 'mt5') {
        accountConfig.version = version;
    }

    // DXTrade often requires a quote currency
    if (platform === 'dxtrade') {
        accountConfig.quoteCurrency = 'USD';
    }

    try {
        ensureCorrectHost(platform);
        const account = await api.metatraderAccountApi.createAccount(accountConfig);
        return account;
    } catch (error) {
        console.error('Error provisioning MetaAPI account:', error);
        throw error;
    }
};

module.exports = {
    api,
    getRpcConnection,
    getTradeHistory,
    provisionAccount
};
