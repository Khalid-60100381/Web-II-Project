const session_management = require("./session_management.js")

//Retrieve the user's current session, store the flash message as part of the user's current session, then update the
// user's session in the database
async function setFlash(sessionID, flashMessage){
    let userSession = await session_management.getSession(sessionID)
    userSession.flashMessage = flashMessage
    await session_management.updateSession(sessionID, userSession)
}

//Retrieve the user's current session, store the flash message in a variable, delete the flash message stored in the
// user's current session, then update the user's session in the database, and return the flash message variable to be 
// displayed to the user
async function getFlash(sessionID){
    let userSession = await session_management.getSession(sessionID)

    //Check if the user has a currently active session
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