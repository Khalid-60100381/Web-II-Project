//Import required modules
const persistence = require("../persistence.js")
const crypto = require("crypto")


/**
 * Starts a new session for the user.
 * @param {object} sessionData - Data to be stored in the user's session.
 * @returns {object} - The user's session object.
 */
async function startSession(sessionData){
    //Generate a random sessionID
    let sessionID = crypto.randomUUID()
    //While extremely improbable, check if a duplicate session ID already exists in the database
    let duplicateSessionID = await persistence.checkDuplicateSessionID(sessionID)

    //If somehow a duplicate sessionID exists, then generate a new one
    if (duplicateSessionID){
        sessionID = crypto.randomUUID()
    }

    //Create user session object containing the sessionID, expiry (session valid for 10 minutes), and any relevant 
    // session data to track user's requests and state
    let userSession = {
        sessionID: sessionID,
        sessionData: sessionData,
        sessionExpiry: new Date(Date.now() + 1000*60*20)
    }

    //Store user's session data in the database, and return the session data to the web layer to set browser cookie
    await persistence.startSession(userSession)
    return userSession
}

/**
 * Retrieves the user's current session from the database.
 * @param {string} sessionID - The ID of the user's session.
 * @returns {object} - The user's session object.
 */
async function getSession(sessionID){
    return await persistence.getSession(sessionID)
}

/**
 * Updates the user's current session in the database with new session data.
 * @param {string} sessionID - The ID of the user's session.
 * @param {object} userSession - The updated session data.
 */
async function updateSession(sessionID, userSession){
    return await persistence.updateSession(sessionID, userSession)
}

/**
 * Deletes the user's current session from the database.
 * @param {string} sessionID - The ID of the user's session.
 */
async function deleteSession(sessionID){
    await persistence.deleteSession(sessionID)
}

module.exports = {
    startSession,
    getSession,
    updateSession,
    deleteSession
}