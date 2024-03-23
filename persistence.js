const mongodb = require('mongodb')

// Initialize database client connection, database option, users, and session collections as global variables to 
// connect to the database only once and reuse that same connection across multiple functions
let client = undefined
let db = undefined
let users = undefined
let sessions = undefined
let locations = undefined

/**
 * Establishes a connection to the MongoDB database and assigns collections to global variables if not already established.
 */
async function connectDatabase() {
    // If a client connection does not exist, create one and connect to and store the database collections in variables
    if (!client) {
        client = new mongodb.MongoClient("mongodb+srv://almabroukbenomran:60104920@cluster0.2nmiwkr.mongodb.net/")
        await client.connect()
        db = client.db('web2Project')
        users = db.collection('users')
        sessions = db.collection('sessions')
        locations = db.collection('location_list')
    }
}

/**
 * Checks if a username already exists in the users collection.
 * @param {string} usernameInput - The username to check for existence.
 * @returns {boolean} - True if the username exists, false otherwise.
 */
async function checkUsernameExists(usernameInput){
    await connectDatabase()
    let userDetails = await users.findOne({"userDetails.username":usernameInput})
    
    // Check if an existing user already has an identical username in the database
    if (userDetails === null){
        return false
    }
    return true
}

/**
 * Checks if an email already exists in the users collection.
 * @param {string} emailInput - The email to check for existence.
 * @returns {boolean} - True if the email exists, false otherwise.
 */
async function checkEmailExists(emailInput){
    await connectDatabase()
    let userDetails = await users.findOne({"userDetails.email":emailInput})

    // Check if an existing user already has an identical email in the database
    if (userDetails === null){
        return false
    }
    return true
}

/**
 * Registers a new user account in the users collection.
 * @param {object} userDetails - The details of the user to register.
 * @returns {boolean} - True if the registration is successful, false otherwise.
 */
async function registerAccount(userDetails){
    await connectDatabase()
    let result = await users.insertOne({userDetails})
    
    // Check if the newly created user account has been successfully added to the database
    if (result.acknowledged){
        return true
    }

    return false
}

/**
 * Checks if a session ID already exists in the sessions collection.
 * @param {string} sessionID - The session ID to check for existence.
 * @returns {boolean} - True if the session ID exists, false otherwise.
 */
async function checkDuplicateSessionID(sessionID){
    await connectDatabase()
    let sessionDetails = await sessions.findOne({"userSession.sessionID":sessionID})

    // Check if an identical session ID exists in the database
    if (sessionDetails === null){
        return false
    }
    return true
}

/**
 * Starts a new session by storing it in the sessions collection.
 * @param {object} userSession - The session details to store.
 */
async function startSession(userSession){
    await connectDatabase()
    // Store the current user session in the database
    await sessions.insertOne(userSession)
}

/**
 * Retrieves a session from the sessions collection based on its session ID.
 * @param {string} sessionID - The session ID to retrieve.
 * @returns {object|null} - The session object if found, otherwise null.
 */
async function getSession(sessionID){
    await connectDatabase()
    // Search for the user's current session in the database and return it
    return await sessions.findOne({sessionID:sessionID})
}

/**
 * Updates a session in the sessions collection with new session data.
 * @param {string} sessionID - The session ID of the session to update.
 * @param {object} userSession - The updated session data.
 */
async function updateSession(sessionID, userSession){
    await connectDatabase()
    await sessions.replaceOne({sessionID:sessionID}, userSession)
}

/**
 * Deletes a session from the sessions collection based on its session ID.
 * @param {string} sessionID - The session ID to delete.
 */
async function deleteSession(sessionID){
    await connectDatabase()
    await sessions.deleteOne({sessionID:sessionID})
}

/**
 * Finds a user account in the users collection based on the username.
 * @param {string} usernameInput - The username to search for.
 * @returns {object|boolean} - The user account object if found, otherwise false.
 */
async function findUserAccount(usernameInput){
    await connectDatabase()
    let userAccount = await users.findOne({"userDetails.username":usernameInput})

    if (userAccount === null){
        return false
    }

    return userAccount
}

/**
 * Retrieves locations from the locations collection.
 * @returns {Array} - An array of locations.
 */
async function getlocations(){
    await connectDatabase()
    const cursor = await locations.find() // Pointer to the object list 
    const fixed_locations = await cursor.toArray(); // Turning the object list into an array to loop through in handlebar
    return fixed_locations
}

// Export functions for use by other modules
module.exports = {
    checkUsernameExists,
    checkEmailExists,
    registerAccount,
    checkDuplicateSessionID,
    startSession,
    getSession,
    updateSession,
    findUserAccount,
    deleteSession,
    getlocations
}
