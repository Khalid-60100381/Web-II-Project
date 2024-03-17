const mongodb = require('mongodb')
// Initialize database client connection, database option, users, and session collections as global variables to 
// connect to database only once and reuse that same connection across multiple functions
let client = undefined
let db = undefined
let users = undefined
let sessions = undefined

async function connectDatabase() {
    //If a client connection does not exist, create one
    if (!client) {
        client = new mongodb.MongoClient("mongodb+srv://almabroukbenomran:60104920@cluster0.2nmiwkr.mongodb.net/")
        await client.connect()
        db = client.db('web2Project')
        users = db.collection('users')
        sessions = db.collection('sessions')
    }
}

async function checkUsernameExists(usernameInput){
    await connectDatabase()
    let userDetails = await users.findOne({"userDetails.username":usernameInput})
    
    //Check if a existing user already has an identical username in the database
    if (userDetails === null){
        return false
    }
    return true
}

async function checkEmailExists(emailInput){
    await connectDatabase()
    let userDetails = await users.findOne({"userDetails.email":emailInput})

    //Check if a existing user already has an identical email in the database
    if (userDetails === null){
        return false
    }
    return true
}

async function registerAccount(userDetails){
    await connectDatabase()
    let result = await users.insertOne({userDetails})
    
    //Check if the newly created user account has been succesfully added to the database
    if (result.acknowledged){
        return true
    }
    return false
}

async function checkDuplicateSessionID(sessionID){
    await connectDatabase()
    let sessionDetails = await sessions.findOne({"userSession.sessionID":sessionID})

    //Check if a existing user already has an identical email in the database
    if (sessionDetails === null){
        return false
    }
    return true
}

//
async function startSession(userSession){
    await connectDatabase()
    //Store current user session in database
    await sessions.insertOne(userSession)
}

async function getSession(sessionID){
    await connectDatabase()
    //Search for user's current session in the database and return it
    return await sessions.findOne({sessionID:sessionID})
}

//Update the user's current session in the database with the new session data
async function updateSession(sessionID, userSession){
    await connectDatabase()
    await sessions.replaceOne({sessionID:sessionID}, userSession)
}

async function findUserAccount(usernameInput){
    await connectDatabase()
    let userAccount = await users.findOne({"userDetails.username":usernameInput})
//Checks if user exists in the database
    if (userAccount === null){
        return false
    }

    return userAccount
}

module.exports = {
    checkUsernameExists,
    checkEmailExists,
    registerAccount,
    checkDuplicateSessionID,
    startSession,
    getSession,
    updateSession,
    findUserAccount
}




