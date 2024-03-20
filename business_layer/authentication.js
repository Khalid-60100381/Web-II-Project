const persistence = require("../persistence.js")
const crypto = require("crypto")

// Search for a matching user account in the database based on the user's username input, if the user's account is found,
// then separate the salt from the hash of the combined salt and user password based on the colon delimeter, then
// concatenate the salt and the user's password input, hash them, and if the resulting hash matches the hash in the
// database, then the user-inputted credentials are correct and the user is authenticated
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
