// Import required modules
const persistence = require("../persistence.js")
const crypto = require('crypto')

async function findUserAccount(username){
    return await persistence.findUserAccount(username)
}

// Function to update modifiedUserDetails with existing values if properties are empty
async function fillInExistingValues(modifiedUserDetails, userAccount) {
    for (let key in modifiedUserDetails) {
        // Check if the property value is an empty string
        if (modifiedUserDetails[key] === "") {
            // Replace the property value with the corresponding value from userAccount
            modifiedUserDetails[key] = userAccount[key]
        }
    }
}

async function updateUserDetailsByID(modifiedUserDetails, previousAccountID, username) {
    let userAccount = await persistence.findUserAccount(username)

    const separatorIndex = userAccount.userDetails.password.indexOf(':')
    const storedHashedPassword = userAccount.userDetails.password.substring(separatorIndex + 1)

    // Check if the password has been modified
    if (modifiedUserDetails.password !== storedHashedPassword) {
        // Generate a unique salt per user password
        let salt = crypto.randomBytes(16).toString('hex');

        // Concatenate the generated salt + user password, and hash the combined string using SHA-512
        let hashedSaltAndPassword = crypto.createHash('sha512')
        .update(salt + modifiedUserDetails.password)
        .digest('hex')

        // Append salt and hashed salt + password as a single string pair separated by a colon delimiter
        let saltAndHashedStringPair = salt + ':' + hashedSaltAndPassword

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