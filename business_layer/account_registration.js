//Import required module
const persistence = require("../persistence.js");

/**
 * Hashes and salts the password provided in the user details object.
 * 
 * @param {object} userDetails - Object containing user details including password.
 * @param {string} userDetails.password - User's password to be hashed and salted.
 * @returns {Promise<void>} - Promise resolving once password is hashed and salted.
 */
async function hashAndSaltPassword(userDetails) {
    // Generate a unique salt per user password
    let salt = crypto.randomBytes(16).toString('hex');

    // Concatenate the generated salt + user password, and hash the combined string using SHA-512
    let hashedSaltAndPassword = crypto.createHash('sha512')
        .update(salt + userDetails.password)
        .digest('hex');

    // Append salt and hashed salt + password as a single string pair separated by a colon delimiter
    let saltAndHashedStringPair = salt + ':' + hashedSaltAndPassword;

    // Replace user's password with the salt:hashedSaltAndPassword string pair
    userDetails.password = saltAndHashedStringPair;
}

/**
 * Hashes the concatenated salt + user password, then stores the newly formed hashed password as the user's password in the database.
 * 
 * @param {object} userDetails - Object containing user details including password.
 * @param {string} userDetails.password - User's password to be hashed and salted.
 * @returns {Promise<any>} - Promise resolving with the result of registering the account.
 */
async function registerAccount(userDetails) {
    await hashAndSaltPassword(userDetails);
    return await persistence.registerAccount(userDetails);
}

module.exports = {
    registerAccount
};
