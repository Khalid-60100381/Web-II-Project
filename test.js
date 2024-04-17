// "CSRF token mismatch, approval process rejected"

// let compareResult = await csrf_protection.compareToken(csrfToken,sessionID)

// if (!compareResult){
//     return res.render("register", { 
//         layout: undefined, 
//         errorMessage: "Email already taken", 
//         // Pass all form inputs back to the template for repopulating the form, except for the email, 
//         // and display error message
//         firstnameInput: firstnameInput,
//         lastnameInput: lastnameInput,
//         usernameInput: usernameInput,
//         passwordInput: passwordInput,
//         repeatPasswordInput: repeatPasswordInput,
//         csrfToken: csrfToken
//     })
// }   

// <input type="hidden" name="csrf" value="{{csrfToken}}"></input>
// await csrf_protection.cancelToken(sessionID)