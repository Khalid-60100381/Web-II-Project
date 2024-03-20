const session_management = require("./session_management.js")
const crypto = require("crypto")

// Generate a random CSRF token, retrieve the user's session from the database and modify the user's session to include 
// the generated CSRF token as a property of the session data, then update the user's session in the database and return 
// the CSRF token
async function generateCSRFFormToken(sessionID){
    let csrfToken = crypto.randomUUID()
    let userSession = await session_management.getSession(sessionID)
    userSession.sessionData.csrfToken = csrfToken

    await session_management.updateSession(sessionID, userSession)
    return csrfToken
}

// Retrieve the user's session from the database, delete the CSRF token property from the session data, then update the 
// user's session in the database
async function cancelToken(sessionID){
    let userSession = await session_management.getSession(sessionID)
    delete userSession.sessionData.csrfToken
    await session_management.updateSession(sessionID, userSession)
}

module.exports = {
    generateCSRFFormToken,
    cancelToken
}