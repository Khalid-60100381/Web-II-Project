const persistence = require("../persistence.js")

async function getlocations(){
    const fixed_locations = await persistence.getlocations()
    return fixed_locations
}

module.exports = {
    getlocations
}