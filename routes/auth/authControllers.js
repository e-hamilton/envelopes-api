"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const utilities = require("../../globals/utilities");
const models = require("../../models/datastoreModels");
const constants = require("../../configs/constants");
const schemas = require("./schemas");

exports.login = async function (req, res, next) {
	// (1) Check req.body against login schema
	try {
		await utilities.validate(req.body, schemas.userCreds);
	}
	catch (err) {
		return next(err);
	}

	// (2) Authenticate user by email+password match
	let email = req.body.email;
	let password = req.body.password;
	let results;
	try {
		results = await models.getSomeByValue(constants.USER, "email", email, req);
	}
	catch (err) {
		return next(err);
	}

	// Error message vague on purpose-- should not expose if email, password, or 
	// both were incorrect.
	const emailError = "Invalid email or password."

	if (results.length < 1) {
		let err = new Error(emailError);
		err.status = 401;
		return next(err);
	}

	let user = results[0];
	let hash = await bcrypt.hash(password, constants.SALT_ROUNDS);

	let match = await bcrypt.compare(password, user.password);

	if (!match) {
		let err = new Error(emailError);
		err.status = 401;
		return next(err);
	}

	// (3) Return JWT
	let tok = utilities.getJWT(user);
	return res.status(200).json({ type: "x-access-token", token: tok });
};