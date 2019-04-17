"use strict";

const express = require("express");
const auth = express.Router();
const middleware = require("../../globals/middleware");
// Force "Content-Type: application/json" header
const contentTypeJSON = middleware.contentTypeJSON;

// CONTROLLER ------------------------------------------------------------------
const authControllers = require("./authControllers");

// AUTH ROUTES -----------------------------------------------------------------

// Submit user credentials in exchange for JWT (not protected).
// Access: No JWT needed.
auth.post("/", contentTypeJSON, authControllers.login);


module.exports = auth;