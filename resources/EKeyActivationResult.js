/**
 * @enum EKeyActivationResult
 */
module.exports = {
    "Success": 0, // Key redeemed successfully
    "UnexpectedError": 4, // Unexpected Error
    "AlreadyInAccount": 9, // Account already has the product
    "CountryRestriction": 13, // Product key not available in country
    "InvalidProductKey": 14, // Invalid product key
    "UsedProductKey": 15, // Product key already used
    "GameRequired": 24, // Activating the product key requires another product in account
    "PlayOnPS3": 36, // Game can only activated when played on PS3
    "AccountBalanceKey": 50, // Key is a balance card
    "TooManyActivations": 53, // Too many activations from account or IP

    // Value-to-name mapping for convenience
    "0": "Success",
    "4": "UnexpectedError",
    "9": "AlreadyInAccount",
    "13": "CountryRestriction",
    "14": "InvalidProductKey",
    "15": "UsedProductKey",
    "24": "GameRequired",
    "36": "PlayOnPS3",
    "50": "AccountBalanceKey",
    "53": "TooManyActivations",
};
