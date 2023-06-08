const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const {User} = require('../models/model.js');
const { validateUserCredentials } = require('../middleware/userCheck.js');
const jwt = require('jsonwebtoken');


const auth = express.Router();


const defaultUser = {
    username: 'admin',
    password: 'password123'
};

auth.post("/login",validateUserCredentials,async (req, res) => {
    const { username, password } = req.body;
    // Check if the provided username and password match the default user
    if (username === defaultUser.username && password === defaultUser.password) {
        // Generate a JWT token
        const userData =await User.findOne({username:username})
        const token = jwt.sign({ id:userData._id }, 'secretKey');
        console.log(userData)
        // Send the token as the response
        return res.json({ token });
    }
    // If the username and password don't match, return an error
    return res.status(401).json({ message: 'Invalid credentials' });
});

// Route for user sign up
auth.post('/signup', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const { username, password } = req.body;

  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Respond with the created user
    res.json(savedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = auth;
