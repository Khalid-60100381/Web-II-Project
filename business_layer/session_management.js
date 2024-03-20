const persistence = require("../persistence.js")
const crypto = require("crypto")

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
        sessionExpiry: new Date(Date.now() + 1000*60*10)
    }

    //Store user's session data in the database, and return the session data to the web layer to set browser cookie
    await persistence.startSession(userSession)
    return userSession
}

//Retrieve the user's current session from the database
async function getSession(sessionID){
    return await persistence.getSession(sessionID)
}

//Update the user's current session in the database with the new session data
async function updateSession(sessionID, userSession){
    return await persistence.updateSession(sessionID, userSession)
}

//Delete the user's current session from the database
async function deleteSession(sessionID){
    await persistence.deleteSession(sessionID)
}

module.exports = {
    startSession,
    getSession,
    updateSession,
    deleteSession
}