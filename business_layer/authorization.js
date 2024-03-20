const persistence = require("../persistence.js")

//Fetch user's account from the database by matching the username parameter and return the user's role 
async function getUserRole(username){
    let userAccount = await persistence.findUserAccount(username)
    return userAccount.userDetails.role
}

module.exports = {
    getUserRole
}