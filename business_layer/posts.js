const persistence = require("../persistence.js")


/**
 * Retrieves posts from the persistence layer.
 *
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of posts retrieved from the persistence layer.
 */
async function getPosts(){
    const pulledPosts = await persistence.getPosts(); // Turning the object list into an array to loop through in handlebar
    return pulledPosts
}


/**
 * Inserts a new post into the persistence layer.
 *
 * @param {Object} details - An object containing the details of the post to be inserted.
 * @returns {Promise<Object>} - A promise that resolves to the result of the insertion operation.
 */
async function insertPost(details){
    const result = await persistence.insertPost(details)
    return result
}


/**
 * Updates location details for a specific name in the persistence layer.
 *
 * @param {string} name - The name for which the location details need to be updated.
 * @param {Object} details - An object containing the location details to be updated.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating the success of the update operation.
 */
async function updateLocations(name, details){
    details.lastUpdated = new Date();
    await persistence.updateLocations(name, details) // Note: This line seems redundant since `user` already holds the value.
    return true
}

module.exports = {
    insertPost, updateLocations, getPosts
    }
    