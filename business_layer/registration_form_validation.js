const persistence = require("../persistence.js")
const passwordValidator = require("password-validator")

async function checkPasswordMatch(passwordInput, repeatPasswordInput){
    // Check if passwordInput and repeatPasswordInput are identical or not
    if (passwordInput !== repeatPasswordInput) {
        return false
    }

    return true
}

async function checkEmptyFields(firstnameInput, lastnameInput, emailInput, usernameInput, passwordInput, repeatPasswordInput){
    //Check if any fields are empty
    if (firstnameInput.trim().length === 0 || lastnameInput.trim().length === 0 || emailInput.trim().length === 0 ||
        usernameInput.trim().length === 0 || passwordInput.trim().length === 0 || repeatPasswordInput.trim().length === 0) {
            return true
    }

    return false
}

async function validateFirstnameLastname(firstnameInput, lastnameInput){
    let firstnameContainsLetters = true
    let lastnameContainsLetters = true

    for (let i = 0; i < firstnameInput.length; i++) {
        //If the current character is a whitespace, skip validation
        if (firstnameInput[i] === " "){
            continue
        }

        let charCode = firstnameInput.charCodeAt(i);
        //Check that the current character in firstname contains only letters (a-z or A-Z)
        if (!(charCode >= 65 && charCode <= 90) && !(charCode >= 97 && charCode <= 122)) {
            firstnameContainsLetters = false
        }
    }

    for (let i = 0; i < lastnameInput.length; i++) {
        //If the current character is a whitespace, skip validation
        if (lastnameInput[i] === " "){
            continue
        }

        let charCode = lastnameInput.charCodeAt(i);
        //Check that lastname contains only letters (a-z or A-Z)
        if (!(charCode >= 65 && charCode <= 90) && !(charCode >= 97 && charCode <= 122)) {
            lastnameContainsLetters = false
        }
    }

    //If the firstname or lastname does not consist of letters only
    if (!firstnameContainsLetters || !lastnameContainsLetters){
        return false
    }

    return true
}

async function validatePasswordComplexity(passwordInput){
    let passwordSchema = new passwordValidator()

    // Add password complexity requirements to schema
    passwordSchema.is().min(8)  // Minimum length 8
    passwordSchema.has().uppercase(1)  // Must have at least 1 uppercase letter
    passwordSchema.has().lowercase(1)  // Must have at least 1 lowercase letter
    passwordSchema.has().digits(1)     // Must have at least 1 digits
    passwordSchema.has().symbols(1)    // Must have at least 1 symbol
    passwordSchema.has().not().spaces() // Should not have spaces

    //Check that user's password meets all the predefined complexity requirements
    if (passwordSchema.validate(passwordInput)){
        return true
    }

    return false
}

async function validateUsername(usernameInput){
    //Check if username is between 6 (inclusive) and 30 (inclusive)
    if (usernameInput.length < 6 || usernameInput.length > 30){
        return false
    }

    //Check if first character is a lowercase or uppercase alphabetical letter
    if (!(usernameInput.charCodeAt(0) >= 65 && usernameInput.charCodeAt(0) <= 90) && 
       !(usernameInput.charCodeAt(0) >= 97 && usernameInput.charCodeAt(0) <= 122)){
        return false
    }

    // Check for whitespaces or "@" characters
    if (usernameInput.includes(" ") || usernameInput.includes("@")) {
        return false;
    }

    for (let i = 0; i < usernameInput.length; i++) {
        // Check if the character is not a valid Unix character (contains anything other than uppercase and lowercase 
        // letters, numbers, hyphens, periods, and underscores)
        if (!(usernameInput[i].match(/[a-zA-Z0-9_.-]/))) {
            return false;
        }
    }

    return true
}

//Check if the user-inputted username already exists in the database or not
async function checkUsernameExists(usernameInput){
    return persistence.checkUsernameExists(usernameInput)
}

//Check if the user-inputted email already exists in the database or not
async function checkEmailExists(emailInput){
    return persistence.checkEmailExists(emailInput)
}



module.exports = {
    checkPasswordMatch,
    checkEmptyFields,
    validateFirstnameLastname,
    validatePasswordComplexity,
    validateUsername,
    checkUsernameExists,
    checkEmailExists
}