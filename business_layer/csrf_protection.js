// Import required modules
const session_management = require("./session_management.js")
const crypto = require("crypto")

/**
 * Generates a random CSRF token, attaches it to the user's session, and returns the token.
 * @param {string} sessionID - The ID of the user's session.
 * @returns {string} - The generated CSRF token.
 */
async function generateCSRFFormToken(sessionID){
    let csrfToken = crypto.randomUUID()
    let userSession = await session_management.getSession(sessionID)
    userSession.sessionData.csrfToken = csrfToken
    await session_management.updateSession(sessionID, userSession)
    return csrfToken
}

/**
 * Deletes the CSRF token from the user's session.
 * @param {string} sessionID - The ID of the user's session.
 */
async function cancelToken(sessionID){
    let userSession = await session_management.getSession(sessionID)
    delete userSession.sessionData.csrfToken
    await session_management.updateSession(sessionID, userSession)
}

async function compareToken(csrfToken,sessionID){
    let userSession = await session_management.getSession(sessionID)
    sessionToken = userSession.sessionData.csrfToken
    if (sessionToken !== csrfToken){
        return false
    }
    return true
}


module.exports = {
    generateCSRFFormToken,
    cancelToken,
    compareToken
}