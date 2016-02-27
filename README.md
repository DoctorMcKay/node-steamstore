# steamstore

A module for interacting with the Steam store site from node.js. Currently it only manages adding and removing phone
numbers.

## Logging In

This module cannot facilitate logins to the store site directly. You'll need to use something like
[`node-steam-user`](https://www.npmjs.com/package/steam-user) or
[`node-steamcommunity`](https://www.npmjs.com/package/steamcommunity) to login, and then use
[`setCookies`](#setcookiescookies) to set your login cookies in this module.

The cookies are the same for the store site and for the community site.

# Properties

### steamID
**v1.1.0 or later is required to use this property**

A [`SteamID`](https://www.npmjs.com/package/steamid) object for the currently logged-in user.

# Methods

### Constructor()

Constructs a new instance of `steamstore`. Example:

```js
var SteamStore = require('steamstore');
var store = new SteamStore();
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
