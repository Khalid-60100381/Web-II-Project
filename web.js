// Importing necessary modules for business layer functionalities
const session_management = require("./business_layer/session_management.js")
const registration_form_validation = require("./business_layer/registration_form_validation.js")
const account_registration = require("./business_layer/account_registration")
const flash_messages = require("./business_layer/flash_messages.js")
const location = require("./business_layer/location_management.js")
const authentication = require("./business_layer/authentication.js")
const login_form_validation = require("./business_layer/login_form_validation.js")
const authorization = require("./business_layer/authorization.js")
const passwordReset = require("./business_layer/password_reset.js")
const posts = require("./business_layer/posts.js")
const change_profile_details = require("./business_layer/change_profile_details.js")
const csrf_protection = require("./business_layer/csrf_protection.js")

// Importing required packages for Express application
const express = require('express')
const {engine} = require('express-handlebars')
const handlebars = require('handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fileUpload=require('express-fileupload')

// Initializing Express application, Adding middleware for parsing URL-encoded bodies and cookies
const app = express()
app.use(bodyParser.urlencoded())
app.use(cookieParser())
app.use(fileUpload())
app.use('/uploads', express.static('uploads'));


//HandleBars Stuff
//Initializing handelbars engine and templates directory
app.set ('views', __dirname+"/templates")
app.set('view engine', 'handlebars')

// Registering custom Handlebars helper function for logical AND comparison
handlebars.registerHelper('noneAreTrue', function(v1, v2, v3, options) {
    if (!v1 && !v2 && !v3) {
      return options.fn(this);
    }
    return options.inverse(this);
});

handlebars.registerHelper('eq', function (val1, val2) {
    return val1 === val2;
  });

  handlebars.registerHelper('capitalizeFirst', function(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
});

//Handlebars helper function to format last updated time
handlebars.registerHelper('formatLastUpdated', function(lastUpdated) {
    // Calculate the time difference between now and the last updated time
    const currentTime = new Date();
    const updatedTime = new Date(lastUpdated);
    const timeDiffInSeconds = Math.floor((currentTime - updatedTime) / 1000);

    // Format the time difference based on seconds, minutes, or hours
    if (timeDiffInSeconds < 60) {
        return `${timeDiffInSeconds} sec`;
    } else if (timeDiffInSeconds < 3600) {
        return `${Math.floor(timeDiffInSeconds / 60)} min`;
    } else {
        return `${Math.floor(timeDiffInSeconds / 3600)} hr`;
    }
});

// Configuring the Handlebars engine for the Express application
app.engine('handlebars', engine({
    partialsDir: __dirname + '/templates/partials',
    helpers: { //Helper function to stringfy the location data in handlebars
        json: function(context){
            return JSON.stringify(context)
        },
        logicalAND: handlebars.helpers.logicalAND
    }
}))
//END OF HandleBars Stuff

//Start of app
//Landing Page:
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
        layout: undefined,
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

    let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)
    // Check and Retrieve any flash messages that are part of the user's current session
    let flashMessage = await flash_messages.getFlash(sessionID)

    // If no flash messages exist, then render the login page
    if (!flashMessage){
        res.render("login", {
            layout: undefined,
            csrfToken
        })
    }

    // If a flash message exists storing the session expiry error message coming from a /login route, then render the 
    // error message as part of the login page
    if (flashMessage === "Session expired, Please login again."){
        let sessionExpiryError = flashMessage

        res.render("login", {
            layout: undefined,
            sessionExpiryError: sessionExpiryError,
            csrfToken
        })
    }

    // If a flash message exists storing the session expiry error message coming from a /register route, then render the 
    // error message as part of the login page
    if (flashMessage === "Session expired, Please register again."){
        let sessionExpiryError = flashMessage

        res.render("login", {
            layout: undefined,
            sessionExpiryError: sessionExpiryError,
            csrfToken
        })
    }

    if (flashMessage === "You must be signed in to be able to post."){
        let unauthorizedAccess = flashMessage

        res.render("login", {
            layout: undefined,
            unauthorizedAccess: unauthorizedAccess,
            csrfToken
        })
    }
    

    // If a flash message exists storing the registration confirmation message coming from the POST /register route, 
    // then render the confirmation message as part of the login page
    if (flashMessage === "Account has been successfully registered! Please log in."){
        let registrationConfirmation = flashMessage

        res.render("login", {
            layout: undefined,
            registrationConfirmation: registrationConfirmation,
            csrfToken
        })
    }

    // If a flash message exists storing the registration confirmation message coming from the POST /login route, 
    // then render the confirmation message as part of the login page
    if (flashMessage === "Incorrect username or password."){
        let incorrectCredentials = flashMessage

        res.render("login", {
            layout: undefined,
            incorrectCredentials: incorrectCredentials,
            csrfToken
        })
    }

    // If a flash message exists storing the user login request message (unauthorized access) coming from the GET 
    // /member-page or admin-page routes, then render the user login request message as part of the login page
    if (flashMessage === "Please log in to your account."){
        let unauthorizedAccess = flashMessage

        res.render("login", {
            layout: undefined,
            unauthorizedAccess: unauthorizedAccess,
            csrfToken
        })
    }

    if (flashMessage === "Session expired, Please reset your password again."){
        let sessionExpiryError = flashMessage

        res.render("login", {
            layout: undefined,
            sessionExpiryError: sessionExpiryError,
            csrfToken
        })
    }
    
    if (flashMessage === "CSRF token mismatch, approval process rejected"){
        let unauthorizedAccess = flashMessage

        res.render("login", {
            layout: undefined,
            unauthorizedAccess: unauthorizedAccess,
            csrfToken
        })
    
    }

    if (flashMessage === "Password reset successfully."){
        let passwordResetSuccess = flashMessage

        res.render("login", {
            layout: undefined,
            passwordResetSuccess: passwordResetSuccess,
            csrfToken
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

    let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)
    //If the current user's session passes all session validation, then render the register form
    res.render("register", {
        layout:undefined,
        csrfToken
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

    // Check and Retrieve any flash messages that are part of the user's current session


    // Handling the flash message for welcoming back the user by rendering the user_login_alert template which displays
    // the welcome back message, and redirects the user to the member page
    if (flashMessage === `Welcome Back ${userSession.sessionData.username}!`){
        let welcomeBackMessage = flashMessage

        res.render("user_login_alert", {
            layout:undefined,
            welcomeBackMessage: welcomeBackMessage,
            userIsMember: true
        })

        return
    }

    // Get the list of fixed locations and render the member page
    const fixed_locations = await location.getlocations()

    res.render("member_page",{
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

    // Check and Retrieve any flash messages that are part of the user's current session
    let flashMessage = await flash_messages.getFlash(sessionID)

    // Handling the flash message for welcoming back the user by rendering the user_login_alert template which displays
    // the welcome back message, and redirects the user to the admin page
    if (flashMessage === `Welcome Back ${userSession.sessionData.username}!`){
        let welcomeBackMessage = flashMessage

        res.render("user_login_alert", {
            layout:undefined,
            welcomeBackMessage: welcomeBackMessage,
            userIsAdmin: true
        })

        return
    }
    
    const fixed_locations = await location.getlocations()
    res.render("admin_dashboard",{
        layout:undefined,
        locations: fixed_locations
    })
})

app.get("/admin-home", async (req, res) => {
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
    
        // Check and Retrieve any flash messages that are part of the user's current session
        let flashMessage = await flash_messages.getFlash(sessionID)
    
        // Handling the flash message for welcoming back the user by rendering the user_login_alert template which displays
        // the welcome back message, and redirects the user to the admin page
        if (flashMessage === `Welcome Back ${userSession.sessionData.username}!`){
            let welcomeBackMessage = flashMessage
    
            res.render("user_login_alert", {
                layout:undefined,
                welcomeBackMessage: welcomeBackMessage,
                userIsAdmin: true
            })
    
            return
        }
        
        const fixed_locations = await location.getlocations()
        res.render("admin_page",{
            layout:undefined,
            locations: fixed_locations
        })
})

app.post("/login", async (req, res) => {
    let csrfToken = req.body.csrf
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
            emptyLoginFields: "All fields must be filled in",
            csrfToken: csrfToken
        })
    }

    // Authenticate the user's login credentials against the database credentials
    let result = await authentication.authenticateLogin(usernameInput, passwordInput)

    // If the user-inputted credentials are incorrect, then set a flash message telling the user that either the username
    // or password is incorrect, then redirect to the login page
    if(!result){
        await flash_messages.setFlash(userSession.sessionID, "Incorrect username or password.")
        res.redirect("/login")

        return
    }
    
    let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

    if (!compareResult){
        await csrf_protection.cancelToken(sessionID)
        await flash_messages.setFlash(userSession.sessionID, "CSRF token mismatch, approval process rejected")
        res.redirect("/login")

        return
    }   

    // If the user-inputted credentials are correct, then get the user's role stored in the user's account, modify the  
    // user's role in the session data to either "member" or "admin" based on his account role, and redirect the user 
    // to either the member page or admin page 
    let userRole = await authorization.getUserRole(usernameInput)

    if (userRole === "member"){
        userSession.sessionData.role = "member"
        userSession.sessionData.username = usernameInput
        await session_management.updateSession(sessionID, userSession)

        await flash_messages.setFlash(userSession.sessionID, `Welcome Back ${usernameInput}!`)
        await csrf_protection.cancelToken(sessionID)
        res.redirect("/member-page")

        return
    }

    if (userRole === "admin"){
        userSession.sessionData.role = "admin"
        userSession.sessionData.username = usernameInput
        await session_management.updateSession(sessionID, userSession)

        await flash_messages.setFlash(userSession.sessionID, `Welcome Back ${usernameInput}!`)
        await csrf_protection.cancelToken(sessionID)
        res.redirect("admin-page")

        return
    }
    
})

app.post("/register", async (req, res) => {
    let csrfToken = req.body.csrf
    // Retrieve all user field inputs from the registration form fields
    let firstnameInput = req.body.firstnameInput
    let lastnameInput = req.body.lastnameInput
    let emailInput = req.body.emailInput
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput
    let repeatPasswordInput = req.body.repeatPasswordInput

    // Check if the user-inputted passwords match
    let passwordsMatch = await registration_form_validation.checkPasswordMatch(passwordInput, repeatPasswordInput)

    //If passwords do not match
    if (!passwordsMatch) {
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "Passwords do not match", 
            // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
            // and display error message
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput,
            csrfToken: csrfToken
        })
    }

    //Check if any empty fields exist (including whitespace characters)
    let emptyFields = await registration_form_validation.checkEmptyFields(firstnameInput, lastnameInput, emailInput, usernameInput, passwordInput, repeatPasswordInput)

    // If any empty fields exist
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
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
        })
    }

    // Before letter validation, Remove any leading or trailing whitespaces from firstname and lastname
    firstnameInput = firstnameInput.trim()
    lastnameInput = lastnameInput.trim()

    // Validate if firstname and lastname consist of letters only
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
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
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

    //If user password does not meet password complexity requirements
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
            usernameInput: usernameInput,
            csrfToken: csrfToken
        })
    }

    //Before username validation, remove any leading or trailing whitespaces from username
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
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
        })
    }

    //Validates the email format of user-inputted email
    let emailValidated = await registration_form_validation.validateEmail(emailInput)

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
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
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
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
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
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
        })
    }

    //Create an object storing all validated user details + assign user to the "member" role
    let userDetails = {
        firstname: firstnameInput,
        lastname: lastnameInput,
        email: emailInput,
        username: usernameInput,
        password: passwordInput,
        role:"member"
    }

    
    // Retrieve the current user session from the database using the sessionID stored in the browser cookie
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

    let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

    if (!compareResult){
        return res.render("register", { 
            layout: undefined, 
            errorMessage: "CSRF token mismatch, approval process rejected", 
            firstnameInput: firstnameInput,
            lastnameInput: lastnameInput,
            emailInput: emailInput,
            usernameInput: usernameInput,
            passwordInput: passwordInput,
            repeatPasswordInput: repeatPasswordInput,
            csrfToken: csrfToken
        })
    }   
    // Pass user details to account_registration business sub-layer to hash + salt user password
    let accountRegistered = await account_registration.registerAccount(userDetails)

    //If the user has successfully registered an account in the database, then set a flash message to notify the user 
    // that the account registration is successful, and that he should log in, then redirect to the login page
    if (accountRegistered){
        await flash_messages.setFlash(userSession.sessionID, "Account has been successfully registered! Please log in.")
        await csrf_protection.cancelToken(sessionID)
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

app.get("/logout", async (req, res) => {
    // Retrieve the current user's session ID from the cookie value, then check if the user's current sessionID 
    // corresponds to an existing user session in the database
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the user session in the database does not exist, or the browser cookie does not exist, then clear the browser
    // cookie
    if (!userSession || !sessionID) {
        res.clearCookie("sessionID")
    }

    // If the browser cookie exists, and the user session in the database exists as well, then delete the user session 
    // from the database, and clear the browser cookie
    if (sessionID && userSession) {
        await session_management.deleteSession(sessionID)
        res.clearCookie("sessionID")
    }

    // Render the user_logout_alert template which displays the logout message to confirm that the user has logged out of 
    // his account successfully, and redirects the user to the landing page
    res.render("user_logout_alert", {
        layout: undefined
    })
})


app.get("/forgot-password", async(req, res) => {
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please reset your password again.")
        res.redirect("/login")

        return
    }
    let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)

    // Check and Retrieve any flash messages that are part of the user's current session
    let flashMessage = await flash_messages.getFlash(sessionID)

    // If a flash message exists storing the invalid email message coming from the POST /submit-email route, 
    // then render the invalid email message as part of the forgot password page
    if (flashMessage === "Email does not exist, Please check and try again."){
        let invalidEmail = flashMessage

        res.render("forgot_password", {
            layout: undefined,
            invalidEmail: invalidEmail,
            csrfToken: csrfToken
        })

        return
    }

    // If a flash message exists storing the email link sent message coming from the POST /submit-email route,
    // then render the email link sent message as part of the forgot password page
    if (flashMessage === "A link has been sent to your email, check console log to reset password."){
        let emailLinkSent = flashMessage

        res.render("forgot_password", {
            layout: undefined,
            emailLinkSent: emailLinkSent,
            csrfToken: csrfToken
        })

        return
    }

    // If a flash message exists storing the invalid reset key message coming from the POST /reset-password route,
    // then render the invalid reset key message as part of the forgot password page
    if (flashMessage === "Invalid reset key, Please enter your email again."){
        let invalidResetKey = flashMessage

        res.render("forgot_password", {
            layout: undefined,
            invalidResetKey: invalidResetKey,
            csrfToken: csrfToken
        })

        return
    }

    if (flashMessage === "CSRF token mismatch, approval process rejected"){
        let invalidResetKey = flashMessage

        res.render("forgot_password", {
            layout: undefined,
            invalidResetKey: invalidResetKey,
            csrfToken: csrfToken
        })

        return
    }

    // If not flash messages exist, then render the forgot password page
    res.render("forgot_password", {
        layout: undefined,
        csrfToken: csrfToken
    })
    
})


