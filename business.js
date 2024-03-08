const persistence = require('./persistence.js')

async function checkPasswordMatch(passwordInput, repeatPasswordInput){
    // Check if passwordInput and repeatPasswordInput are identical or not
    if (passwordInput !== repeatPasswordInput) {
        return false
    }

    return true
}

async function checkEmptyFieldsRegister(firstnameInput, lastnameInput, emailInput, usernameInput, passwordInput, repeatPasswordInput){
    if (firstnameInput.trim().length === 0 || lastnameInput.trim().length === 0 || emailInput.trim().length === 0 ||
        usernameInput.trim().length === 0 || passwordInput.trim().length === 0 || repeatPasswordInput.trim().length === 0) {
            return true
    }

    return false
}

async function checkEmptyFieldsLogin(usernameInput, passwordInput){
    if (usernameInput.trim().length === 0 || passwordInput.trim().length === 0) {
        return true
    }

    return false
}

 async function checkEmailExists(email){
    if (persistence.checkEmailExists(email)){
        return true
    }
    else{
        return false
    }
}

async function checkUserCredentials(username, password){
    if (persistence.checkUserCredentials(username, password)){
        return true
    }
    else{
        return false
    }
}

async function checkUsernameExists(username){
    if (persistence.checkUsernameExists(username)){
        return true
    }
    else{
        return false
    }
}

async function sendUserDetails(userDetails){
    if (userDetails.firstname.trim().length === 0 || userDetails.lastname.trim().length === 0 || userDetails.email.trim().length === 0 ||
        userDetails.username.trim().length === 0 || userDetails.password.trim().length === 0) {
            return false
    }
    else{
        persistence.createUser(userDetails)
    }
}



module.exports = {
    checkPasswordMatch,
    checkEmptyFieldsRegister,
    checkEmptyFieldsLogin,
    sendUserDetails,
    checkEmailExists,
    checkUsernameExists,
    checkUserCredentials
}