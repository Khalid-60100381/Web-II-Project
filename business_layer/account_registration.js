const persistence = require("../persistence.js")
const crypto = require("crypto")

async function hashAndSaltPassword(userDetails){
    // Generate a unique salt per user password
    let salt = crypto.randomBytes(16).toString('hex')

    // Concatenate the generated salt + user password, and hash the combined string using SHA-512
    let hashedSaltAndPassword = crypto.createHash('sha512')
                                .update(salt+userDetails.password)
                                .digest('hex')

    // Append salt and hashed salt + password as a single string pair separated by a colon delimeter
    let saltAndHashedStringPair = salt + ':' + hashedSaltAndPassword

    //Replace user's password with the salt:hashedSaltAndPassword string pair
    userDetails.password = saltAndHashedStringPair
}

//Hash the concatenated salt + user password, then store the newly formed hashed password as the user's password in the
// database
async function registerAccount(userDetails){
    await hashAndSaltPassword(userDetails)
    return await persistence.registerAccount(userDetails)

}

module.exports = {
    registerAccount
}

