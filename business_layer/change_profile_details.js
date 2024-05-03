// Import required modules
const persistence = require("../persistence.js")
const crypto = require("crypto")


/**
 * Retrieves the user account based on the provided username.
 *
 * @param {string} username - The username of the user account to retrieve.
 * @returns {Promise<Object>} - A promise that resolves to the user account object, or null if the account is not found.
 */
async function findUserAccount(username){
    return await persistence.findUserAccount(username)
}

/**
 * Updates the modifiedUserDetails object with existing values if the properties are empty.
 *
 * @param {Object} modifiedUserDetails - The user details to modify.
 * @param {string} username - The username of the user account to retrieve existing details from.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function fillInExistingValues(modifiedUserDetails, username) {
    let userAccount = await persistence.findUserAccount(username)

    for (let key in modifiedUserDetails) {
        if (key === "password") {
            // Check if the password property is empty
            if (modifiedUserDetails[key] !== "") {
                continue
            }
        }
        // Check if the property value is an empty string
        if (modifiedUserDetails[key] === "") {
            // Replace the property value with the corresponding value from userAccount
            modifiedUserDetails[key] = userAccount.userDetails[key]
        }
    }
}


/**
 * Updates the user account details based on the provided account ID.
 *
 * @param {Object} modifiedUserDetails - The modified user details to update.
 * @param {string} previousAccountID - The account ID of the user to update.
 * @returns {Promise<Object>} - A promise that resolves to the updated user account details.
 */
async function updateUserDetailsByID(modifiedUserDetails, previousAccountID) {
    // Check if the password property is empty
    if (!modifiedUserDetails.password) {
        // Generate a unique salt per user password
        let salt = crypto.randomBytes(16).toString('hex')
        
        // Concatenate the generated salt + user password, and hash the combined string using SHA-512
        let hashedSaltAndPassword = crypto.createHash('sha512')
            .update(salt + modifiedUserDetails.password)
            .digest('hex')
        
        // Append salt and hashed salt + password as a single string pair separated by a colon delimiter
        let saltAndHashedStringPair = salt + ':' + hashedSaltAndPassword
        
        // Replace user's password with the salt:hashedSaltAndPassword string pair
        modifiedUserDetails.password = saltAndHashedStringPair

        // Update the user account details with the modified user details
        return await persistence.updateUserDetailsByID(modifiedUserDetails, previousAccountID)
    }

    let storedHashedPassword = modifiedUserDetails.password.substring(33)

    if (!storedHashedPassword) {
        // Generate a unique salt per user password
        let salt = crypto.randomBytes(16).toString('hex')
        
        // Concatenate the generated salt + user password, and hash the combined string using SHA-512
        let hashedSaltAndPassword = crypto.createHash('sha512')
            .update(salt + modifiedUserDetails.password)
            .digest('hex')
        
        // Append salt and hashed salt + password as a single string pair separated by a colon delimiter
        let saltAndHashedStringPair = salt + ':' + hashedSaltAndPassword
        
        // Replace user's password with the salt:hashedSaltAndPassword string pair
        modifiedUserDetails.password = saltAndHashedStringPair

        // Update the user account details with the modified user details
        return await persistence.updateUserDetailsByID(modifiedUserDetails, previousAccountID)
    }

    // Update the user account details with the modified user details
    return await persistence.updateUserDetailsByID(modifiedUserDetails, previousAccountID)
}


module.exports = {
    findUserAccount,
    fillInExistingValues,
    updateUserDetailsByID
}