app.post("/submit-email", async(req, res) => {
    let csrfToken = req.body.csrf
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please reset your password again.")
        res.redirect("/login")

        return
    }

    // Get the user's email input from the form field, then check if the email exists in the database
    let emailInput = req.body.emailInput
    let emailExists = await registration_form_validation.checkEmailExists(emailInput)

    // If the email does not exist in the database, then set a flash message telling the user that the email does not
    // exist, and that he should check and try again, then redirect to the forgot password page
    if(!emailExists){

        await flash_messages.setFlash(userSession.sessionID, "Email does not exist, Please check and try again.")
        res.redirect("/forgot-password")

        return
    }

    let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

    if (!compareResult){
        await flash_messages.setFlash(userSession.sessionID, "CSRF token mismatch, approval process rejected")
        res.redirect("/forgot-password")

        return
    }   

    // If the email exists in the database, then send a password reset link to the user's email, and set a flash message
    // telling the user that a link has been sent to his email, then redirect to the forgot password page
    await passwordReset.resetPassword(emailInput)
    await flash_messages.setFlash(userSession.sessionID, "A link has been sent to your email, check console log to reset password.")


    // Redirect to the forgot password page
    await csrf_protection.cancelToken(sessionID)
    res.redirect("/forgot-password")

})


app.get('/reset-password', async (req, res) => {
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please reset your password again.")
        res.redirect("/login")

        return
    }
    let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)

    // Check if the reset key exists in the database
    let checkResetKey = await passwordReset.checkResetKey(req.query.key)

    // If the reset key does not exist in the database, then set a flash message telling the user that the reset key is
    // invalid, and that he should enter his email again, then redirect to the forgot password page
    if (!checkResetKey) {
        await flash_messages.setFlash(userSession.sessionID, "Invalid reset key, Please enter your email again.")
        res.redirect("/forgot-password")

        return
    }

    // If the reset key exists in the database, then render the reset password page
    res.render('reset_password', {
        layout: undefined,
        resetKey: req.query.key,
        csrfToken: csrfToken
    })
})


