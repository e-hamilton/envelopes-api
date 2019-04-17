const Joi = require("joi");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const ds = require("../configs/datastore");
const Datastore = ds.Datastore;
const constants = require("../configs/constants");
const models = require("../models/datastoreModels");

const keypath = {
	public: path.join(__dirname, "../configs/public.KEY"),
	private: path.join(__dirname, "../configs/private.KEY")
};

const key = {
	public: fs.readFileSync(keypath.public, "utf8"),
	private: fs.readFileSync(keypath.private, "utf8")
};

// RESOURCE FORMATTING ---------------------------------------------------------

// Appends datastore id to data object.
exports.appendId = function (data) {
	data.id = data[Datastore.KEY].id;
	return data;
};

// Appends location of resource to data object.
exports.appendSelf = function (req, data) {
	id = req.params.id || data.id;
	data.self = `${req.protocol}://${req.get("host")}${req.baseUrl}/${id}`;
	return data;
};

// Wrapper for both appendId() and appendSelf().
exports.appendIdAndSelf = function (req, data) {
	return exports.appendSelf(req, exports.appendId(data));
};

// data.owner is initially just the resource owner's datastore id. This function
// expands that into an object with the attributes id and self.
exports.expandOwner = function (req, data) {
	let ownerId = data.owner;
	data.owner = {
		id: ownerId,
		self: `${req.protocol}://${req.get("host")}/users/${ownerId}`
	};
	return data;
};

// data.envelope is initially just the expense's envelope's datastore id. This 
// function expands that into an object with the attributes id and self.
exports.expandEnvelope = function (req, data) {
	let envelopeId = data.envelope;
	data.envelope = {
		id: envelopeId,
		self: `${req.protocol}://${req.get("host")}/envelopes/${envelopeId}`
	}
	return data;
};

// Fetches all expenses belonging to an envelope (data) and appends each one as
// an object of the format { id: ..., self: ... }. data.expenses is set to an 
// array of these objects if expenses are found; otherwise, data.expenses is set
// to null. Sets data.amountReserved, data.expenseCount, and data.amountFree
// based on the expenses retrieved.
exports.expandExpenses = async function (req, data) {
	let envelopeExpenses = await models.getSomeByValue(constants.EXPENSE, 
		"envelope", data.id, req);
	data.expenses = [];
	data.amountReserved = 0;
	envelopeExpenses.forEach(expense => {
		data.expenses.push({
			"id": expense.id,
			"self": `${req.protocol}://${req.get("host")}/expenses/${expense.id}`
		});
		data.amountReserved += expense.cost;
	});

	if (data.expenses.length > 0) {
		data.expenseCount = data.expenses.length;
	}
	else {
		data.expenses = null;
		data.expenseCount = 0;
	}

	data.amountFree = data.totalAmount - data.amountReserved;
	return data;
};

// INPUT VALIDATION ------------------------------------------------------------

// Validates a request body against a Joi schema. Returns a 400 error if the
// body is invalid.
exports.validate = async function (body, schema) {
	try {
		await Joi.validate(body, schema);
	}
	catch (err) {
		// Clean punctuation in error message and throw error.
		let message = err.details[0].message.replace(/[^\w\s]/g, "");
		let e = new Error(message);
		e.status = 400;
		throw e;
	}
};

// AUTHORIZATION/AUTHENTICATION ------------------------------------------------

// Signs a new JWT based on the JWT settings in configs/constants.js.
exports.getJWT = function (user) {
	const payload = { id: user.id };
	const secret = key.private;
	const options = {
		issuer: constants.JWT.ISS,
		subject: user.email,
		audience: constants.JWT.AUD,
		expiresIn: constants.JWT.EXP,
		algorithm: constants.JWT.ALG
	}
	return jwt.sign(payload, secret, options);
};