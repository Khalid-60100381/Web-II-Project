const persistence = require("../persistence.js")


async function getPosts(){
    const pulledPosts = await persistence.getPosts(); // Turning the object list into an array to loop through in handlebar
    return pulledPosts
}

async function insertPost(details){
    const result = await persistence.insertPost(details)
    return result
}


async function updateLocations(name, details){
    details.lastUpdated = new Date();
    await persistence.updateLocations(name, details) // Note: This line seems redundant since `user` already holds the value.
    return true
}

module.exports = {
    insertPost, updateLocations, getPosts
    }
    