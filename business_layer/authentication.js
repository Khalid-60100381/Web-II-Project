// Import required modules
const persistence = require("../persistence.js")
const crypto = require("crypto")

/**
 * Authenticates a user's login by comparing the hashed password with the stored hash.
 * @param {string} usernameInput - The username input by the user.
 * @param {string} passwordInput - The password input by the user.
 * @returns {boolean|undefined} - True if authentication is successful, false if authentication fails, undefined if user not found.
 */
async function authenticateLogin(usernameInput, passwordInput){
    let userAccount = await persistence.findUserAccount(usernameInput)

    if (!userAccount){
        return undefined
    }

    const storedPassword = userAccount.userDetails.password
    const separatorIndex = storedPassword.indexOf(':')
    const storedSalt = storedPassword.substring(0,separatorIndex)
    const storedHashedPassword = storedPassword.substring(separatorIndex + 1)
   
    const hashedInputPassword = crypto.createHash('sha512').update(storedSalt + passwordInput).digest('hex')

    if (hashedInputPassword === storedHashedPassword){
        return true
    }else{
        return false
    }
}

module.exports = {
    authenticateLogin
}
