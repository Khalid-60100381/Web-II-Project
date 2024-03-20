async function checkEmptyFields(usernameInput, passwordInput){
    //Check if any fields are empty
    if (usernameInput.trim().length === 0 || passwordInput.trim().length === 0) {
        return true
    }

    return false
}

module.exports = {
    checkEmptyFields
}