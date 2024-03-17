const persistence = require("../persistence.js")
const crypto = require("crypto")

/**
 * Checks if the user exists in the database,
 * if user exists it splits and stores the salt:hashedpassword from the database
 * hashes the user inputed password with the salt and compaers to that existing in the database. 
 * @param {string} usernameInput The username inputed by user
 * @param {string} passwordInput The password inputed by user
 * @returns {undefined} if user was not found
 * @returns {false} if the hashes do not match
 * @returns {true} if the hashes do match
*/

async function authenticateLogin(usernameInput, passwordInput){
    //Checks if the username inputed is in the database
    let userAccount = await persistence.findUserAccount(usernameInput)

    if (!userAccount){
        return undefined
    }

    //Storing the password from the db and spillting the salt
    const storedPassword = userAccount.userDetails.password
    const separatorIndex = storedPassword.indexOf(':')
    const storedSalt = storedPassword.substring(0,separatorIndex)
    const storedHashedPassword = storedPassword.substring(separatorIndex + 1)
   
    //hasing the input password with salt
    const hashedInputPassword = crypto.createHash('sha512').update(storedSalt + passwordInput).digest('hex')

    //Comparing the existing hash to the one just created
    if (hashedInputPassword === storedHashedPassword){
        return true 
    }else{
        return false
    }
}
module.exports = {
    authenticateLogin
}