### INFS3201 Project
This website allows you to monitor feeding stations around Qatar for stray cats
A project for the INFS3201 course in "UDST" inspired by Task8 from the Genius Group Winter 24 competition.
It is built using ExpressJS.

# Frameworks
The following packages were used in this project:
- express
- express-handlebars
- handlebars
- body-parser
- cookie-parser
- mongodb
- crypto
- password-validator

## Installation
1. Clone the repo:
```bash
git clone https://github.com/Khalid-60100381/Web-II-Project.git
```

2. Install dependencies (if any):
```bash
npm install
```

## Usage
Our application uses MongoDB to store and manage data efficiently. Check the ```persistence.js``` file for connection credentials

Visit the site using localhost on port 8000:
```http://127.0.0.1:8000/```

# Test Accounts info:

# Admin:
> **User**: `admin`
> **Password**: `Admin@123` 

# Member:
> **User:** `member`  
> **Password:** `Member@123`

## Features
# Milestone Submission (24/03/2024):
- A public viewers page that dynamically loads the list of locations from the database
- A map the also shows the locations as markers, also loaded from the database.
- Session management system, keeps tracks of the user current state.
- Route protection implented in the session management to prevent public viewers from accessing pages that require login.
- Preventing members from routing to admin pages.
- Session validation for all routes.
- Registration form validation.
- Hashing user passwords.
- Error 404 Page.

## Credits
Almabrouk Ben-Omran - 60104920
Khalid Kadoura - 60100381
Mohammad Shallah - 60106887

# Note
Not all commits were made on the main branch. Check the other branch ```mohammad60106887``` to see all commits made

## Acknowledgements
- [MongoDB](https://www.mongodb.com/) for data storage.
- [OpenMaps API](https://www.openmaps.com/) for providing the map data used in this project.
- [CoreUI](https://coreui.io/) for the responsive UI framework that enhances the user experience.