app.post('/reset-password', async (req, res) => {
    let csrfToken = req.body.csrf
    // Retrieve the current user session from the database using the sessionID stored in the cookie
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the browser cookie does not exist, or the user session in the database does not exist, then start a new user
    // session, create a new browser cookie containing the sessionID, and set a flash message telling the user that the
    // session has expired, and that he should register again, then redirect to the login page and exit the function
    if (!sessionID || !userSession) {
        let newUserSession = await session_management.startSession({role: "publicViewer"})
        res.cookie("sessionID", newUserSession.sessionID, {expires:newUserSession.sessionExpiry})

        await flash_messages.setFlash(newUserSession.sessionID, "Session expired, Please reset your password again.")
        res.redirect("/login")

        return
    }

    // Get the new password, confirm new password, and reset key from the form fields
    let newPassword = req.body.newPassword
    let confirmNewPassword = req.body.confirmNewPassword
    let resetKey = req.body.resetKey


    // Check if any empty fields exist (including whitespace characters)
    let emptyFields = await login_form_validation.checkEmptyFields(newPassword, confirmNewPassword)

    // If any empty fields exist, then render the reset password page with an error message
    if (emptyFields) {
        res.render("reset_password", {
            layout: undefined, 
            errorMessage: "All fields must be filled in.",
            resetKey: resetKey,
            csrfToken: csrfToken
        })

        return
    }

    // Validate if user password length is 8 characters or more, and contains at least one uppercase, lowercase, digit, 
    // and special character
    let passwordComplexityValidated = await registration_form_validation.validatePasswordComplexity(newPassword)

    // If the user password does not meet the password complexity requirements, then render the reset password page with
    // an error message
    if (!passwordComplexityValidated) {
        res.render("reset_password", {
            layout: undefined, 
            errorMessage: `Password Requirements:
                           - At least 8 characters
                           - Contain at least one uppercase letter
                           - Contain at least one lowercase letter
                           - Contain at least one digit
                           - Contain at least one symbol
                           - Contain no whitespaces`,
            resetKey: resetKey,
            csrfToken: csrfToken
        })

        return
    }

    // Check if the user's new password and the confirmed password fields match
    let passwordsMatch = await registration_form_validation.checkPasswordMatch(newPassword, confirmNewPassword)

    // If the user's new password and the confirmed password fields do not match, then render the reset password page
    // with an error message
    if (!passwordsMatch) {
        res.render("reset_password", {
            layout: undefined, 
            errorMessage: "Passwords do not match.",
            resetKey: resetKey,
            csrfToken: csrfToken
        })

        return
    }

    let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

    if (!compareResult){
        await csrf_protection.cancelToken(sessionID)
        res.render("reset_password", {
            layout: undefined, 
            errorMessage: "CSRF token mismatch, approval process rejected",
            resetKey: resetKey,
            csrfToken: csrfToken
        })

        return
    }   

    // Pass the new password and reset key to the password reset sub-layer to update the user's password in the database
    // and set a flash message telling the user that the password has been reset successfully
    await passwordReset.setNewPassword(resetKey, newPassword)
    await flash_messages.setFlash(userSession.sessionID, "Password reset successfully.")

    await csrf_protection.cancelToken(sessionID)
    // Redirect to the login page
    res.redirect("/login")
})


