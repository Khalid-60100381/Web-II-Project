const session_management = require("./business_layer/session_management.js")
const registration_form_validation = require("./business_layer/registration_form_validation.js")
const account_registration = require("./business_layer/account_registration")
const flash_messages = require("./business_layer/flash_messages.js")
const location = require("./business_layer/location_management.js")
const authentication = require("./business_layer/authentication.js")
const login_form_validation = require("./business_layer/login_form_validation.js")
const authorization = require("./business_layer/authorization.js")
const csrf_protection = require("./business_layer/csrf_protection.js")

const express = require('express')
const {engine} = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const app = express()
app.set ('views', __dirname+"/templates")
app.set('view engine', 'handlebars')

app.engine('handlebars', engine({
    partialsDir: __dirname + '/templates/partials',
    helpers: { //Helper function to stringfy the location data in handlebars
        json: function(context){
            return JSON.stringify(context)
        }
    }
  }))

app.use(bodyParser.urlencoded())
app.use(cookieParser())


app.get("/", async (req, res) => {
    // Retrieve the current user's session ID from the cookie value, then check if the user's current sessionID 
    // corresponds to an existing user session in the database
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)
    
    // If the browser cookie exists, the user session in the database exists as well, and the user is not logged in as a 
    // member or admin, then retrieve the list of fixed feeding site locations from the database, and greet the user with 
    // the main landing page alongside the rendered locations without displaying the member dashboard or admin dashboard
    // buttons in the navigation bar
    if ((sessionID && userSession) && (userSession.sessionData.role !== "member" && userSession.sessionData.role !== "admin")) {
        const fixed_locations = await location.getlocations()

        res.render("landing_page", {
        layout:undefined,
        locations: fixed_locations
        })

        return
    }

    // If the browser cookie exists, the user session in the database exists as well, and the user is logged in as a 
    // member, then retrieve the list of fixed feeding site locations from the database, and greet the user with 
    // the main landing page alongside the rendered locations, and display the member dashboard button in the navigation bar
    if ((sessionID && userSession) && (userSession.sessionData.role === "member")) {
        const fixed_locations = await location.getlocations()

        res.render("landing_page", {
        layout:undefined,
        locations: fixed_locations,
        userIsMember: true
        })

        return
    }

    // If the browser cookie exists, the user session in the database exists as well, and the user is logged in as an 
    // admin, then retrieve the list of fixed feeding site locations from the database, and greet the user with 
    // the main landing page alongside the rendered locations, and display the admin dashboard button in the navigation bar
    if ((sessionID && userSession) && (userSession.sessionData.role === "admin")) {
        const fixed_locations = await location.getlocations()

        res.render("landing_page", {
        layout:undefined,
        locations: fixed_locations,
        userIsAdmin: true
        })

        return
    }

    // Start user session for any user who visits the website, initially providing the role of "publicViewer" until the
    // user logs in as a member or admin
    userSession = await session_management.startSession({role: "publicViewer"})

    //After creating the user session, and storing the session in the database, set a browser cookie containing the user's
    //sessionID value + session expiry timestamp (when session expires, the browser cookie + user session entry in 
    // database are simultaneously deleted)
    res.cookie("sessionID", userSession.sessionID, {expires: userSession.sessionExpiry})

    const fixed_locations = await location.getlocations()
        
    res.render("landing_page", {
    layout:undefined,
    locations: fixed_locations
    })
})

app.get("/login", async (req, res) => {
    //Retrieve the current user's session ID from the cookie value, then check if the user's current session has any
    // stored flash message, if yes, then render the flash message to the user in the login page
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)
    
    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should login again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please login again.")
        res.redirect("/login")

        return
    }

    // Check and Retrieve any flash messages that are part of the user's current session
    let flashMessage = await flash_messages.getFlash(sessionID)

    // If no flash messages exist, then render the login page
    if (!flashMessage){
        res.render("login", {
            layout: undefined
        })
    }

    // If a flash message exists storing the session expiry error message coming from a /login route, then render the 
    // error message as part of the login page
    if (flashMessage === "Session expired, Please login again."){
        let sessionExpiryError = flashMessage

        res.render("login", {
            layout: undefined,
            sessionExpiryError: sessionExpiryError
        })
    }

    // If a flash message exists storing the session expiry error message coming from a /register route, then render the 
    // error message as part of the login page
    if (flashMessage === "Session expired, Please register again."){
        let sessionExpiryError = flashMessage

        res.render("login", {
            layout: undefined,
            sessionExpiryError: sessionExpiryError
        })
    }

    // If a flash message exists storing the registration confirmation message coming from the POST /register route, 
    // then render the confirmation message as part of the login page
    if (flashMessage === "Account has been successfully registered! Please log in."){
        let registrationConfirmation = flashMessage

        res.render("login", {
            layout: undefined,
            registrationConfirmation: registrationConfirmation
        })
    }

    // If a flash message exists storing the registration confirmation message coming from the POST /login route, 
    // then render the confirmation message as part of the login page
    if (flashMessage === "Incorrect username or password."){
        let incorrectCredentials = flashMessage

        res.render("login", {
            layout: undefined,
            incorrectCredentials: incorrectCredentials
        })
    }

    // If a flash message exists storing the user login request message (unauthorized access) coming from the GET 
    // /member-page or admin-page routes, then render the user login request message as part of the login page
    if (flashMessage === "Please log in to your account."){
        let unauthorizedAccess = flashMessage

        res.render("login", {
            layout: undefined,
            unauthorizedAccess: unauthorizedAccess
        })
    }
})

