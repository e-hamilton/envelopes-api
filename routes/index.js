"use strict";

const express = require("express");
const routes = express.Router();
const path = require("path");

// ROUTES ----------------------------------------------------------------------

const auth = require("./auth");
routes.use("/auth", auth);

const users = require("./users");
routes.use("/users", users);

const envelopes = require("./envelopes");
routes.use("/envelopes", envelopes);

const expenses = require("./expenses");
routes.use("/expenses", expenses);


// ROOT ------------------------------------------------------------------------
routes.get("/", (req, res, next) => {
	let file = path.join(appRoot + "/views/doc.html");
	return res.status(200).sendFile(file);
});

// Serve OAS spec file-- ReDoc can't locate file by path (requires URL) per:
// https://github.com/Rebilly/ReDoc/issues/149
routes.get("/oas3", (req, res, next) => {
	let file = path.join(appRoot + "/openapi.yaml");
	return res.status(200).sendFile(file);
});

module.exports = routes;