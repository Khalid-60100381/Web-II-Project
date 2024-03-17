const persistence = require("../persistence.js")
const crypto = require("crypto")

async function authenticateLoing(usernameInput, passwordInput){
    await persistence.connectDatabase()

    const user = await users.findOne({"userDetails.username": usernameInput})
    if (!user){
        return false
    }
    const storedPassword = user.userDetails.password
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
    authenticateLoing
}
