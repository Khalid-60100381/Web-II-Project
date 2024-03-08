const { MongoClient } = require('mongodb');
const mongoUrl = "mongodb+srv://60100381:60100381@cluster0.lzorkrt.mongodb.net/";
const dbName = "testingWebProject";

async function createUser(newUser) {
    try {
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const collection = db.collection('users');
        await collection.insertOne({ userDetails: newUser });
        console.log("User created");
        client.close();
    } catch (error) {
        console.error("Error creating user:", error);
    }
}

async function checkEmailExists(email) {
    try {
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const collection = db.collection('users');
        const result = await collection.findOne({ "userDetails.email": email });
        console.log("Connected to database");
        client.close();
        return !!result; // Return true if result is not null or undefined
    } catch (error) {
        console.error("Error checking email:", error);
        return false;
    }
}

async function checkUserCredentials(username, password) {
    try {
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const collection = db.collection('users');
        const result = await collection.findOne({ "userDetails.username": username, "userDetails.password": password });
        console.log(result)
        console.log("Connected to database");
        client.close();
        return !!result; // Return true if result is not null or undefined
    } catch (error) {
        console.error("Error checking credentials:", error);
        return false;
    }
}

async function checkUsernameExists(username) {
    try {
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const collection = db.collection('users');
        const result = await collection.findOne({ "userDetails.username": username });
        console.log("Connected to database");
        client.close();
        return !!result; // Return true if result is not null or undefined
    } catch (error) {
        console.error("Error checking username:", error);
        return false;
    }
}

module.exports = {
    createUser,
    checkEmailExists,
    checkUserCredentials,
    checkUsernameExists
};
