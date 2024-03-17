const session_management = require("./business_layer/session_management.js")
const registration_form_validation = require("./business_layer/registration_form_validation.js")
const account_registration = require("./business_layer/account_registration")
const flash_messages = require("./business_layer/flash_messages.js")
const auth = require("./business_layer/authentication.js")
const location = require("./business_layer/location_management.js")


const express = require('express')
const {engine} = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')



let app = express()
app.set ('views', __dirname+"/templates")
app.set('view engine', 'handlebars')
app.engine('handlebars', engine({
    partialsDir: __dirname + '/templates/partials',
    helpers: { //Helper function to stringfy the location data in handlebars
        json: function(context){
            return JSON.stringify(context)
        }
    }
  }));
app.use(bodyParser.urlencoded())
app.use(cookieParser())


app.get("/", async (req, res) => {
    // Start user session for any user who visits the website, initially providing the role of "publicViewer" until the
    // user logs in as a member
    let userSession = await session_management.startSession({role: "publicViewer"})

    //After creating the user session, and storing the session in the database, set a browser cookie containing the user's
    //sessionID value + session expiry timestamp (when session expires, the browser cookie + user session entry in 
    // database are simultaneously deleted)
    res.cookie("sessionID", userSession.sessionID, {expires: userSession.sessionExpiry})

    //Get the Fixed Location List
    const fixed_locations = await location.getlocations()

    //Greet the user with the main landing page
    res.render("landing_page",{
        layout:undefined,
        locations: fixed_locations       
    })
})

app.get("/login", async (req, res) => {
    //Retrieve the current user's session ID from the cookie value, then check if the user's current session has any
    // stored flash message, if yes, then render the flash message to the user in the login page
    let sessionID = req.cookies.sessionID
    let flashMessage = await flash_messages.getFlash(sessionID)

    res.render("login", {
        layout: undefined,
        flashMessage: flashMessage
    })
})

app.get("/register", async (req, res) => {
    res.render("register", {layout:undefined})
})

app.post("/login", async (req, res) => {
    //To do: change the user's role in the current user's session from "publicViewer" to "member"
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput
    let userSession = await session_management.getSession(req.cookies.sessionID)
    let result = await auth.authenticateLogin(usernameInput, passwordInput)

    if(!result){
        await flash_messages.setFlash(userSession.sessionID, "Incorrect username/password.")
        res.redirect("/login")
    }
    else{
        console.log("success")
        console.log(usernameInput)
        console.log(passwordInput)
        res.render("landing_page",{
            layout:undefined,
            locations: locationsList        
        })
    }
    
})

app.post("/register", async (req, res) => {
    let firstnameInput = req.body.firstnameInput
    let lastnameInput = req.body.lastnameInput
    let emailInput = req.body.emailInput
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput
    let repeatPasswordInput = req.body.repeatPasswordInput

    let passwordsMatch = await registration_form_validation.checkPasswordMatch(passwordInput, repeatPasswordInput)

    // Check if passwords match
    if (!passwordsMatch) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Passwords do not match", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput
        })
    }

    let emptyFields = await registration_form_validation.checkEmptyFields(firstnameInput, lastnameInput, emailInput, usernameInput, passwordInput, repeatPasswordInput)

    //Check if any empty fields exist (including whitespace characters)
    if (emptyFields) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "All fields must be filled in", 
            // Pass all form inputs back to the template for repopulating the form, and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput
        })
    }

    // Before letter validation, Remove any leading or trailing whitespaces from firstname and lastname
    firstnameInput = firstnameInput.trim()
    lastnameInput = lastnameInput.trim()

    let firstnameLastnameValidated = await registration_form_validation.validateFirstnameLastname(firstnameInput, lastnameInput)

    //If firstname or lastname does not consist of letters only
    if (!firstnameLastnameValidated){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Firstname and lastname must contain letters only", 
            // Pass all form inputs back to the template for repopulating the form, and display error message
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
    let passwordComplexityValidated = await registration_form_validation.validatePasswordComplexity(passwordInput)

    //Commented out for potential future use if password-validator package is not permitted
    //let passwordComplexity = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/

    //If user password meets password requirements
    if (!passwordComplexityValidated) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: `Password Requirements:
                           - At least 8 characters
                           - Contain at least one uppercase letter
                           - Contain at least one lowercase letter
                           - Contain at least one digit
                           - Contain at least one symbol
                           - Contain no whitespaces`,

            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput
        })
    }

    usernameInput = usernameInput.trim()
    //Check that username starts with an alphabetic character, does not contain spaces or “@”, is between 6 and 30 
    // characters (both inclusive), and contains only valid Unix Characters (uppercase and lowercase letters, numbers, 
    // “-”, “.”, and “_”
    let usernameValidated = await registration_form_validation.validateUsername(usernameInput)

    //If username does not meet criteria
    if (!usernameValidated){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: `Username Requirements:
            - Between 6 and 30 characters (both inclusive)
            - Starts with an alphabetic character (lowercase or uppercase)
            - Does not contain whitespaces or “@” symbol
            - Contains only valid Unix Characters (uppercase and lowercase letters, digits, “-”, “.”, and “_”`,

            // Pass all form inputs back to the template for repopulating the form, except for username, and display 
            // error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput
        })
    }

    //Check if the user-inputted username already exists in the database
    let usernameExists = await registration_form_validation.checkUsernameExists(usernameInput)

    //If username exits in database
    if (usernameExists){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Username already taken", 
            // Pass all form inputs back to the template for repopulating the form, except for the username, 
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput
        })
    }

    //Check if the user-inputted email already exists in the database
    let emailExists = await registration_form_validation.checkEmailExists(emailInput)

    //If email exists in database
    if (emailExists){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Email already taken", 
            // Pass all form inputs back to the template for repopulating the form, except for the email, 
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            usernameInput: usernameInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput
        })
    }

    //Validation checklist:
    // - Check that email is formatted apropriately, better to wait until we take lecture about handling emails...

    //Create an object storing all validated user details + assign user to the "member" role
    let userDetails = {
        firstname: firstnameInput,
        lastname: lastnameInput,
        email: emailInput,
        username: usernameInput,
        password: passwordInput,
        role:"member"
    }

    // Pass user details to account_registration business sub-layer to hash + salt user password
    let accountRegistered = await account_registration.registerAccount(userDetails)
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let userSession = await session_management.getSession(req.cookies.sessionID)

    //If the user has successfully registered an account in the database, and the user has a currently active session, 
    // and is a public viewer, then set a flash message to notify the user that the account registration is successful,
    // and that he should log in, then redirect to the login page
    if (accountRegistered && (userSession && userSession.sessionData.role === "publicViewer")){
        await flash_messages.setFlash(userSession.sessionID, "Account has been successfully registered! Please log in.")
        res.redirect("/login");
    }
})


app.listen(8000, () => {
    console.log("Application started on port 8000")
})