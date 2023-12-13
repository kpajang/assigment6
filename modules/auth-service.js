const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,  // Note: Store hashed passwords for security
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }]
});

let User; // Will be defined upon successful database connection

function initialize() {
  return new Promise((resolve, reject) => {
    // Ensure MONGODB_URI is read correctly from .env file
    const dbUri = process.env.MONGODB_URI; 
    if (!dbUri) {
      return reject(new Error("MongoDB connection string is not set in .env file."));
    }

    let db = mongoose.createConnection(dbUri);

    db.on('error', (err) => {
      reject(err);
    });

    db.once('open', () => {
      User = db.model("User", userSchema);  // Changed "users" to "User" for model name
      resolve();
    });
  });
}
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            return reject("Passwords do not match");
        }

        bcrypt.hash(userData.password, 10)
            .then(hash => {
                let newUser = new User({
                    userName: userData.userName,
                    password: hash, // store the hashed password
                    email: userData.email,
                    loginHistory: []
                });

                newUser.save()
                    .then(() => resolve("User registered successfully"))
                    .catch(err => {
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject("There was an error creating the user: " + err);
                        }
                    });
            })
            .catch(err => reject("There was an error encrypting the password: " + err));
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then(user => {
                if (!user) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    // Compare hashed password from DB with the provided password
                    bcrypt.compare(userData.password, user.password)
                        .then(isMatch => {
                            if (!isMatch) {
                                reject("Incorrect Password for user: " + userData.userName);
                            } else {
                                // Update login history
                                if (user.loginHistory.length >= 8) {
                                    user.loginHistory.pop(); // Remove the oldest entry
                                }
                                user.loginHistory.unshift({
                                    dateTime: new Date(),
                                    userAgent: userData.userAgent
                                });

                                User.updateOne({ userName: userData.userName }, { $set: { loginHistory: user.loginHistory } })
                                    .then(() => resolve(user))
                                    .catch(err => reject("There was an error verifying the user: " + err));
                            }
                        })
                        .catch(err => reject("Error during password comparison: " + err));
                }
            })
            .catch(err => reject("Unable to find user: " + userData.userName));
    });
}

  module.exports = {
    initialize,
    registerUser,
    checkUser,


    // ... other functions
  };