/**
 * Checks if the username and password fields are empty.
 * @param {string} usernameInput - The username input by the user.
 * @param {string} passwordInput - The password input by the user.
 * @returns {boolean} - True if any field is empty, false otherwise.
 */
async function checkEmptyFields(usernameInput, passwordInput){
    // Check if any fields are empty
    if (usernameInput.trim().length === 0 || passwordInput.trim().length === 0) {
        return true
    }

    return false
}

module.exports = {
    checkEmptyFields
}
