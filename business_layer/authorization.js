// Import required module
const persistence = require("../persistence.js")

/**
 * Retrieves the role of a user from the database based on the username.
 * @param {string} username - The username of the user.
 * @returns {string} - The role of the user.
 */
async function getUserRole(username){
    let userAccount = await persistence.findUserAccount(username)
    return userAccount.userDetails.role
}

module.exports = {
    getUserRole
}
