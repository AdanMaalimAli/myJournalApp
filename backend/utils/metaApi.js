const MetaApi = require('metaapi.cloud-sdk').default;

const token = process.env.META_API_TOKEN;

if (!token) {
    console.error('META_API_TOKEN is missing from .env');
}

const api = new MetaApi(token);

/**
 * Connect to a MetaTrader account via MetaAPI
 * @param {string} accountId - The MetaAPI account ID
 * @returns {Promise<object>} - The RPC connection object
 */
const getRpcConnection = async (accountId) => {
    try {
        const account = await api.metatraderAccountApi.getAccount(accountId);
        
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
 * @returns {Promise<Array>} - List of trades
 */
const getTradeHistory = async (accountId, startTime, endTime) => {
    const connection = await getRpcConnection(accountId);
    try {
        const history = await connection.getHistoryOrdersByTimeRange(startTime, endTime);
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
    const { name, login, password, server, platform } = accountDetails;
    try {
        const account = await api.metatraderAccountApi.createAccount({
            name,
            type: 'cloud',
            login,
            password,
            server,
            platform, // 'mt4' or 'mt5'
            application: 'MetaApi',
            magic: 0
        });
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
