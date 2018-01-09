# steamstore

A module for interacting with the Steam store site from node.js. Currently not a lot of functionality is supported.

## Logging In

This module cannot facilitate logins to the store site directly. You'll need to use something like
[`steam-user`](https://www.npmjs.com/package/steam-user) or
[`steamcommunity`](https://www.npmjs.com/package/steamcommunity) to login, and then use
[`setCookies`](#setcookiescookies) to set your login cookies in this module.

The cookies are the same for the store site and for the community site.

# Properties

### steamID
**v1.1.0 or later is required to use this property**

A [`SteamID`](https://www.npmjs.com/package/steamid) object for the currently logged-in user.

# Methods

### Constructor([options])
- `options` - An optional object containing zero or more of these properties:
    - `timeout` - The timeout to use for HTTP(S) requests, in milliseconds; default is 50000 (50 seconds)
    - `userAgent` - The user-agent header value; default is Chrome 56
    - `request` - A [`request`](https://www.npmjs.com/package/request) instance
        - This allows you to specify your own defaults on the request instance
        - These options will always be overridden on the request instance: `jar`, `timeout`, `gzip`, `headers['User-Agent']`

Constructs a new instance of `steamstore`. Example:

```js
const SteamStore = require('steamstore');
let store = new SteamStore();
```

or

```js
const SteamStore = require('steamstore');
let store = new SteamStore({"timeout": 30000});
```

### setCookie(cookie)
- `cookie` - The cookie, in "name=value" string format

Sets a single cookie to `steamstore`'s internal cookie jar.

### setCookies(cookies)
- `cookies` - An array of cookies, in "name=value" string format

Simply calls [`setCookie`](#setcookiecookie) for each cookie in the array.

### getSessionID()

Returns the value of the `sessionid` cookie, or creates a new random one and adds it to the cookie jar if not present.

### addPhoneNumber(number[, bypassConfirmation], callback)
- `number` - Your phone number, with a leading plus and the country code
    - Example: `+18885550123`
- `bypassConfirmation` - `true` if you want to ignore any confirmation-level errors (see below). Default `false`
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success. The `confirmation` property will be `true` if this is
    a confirmation-level error which can be overridden by setting `bypassConfirmation` to `true`

Adds a new phone number to your account. This triggers a verification SMS to be sent. You can provide the verification
code to [`verifyPhoneNumber`](#verifyphonenumbercode-callback) to finalize the process.

### resendVerificationSMS(callback)
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success

Asks the Steam servers to resend the verification SMS to your pending-confirmation phone number. This will fail if you
request it too soon after the last SMS was sent.

### verifyPhoneNumber(code, callback)
- `code` - Your SMS verification code
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success

Verify your pending-verification phone number using the SMS code.

### removePhoneNumber(callback)
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success

Starts the process to remove your phone number from your account. This will send an SMS verification code to your phone.
Call [`confirmRemovePhoneNumber`](#confirmremovephonenumbercode-callback) with the code to finalize the process.

### confirmRemovePhoneNumber(code, callback)
- `code` - Your SMS verification code
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success

Finalizes the process of removing your phone number from your account.

### hasPhone(callback)
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success
    - `hasPhone` - `true` if your account has a phone number linked, `false` if not
    - `lastDigits` - If you have a phone number, this is a string containing the last 4 digits of your number

**v1.3.0 or later is required to use this method**

Checks whether your account has a phone number linked or not.

### getAccountData(callback)
- `callback` - A function to be called when the request completes
    - `err` - An `Error` object on failure, or `null` on success
    - `ownedApps` - An array containing the AppID of each app which your account owns
    - `ownedPackages` - An array containing the PackageID of each package which your account owns
    - `wishlist` - An array containing the AppID of each app that's on your wishlist
    - `ignoredApps` - An array containing the AppID of each app which you've clicked "Not Interested" on
    - `tags` - An object containing the tags which are suggested for you. Keys are TagIDs, values are the tag names.

**v1.1.0 or later is required to use this method**

Gets information about products that your account owns, ignores, wants, or is recommended.

### sendGift(giftID, recipient, recipientName, message, closing, signature[, callback])
- `giftID` - The gift's ID (also known as the asset ID of the item in your Steam gift inventory)
- `recipient` - Either the recipient's email address (to send it over email) or the recipient's SteamID (as a `SteamID` object or string) to send it over Steam. If using a SteamID, you need to be friends with the user.
- `recipientName` - The name of the recipient to put in the gift email/popup
- `message` - The message to include in the email/popup
- `closing` - The closing to include in the email/popup
- `signature` - Your name to include in the email/popup
- `callback` - Optional. Called when the request completes.
    - `err` - An `Error` object on failure, or `null` on success

**v1.4.0 or later is required to use this method**

Sends a Steam gift in your inventory to another user. The gift will remain in your inventory until the recipient accepts it.
You can re-send a gift which you've already sent. Gifts don't have to be tradable in order to be sent.

### createWallet(walletCode, billingAddress, callback)
- `walletCode` - A Steam wallet code you want to redeem
- `billingAddress` - An object containing these properties:
    - `address` - Your street address
    - `city` - Your city
    - `country` - Your country code, e.g. "US"
    - `state` - Your state, e.g. "FL"
    - `postalCode` - Your postal/ZIP code
- `callback` - Required. Called when the requested data is available.
   - `err` - An `Error` object if the request fails, or `null` otherwise
   - `eresult` - An `EResult` value from `SteamStore.EResult`
   - `detail` - A value from `SteamStore.EPurchaseResult`
   - `redeemable` - `true` if this code can be redeemed, `false` if not
   - `amount` - If redeemable, this is how much the code is worth, in its currency's lowest denomination (e.g. USD cents)
   - `currencycode` - If redeemable, this is the currency of `amount`
   
**v1.7.0 or later is required to use this method**

Before you can redeem a Steam Wallet code, your account needs to have a wallet. If you don't yet have a wallet you can
use this method to create one. Creating a wallet requires you to provide a wallet code, but the code won't be redeemed
until you actually call `redeemWalletCode`.

### checkWalletCode(walletCode, callback)
- `walletCode` - The Steam wallet code you want to check
- `callback` - Required. Called when the requested data is available.
    - `err` - An `Error` object if the request fails, or `null` otherwise
    - `eresult` - An `EResult` value from `SteamStore.EResult`
    - `detail` - A value from `SteamStore.EPurchaseResult`
    - `redeemable` - `true` if this code can be redeemed, `false` if not
    - `amount` - If redeemable, this is how much the code is worth, in its currency's lowest denomination (e.g. USD cents)
    - `currencycode` - If redeemable, this is the currency of `amount`

**v1.5.0 or later is required to use this method**

Check to make sure a Steam wallet code is valid, and if it is valid, figure out how much it's worth.

### redeemWalletCode(walletCode[, callback])
- `walletCode` - The Steam wallet code you want to redeem
- `callback` - Optional. Called when the request completes.
    - `err` - An `Error` object if the request fails, or `null` on success
    - `eresult` - An `EResult` value from `SteamStore.EResult`
    - `detail` - A value from `SteamStore.EPurchaseResult`
    - `formattedNewWalletBalance` - If redeemed successfully, this is your new wallet balance as a string, formatted for human display (e.g. `$20.00`)   
    - `amount` - If redeemable, this is how much the code is worth, in its currency's lowest denomination (e.g. USD cents)


**v1.5.0 or later is required to use this method**

Attempts to redeem a Steam Wallet code on your account. This will call `checkWalletCode` first, and if the code is not
redeemable, the callback will be invoked with an `Error` passed as the first parameter. That `Error` will have message
`Wallet code is not valid`, with `eresult` and `purchaseresultdetail` properties defined on that `Error` object.

### setDisplayLanguages(primary[, secondary][, callback])
- `primary` - Your desired primary (display) language, as a string (e.g. `english` or `danish`)
- `secondary` - Your desired secondary languages, as an array of strings of the same format as `primary`
- `callback` - Optional. Called when the request completes.
    - `err` - An `Error` object on failure, or `null` on success

**v1.5.0 or later is required to use this method**

Updates your account's display languages for the Steam store.