app.get("/register", async (req, res) => {
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please register again.")
        res.redirect("/login")

        return
    }

    //
    //let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)
    //If the current user's session passes all session validation, then render the register form
    res.render("register", {
        layout:undefined
        //csrfToken: csrfToken
    })
})

app.get("/member-page", async (req, res) => {
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please login again.")
        res.redirect("/login")

        return
    }

    // If the user tries to directly access a protected route (/member-page) and the user's session data indicates that 
    // the user is not authenticated as either a member or admin, then set a flash message asking the user to login with 
    // his account and redirect the user to the login page
    if (userSession.sessionData.role !== "member" && userSession.sessionData.role !== "admin"){
        await flash_messages.setFlash(userSession.sessionID, "Please log in to your account.")
        res.redirect("/login")

        return
    }

    //Get the Fixed Location List
    const fixed_locations = await location.getlocations()

    return res.render("member_page",{
    layout:undefined,
    locations: fixed_locations        
    })
})

app.get("/admin-page", async (req, res) => {
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please login again.")
        res.redirect("/login")

        return
    }

    // If the user tries to directly access a protected route (/admin-page) and the user's session data indicates that 
    // the user is not authenticated as an admin, then set a flash message asking the user to login with his account and 
    // redirect the user to the login page
    if (userSession.sessionData.role !== "admin"){
        await flash_messages.setFlash(userSession.sessionID, "Please log in to your account.")
        res.redirect("/login")

        return
    }

    res.render("admin_page",{
        layout:undefined,
    })
})

app.post("/login", async (req, res) => {
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should login again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please login again.")
        res.redirect("/login")

        return
    }

    // Get the user's username and password input from the form fields, then send the values to the authentication
    // sub-layer to validate user-inputted credentials against database credentials
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput

    let emptyFields = await login_form_validation.checkEmptyFields(usernameInput, passwordInput)

    //Check if any empty fields exist (including whitespace characters)
    if (emptyFields) {
        return res.render("login", { 
            layout: undefined, 
            emptyLoginFields: "All fields must be filled in"
        })
    }

    let result = await authentication.authenticateLogin(usernameInput, passwordInput)

    // If the user-inputted credentials are incorrect, then set a flash message telling the user that either the username
    // or password is incorrect, then redirect to the login page
    if(!result){
        await flash_messages.setFlash(userSession.sessionID, "Incorrect username or password.")
        res.redirect("/login")

        return
    }

    // If the user-inputted credentials are correct, then get the user's role stored in the user's account, modify the  
    // user's role in the session data to either "member" or "admin" based on his account role, and redirect the user 
    // to either the member page or admin page 
    let userRole = await authorization.getUserRole(usernameInput)

    if (userRole === "member"){
        userSession.sessionData.role = "member"
        await session_management.updateSession(sessionID, userSession)
        res.redirect("/member-page")

        return
    }

    if (userRole === "admin"){
        userSession.sessionData.role = "admin"
        await session_management.updateSession(sessionID, userSession)
        res.redirect("admin-page")

        return
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
    let emailValidated = await registration_form_validation.validateEmail(emailInput)


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

    //If email does not meet criteria
    if (!emailValidated){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Invalid email format", 
            // Pass all form inputs back to the template for repopulating the form, except for the email, and display 
            // error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            usernameInput: usernameInput,
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

    //Create an object storing all validated user details + assign user to the "member" role
    let userDetails = {
        firstname: firstnameInput,
        lastname: lastnameInput,
        username: usernameInput,
        password: passwordInput,
        role:"member"
    }

    
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function 
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please register again.")
        res.redirect("/login")

        return
    }

    // Pass user details to account_registration business sub-layer to hash + salt user password
    let accountRegistered = await account_registration.registerAccount(userDetails)

    //If the user has successfully registered an account in the database, then set a flash message to notify the user 
    // that the account registration is successful, and that he should log in, then redirect to the login page
    if (accountRegistered){
        await flash_messages.setFlash(userSession.sessionID, "Account has been successfully registered! Please log in.")
        res.redirect("/login")
    }
})

app.get("/about", async (req, res) => {
    // Retrieve the current user's session ID from the cookie value, then check if the user's current sessionID 
    // corresponds to an existing user session in the database
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie exists, the user session in the database exists as well, and the user is logged in as a 
    // member, then greet the user with the about us page, and display the member dashboard button in the navigation bar
    if ((sessionID && userSession) && (userSession.sessionData.role === "member")) {

        res.render("about", {
            layout: undefined,
            userIsMember: true
        })

        return
    }

    // If the browser cookie exists, the user session in the database exists as well, and the user is logged in as an 
    // admin, then greet the user with the about us page, and display the admin dashboard button in the navigation bar
    if ((sessionID && userSession) && (userSession.sessionData.role === "admin")) {

        res.render("about", {
            layout: undefined,
            userIsAdmin: true
        })

        return
    }

    res.render("about", {
        layout: undefined
    })
})

async function error404(req, res){
    res.status(404).render("404", {
        layout: undefined
    })
}

app.use(error404)

app.listen(8000, () => {
    console.log("Application started on port 8000")
})