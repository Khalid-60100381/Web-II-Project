const persistence = require("../persistence.js")
const crypto = require('crypto')


/**
 * Resets the password for a user with the provided email address.
 * 
 * @param {string} email - The email address of the user.
 * @returns {Promise<void | undefined>} - Returns undefined if user details are not found, otherwise logs the password reset link.
 */
async function resetPassword(email) {
    let details = await persistence.getUserDetailsByEmail(email)

    if (!details) {
        return undefined
    }

    let key = crypto.randomUUID() //generate key
    details.resetKey = key //add key to user in database
    await persistence.updateUserDetails(details.userDetails.email, details) //update the database
    console.log(`http://127.0.0.1:8000/reset-password/?key=${key}`) //send the link with key to user (in console)
}


/**
 * Checks whether the provided reset key is valid.
 * 
 * @param {string} resetKey - The reset key to check.
 * @returns {Promise<boolean>} - Returns true if the key is valid, otherwise false.
 */
async function checkResetKey(resetKey) {
    return persistence.checkResetKey(resetKey)
}


/**
 * Sets a new password for the user using the provided reset key and new password.
 * 
 * @param {string} resetKey - The reset key for the password reset operation.
 * @param {string} newPassword - The new password to be set.
 * @returns {Promise<void>}
 */
async function setNewPassword(resetKey, newPassword) {
    // Generate a random 16-byte salt
    let salt = crypto.randomBytes(16).toString('hex')

    // Concatenate the generated salt + user password, and hash the combined string using SHA-512
    let hashedSaltAndPassword = crypto.createHash('sha512')
        .update(salt + newPassword)
        .digest('hex')

    // Append salt and hashed salt + password as a single string pair separated by a colon delimiter
    let saltAndHashedStringPair = salt + ':' + hashedSaltAndPassword

    await persistence.updateUserPassword(resetKey, saltAndHashedStringPair)
}

module.exports = {
resetPassword, checkResetKey, setNewPassword
}