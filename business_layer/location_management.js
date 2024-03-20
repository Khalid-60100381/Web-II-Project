const persistence = require("../persistence.js")

// Get all details of fixed cat feeding sites from the database and return them to be rendered
async function getlocations(){
    const fixed_locations = await persistence.getlocations()
    return fixed_locations
}

module.exports = {
    getlocations
}