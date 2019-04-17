"use strict";

const express = require("express");
const users = express.Router();
const utilities = require("../../globals/utilities");
const middleware = require("../../globals/middleware");
const verifyJWT = middleware.verifyJWT;
// Force "Accept: application/json" header
const acceptJSON = middleware.acceptJSON;
// Force "Content-Type: application/json" header
const contentTypeJSON = middleware.contentTypeJSON;

// CONTROLLER ------------------------------------------------------------------
const usersControllers = require("./usersControllers");

// USERS CRUD ROUTES -----------------------------------------------------------

// Return first, last, email, id, and self link for all users (protected).
// Access: Open to any user with valid JWT.
users.get("/", verifyJWT, acceptJSON, usersControllers.getAllUsers);

// Return first, last, email, id, and self link for single user by ID 
// (protected).
// Access: Open to any user with valid JWT.
users.get("/:id", verifyJWT, acceptJSON, usersControllers.getUser);

// Add new user (NOT protected).
// Access: No JWT needed-- anyone should be able to add a user.
users.post("/", contentTypeJSON, usersControllers.createUser);

// Update user (protected).
// Access: Restricted to user being updated.
users.patch("/:id", verifyJWT, contentTypeJSON, usersControllers.updateUser);

// Delete user (protected).
// Access: Restricted to user being deleted.
users.delete("/:id", verifyJWT, usersControllers.deleteUser);


// USER PROPERTY ROUTES --------------------------------------------------------

// Return user's envelopes (protected).
// Access: Open to any user with valid JWT.
users.get("/:id/envelopes", verifyJWT, acceptJSON, 
	usersControllers.getUsersEnvelopes);

// Return user's expenses (protected).
// Access: Open to any user with valid JWT.
users.get("/:id/expenses", verifyJWT, acceptJSON,
	usersControllers.getUsersExpenses);


// There are no routes for adding/deleting envelopes or expenses to a user
// because the relationship is assigned at the point of resource creation and
// is immutable. For instance, when a user creates an envelope, it belongs to
// that user forever until it is deleted. Envelopes and expenses are not 
// permitted to exist without an owner.

module.exports = users;