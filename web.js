const business = require("./business.js")
const express = require('express')
const {engine} = require('express-handlebars')
const bodyParser = require('body-parser')

let app = express()
app.set ('views', __dirname+"/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', engine())

app.use(bodyParser.urlencoded())

app.get("/", async (req, res) => {
    res.render("landing_page", {layout:undefined})
})

app.get("/login", async (req, res) => {
    res.render("login", {layout:undefined})
})

app.get("/register", async (req, res) => {
    res.render("register", {layout:undefined})
})

app.post("/login", async (req, res) => {
    //Hash user credentials against hashed credentials in database + redirect to landing page, or allow user to re-enter credentials and login again
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput

    console.log(usernameInput)
    console.log(passwordInput)
})

app.post("/register", async (req, res) => {
    //Store user details in hashed format in database
    let firstnameInput = req.body.firstnameInput
    let lastnameInput = req.body.lastnameInput
    let emailInput = req.body.emailInput
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput
    let repeatPasswordInput = req.body.repeatPasswordInput

    let passwordsMatch = await business.checkPasswordMatch(passwordInput, repeatPasswordInput)

    // Check if passwords match
    if (!passwordsMatch) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Passwords do not match.", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput
        })
    }

    let emptyFields = business.checkEmptyFields(firstnameInput, lastnameInput, emailInput, usernameInput, passwordInput, repeatPasswordInput)

    //Check if any empty fields exist (including whitespace characters)
    if (emptyFields) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "All fields must be filled in.", 
            // Pass all form inputs back to the template for repopulating the form, and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput
        })
    }
    
    let firstnameContainsLetters = true
    let lastnameContainsLetters = true
    // Before letter validation, Remove any leading or trailing whitespaces from firstname and lastname
    firstnameInput = firstnameInput.trim()
    lastnameInput = lastnameInput.trim()

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

    //If firstname or lastname does not consist of letters only
    if (!firstnameContainsLetters || !lastnameContainsLetters){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Firstname and lastname must contain letters only.", 
            // Pass all form inputs back to the template for repopulating the form, and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput
        })
    }

    // After letter validation, remove all whitespaces in between the letters from firstname and lastname
    firstnameInput = firstnameInput.replace(/\s+/g, "")
    lastnameInput = lastnameInput.replace(/\s+/g, "")


    //Before validation, remove all whitespaces from the user password
    passwordInput = passwordInput.replace(/\s+/g, "")

    // Validate if user password length is 8 characters or more, and contains at least one uppercase, lowercase, digit, 
    // and special character
    console.log(passwordInput)
    let passwordComplexity = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
    console.log(passwordComplexity.test(passwordInput))

    //If user password meets password requirements
    if (!passwordComplexity.test(passwordInput)) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: `Password Requirements:
                           - At least 8 characters
                           - Contain at least one uppercase letter
                           - Contain at least one lowercase letter
                           - Contain at least one digit
                           - Contain at least one special character
                           - Contain no whitespaces`,

            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput
        })
    }

})


app.listen(8000, () => {
    console.log("Application started on port 8000")
})