app.get("/change-profile-details", async (req, res) => {
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

    let userAccount = await change_profile_details.findUserAccount(userSession.sessionData.username)
    
    let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)

    res.render("change_profile_details", {
        layout: undefined,
        userAccount: userAccount,
        oldUsername: userSession.sessionData.username,
        csrfToken: csrfToken
    })
})


app.post("/change-profile-details", async (req, res) => {
    let csrfToken = req.body.csrf
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

    let userAccount = await change_profile_details.findUserAccount(userSession.sessionData.username)

    // Get the user's new firstname, lastname, email, username, password, and password confirmation inputs from the form fields
    let firstnameInput = req.body.firstnameInput
    let lastnameInput = req.body.lastnameInput
    let emailInput = req.body.emailInput
    let usernameInput = req.body.usernameInput
    let passwordInput = req.body.passwordInput
    let repeatPasswordInput = req.body.repeatPasswordInput

    let modifiedUserDetails = {
        firstname: "",
        lastname: "",
        email: "",
        username: "",
        password: "",
        role: userAccount.userDetails.role
    }

    if (firstnameInput !== userAccount.userDetails.firstname || lastnameInput !== userAccount.userDetails.lastname) {
        // Before letter validation, Remove any leading or trailing whitespaces from firstname and lastname
        firstnameInput = firstnameInput.trim()
        lastnameInput = lastnameInput.trim()

        // Validate if firstname and lastname consist of letters only
        let firstnameLastnameValidated = await registration_form_validation.validateFirstnameLastname(firstnameInput, lastnameInput)

        //If firstname or lastname does not consist of letters only
        if (!firstnameLastnameValidated){
            return res.render("change_profile_details", { 
                layout: undefined, 
                errorMessage: "Firstname and lastname must contain letters only", 
                // Pass all form inputs back to the template for repopulating the form, and display error message
                emailInput: emailInput,
                usernameInput: usernameInput,
                passwordInput: passwordInput,
                repeatPasswordInput: repeatPasswordInput,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        // After letter validation, remove all whitespaces in between the letters from firstname and lastname
        firstnameInput = firstnameInput.replace(/\s+/g, "")
        lastnameInput = lastnameInput.replace(/\s+/g, "")

        if (firstnameLastnameValidated){
            modifiedUserDetails.firstname = firstnameInput
            modifiedUserDetails.lastname = lastnameInput
        }
    }

    if (passwordInput || repeatPasswordInput){
        // Check if the user-inputted passwords match
        let passwordsMatch = await registration_form_validation.checkPasswordMatch(passwordInput, repeatPasswordInput)

        //If passwords do not match
        if (!passwordsMatch) {
            return res.render("change_profile_details", { 
                layout: undefined, 
                errorMessage: "Passwords do not match", 
                // Pass all form inputs back to the template for repopulating the form, except password and repeated password,
                // and display error message
                firstnameInput: firstnameInput,
                lastnameInput: lastnameInput,
                emailInput: emailInput,
                usernameInput: usernameInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        //Before validation, remove all whitespaces from the user password
        passwordInput = passwordInput.replace(/\s+/g, "")

        // Validate if user password length is 8 characters or more, and contains at least one uppercase, lowercase, digit, 
        // and special character
        let passwordComplexityValidated = await registration_form_validation.validatePasswordComplexity(passwordInput)

        //If user password does not meet password complexity requirements
        if (!passwordComplexityValidated) {
            return res.render("change_profile_details", { 
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
                usernameInput: usernameInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        if (passwordsMatch && passwordComplexityValidated){
            modifiedUserDetails.password = passwordInput
            
        }
    }

    if (usernameInput !== userAccount.userDetails.username) {
        //Before username validation, remove any leading or trailing whitespaces from username
        usernameInput = usernameInput.trim()

        //Check that username starts with an alphabetic character, does not contain spaces or “@”, is between 6 and 30 
        // characters (both inclusive), and contains only valid Unix Characters (uppercase and lowercase letters, numbers, 
        // “-”, “.”, and “_”
        let usernameValidated = await registration_form_validation.validateUsername(usernameInput)

        //If username does not meet criteria
        if (!usernameValidated){
            return res.render("change_profile_details", { 
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
                repeatPasswordInput: repeatPasswordInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        //Check if the user-inputted username already exists in the database
        let usernameExists = await registration_form_validation.checkUsernameExists(usernameInput)

        //If username exits in database
        if (usernameExists){
            return res.render("change_profile_details", { 
                layout: undefined, 
                errorMessage: "Username already taken", 
                // Pass all form inputs back to the template for repopulating the form, except for the username, 
                // and display error message
                firstnameInput: firstnameInput,
                lastnameInput: lastnameInput,
                emailInput: emailInput,
                passwordInput: passwordInput,
                repeatPasswordInput: repeatPasswordInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        if (usernameValidated && !usernameExists){
            modifiedUserDetails.username = usernameInput
        }
    }

    if (emailInput !== userAccount.userDetails.email) {
        //Validates the email format of user-inputted email
        let emailValidated = await registration_form_validation.validateEmail(emailInput)
        console.log(emailValidated)

        //If email does not meet criteria
        if (!emailValidated){
            return res.render("change_profile_details", { 
                layout: undefined, 
                errorMessage: "Invalid email format", 
                // Pass all form inputs back to the template for repopulating the form, except for the email, and display 
                // error message
                firstnameInput: firstnameInput,
                lastnameInput: lastnameInput,
                usernameInput: usernameInput,
                passwordInput: passwordInput,
                repeatPasswordInput: repeatPasswordInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        //Check if the user-inputted email already exists in the database
        let emailExists = await registration_form_validation.checkEmailExists(emailInput)

        //If email exists in database
        if (emailExists){
            return res.render("change_profile_details", { 
                layout: undefined, 
                errorMessage: "Email already taken", 
                // Pass all form inputs back to the template for repopulating the form, except for the email, 
                // and display error message
                firstnameInput: firstnameInput,
                lastnameInput: lastnameInput,
                usernameInput: usernameInput,
                passwordInput: passwordInput,
                repeatPasswordInput: repeatPasswordInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }

        if (emailValidated && !emailExists){
            modifiedUserDetails.email = emailInput
        }
    }
        let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

        if (!compareResult){
            await csrf_protection.cancelToken(sessionID)
            return res.render("change_profile_details", { 
                layout: undefined, 
                errorMessage: "CSRF token mismatch, approval process rejected", 
                // Pass all form inputs back to the template for repopulating the form, except for the email, 
                // and display error message
                firstnameInput: firstnameInput,
                lastnameInput: lastnameInput,
                usernameInput: usernameInput,
                passwordInput: passwordInput,
                repeatPasswordInput: repeatPasswordInput,
                userAccount: userAccount,
                oldUsername: userSession.sessionData.username,
                csrfToken: csrfToken
            })
        }   
    
    await change_profile_details.fillInExistingValues(modifiedUserDetails, userSession.sessionData.username)
    await change_profile_details.updateUserDetailsByID(modifiedUserDetails, userAccount._id, userSession.sessionData.username)

    userSession.sessionData.username = modifiedUserDetails.username
    await session_management.updateSession(sessionID, userSession)

    if (userSession.sessionData.role === "member"){
        await csrf_protection.cancelToken(sessionID)
        res.render("updated_profile_details_alert", {
            layout: undefined,
            userIsMember: true
        })
    } else if (userSession.sessionData.role === "admin"){
        await csrf_protection.cancelToken(sessionID)
        res.render("updated_profile_details_alert", {
            layout: undefined,
            userIsAdmin: true
        })
    }
})


app.get('/posts', async (req, res) => {
    const dbPosts = await posts.getPosts()
    const fixed_locations = await location.getlocations()

    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)
    let csrfToken = await csrf_protection.generateCSRFFormToken(sessionID)

    if ((sessionID && userSession) && (userSession.sessionData.role === "admin")) {

        res.render("posts", {
            layout: undefined,
            userIsAdmin: true,
            locations: dbPosts,
            fixedlocations: fixed_locations,
            csrfToken
        })

        return
    }

    if((sessionID && userSession) && (userSession.sessionData.role === "member")){
        res.render("posts", {
            layout: undefined,
            userIsMember: true,
            locations: dbPosts,
            fixedlocations: fixed_locations,
            csrfToken
        })

        return
    }
    res.render("posts", {
        layout: undefined,
        locations: dbPosts,
        fixedlocations: fixed_locations,
        csrfToken
    })

})


app.post('/posts', async (req, res) => {
    let csrfToken = req.body.csrf
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
    
    if ((sessionID && userSession) && (userSession.sessionData.role !== "member" && userSession.sessionData.role !== "admin")) {
        await flash_messages.setFlash(userSession.sessionID, "You must be signed in to be able to post.")
        res.redirect("/login")
        return
    }

    let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

    if (!compareResult){
        await csrf_protection.cancelToken(sessionID)
        await flash_messages.setFlash(userSession.sessionID, "CSRF token mismatch, approval process rejected")
        res.redirect("/login")
        return
    }   
    

    if(req.files && req.files.submission){

        let theFile = req.files.submission;
        let timestamp = Date.now();
        let fileName = `${timestamp}_${req.files.submission.name}`;
        await theFile.mv(`${__dirname}/uploads/${fileName}`)

        let userInput = {
            username: userSession.sessionData.username,
            name: req.body.location_name,
            text_post: req.body.text_post,
            food_level: req.body.food_level,
            water_level: req.body.water_level,
            cat_number: req.body.number_of_cats, // Assuming this should be a number
            health_issue: req.body.health_issue,
            critical_item: {
                letterbox: req.body.letterbox === 'true',
                food_bowl: req.body.food_bowl === 'true',
                water_bowl: req.body.water_bowl === 'true'
            },
            file_path: fileName
        }

        await posts.updateLocations(req.body.location_name, userInput)
        await posts.insertPost(userInput)
        await csrf_protection.cancelToken(sessionID)
        res.redirect('/posts')

    }else{
        let userInput = {
            username: userSession.sessionData.username,
            name: req.body.location_name,
            text_post: req.body.text_post,
            food_level: req.body.food_level,
            water_level: req.body.water_level,
            cat_number: req.body.number_of_cats, // Assuming this should be a number
            health_issue: req.body.health_issue,
            critical_item: {
                letterbox: req.body.letterbox === 'true',
                food_bowl: req.body.food_bowl === 'true',
                water_bowl: req.body.water_bowl === 'true'
            }
        };

        await posts.updateLocations(req.body.location_name, userInput)
        await posts.insertPost(userInput)
        await csrf_protection.cancelToken(sessionID)
        res.redirect('/posts')
    }
})

app.get('/logout', async (req, res) => {
    // Retrieve the current user's session ID from the cookie value, then check if the user's current sessionID 
    // corresponds to an existing user session in the database
    let sessionID = req.cookies.sessionID
    let userSession = await session_management.getSession(sessionID)

    // If the user session in the database does not exist, or the browser cookie does not exist, then clear the browser
    // cookie
    if (!userSession || !sessionID) {
        res.clearCookie("sessionID")
    }

    // If the browser cookie exists, and the user session in the database exists as well, then delete the user session 
    // from the database, and clear the browser cookie
    if (sessionID && userSession) {
        await session_management.deleteSession(sessionID)
        res.clearCookie("sessionID")
    }

    // Render the user_logout_alert template which displays the logout message to confirm that the user has logged out of 
    // his account successfully, and redirects the user to the landing page
    res.render("user_logout_alert", {
        layout: undefined
    })
})

async function error404(req, res){
    // Render the 404 page if the user tries to access a route that does not exist
    res.status(404).render("404", {
        layout: undefined
    })
}

// Middleware for handling 404 errors (page not found) 
app.use(error404)

// Start the Express application on port 8000 
app.listen(8000, () => {
    console.log("Application started on port 8000")
})