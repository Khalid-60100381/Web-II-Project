// Import required modules
const session_management = require("./session_management.js")

/**
 * Sets a flash message for the user's session.
 * @param {string} sessionID - The ID of the user's session.
 * @param {string} flashMessage - The message to be set as a flash message.
 */
async function setFlash(sessionID, flashMessage){
    let userSession = await session_management.getSession(sessionID)
    userSession.flashMessage = flashMessage
    await session_management.updateSession(sessionID, userSession)
}

/**
 * Retrieves and removes the flash message from the user's session.
 * @param {string} sessionID - The ID of the user's session.
 * @returns {string|undefined} - The flash message if found, undefined otherwise.
 */
async function getFlash(sessionID){
    let userSession = await session_management.getSession(sessionID)

    // Check if the user has an active session
    if (!userSession){
        return undefined
    }

    let flashMessage = userSession.flashMessage
    delete userSession.flashMessage

    await session_management.updateSession(sessionID, userSession)
    return flashMessage
}

module.exports = {
    setFlash,
    getFlash
}