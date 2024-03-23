// Import required module
const persistence = require("../persistence.js")

/**
 * Retrieves locations from the database.
 * @returns {Array} - An array of locations.
 */
async function getlocations(){
    const fixed_locations = await persistence.getlocations()
    return fixed_locations
}

module.exports = {
    getlocations
}