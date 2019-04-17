"use strict";

const bcrypt = require("bcrypt");
const models = require("../../models/datastoreModels");
const constants = require("../../configs/constants");
const utilities = require("../../globals/utilities");
const schemas = require("./schemas");

exports.getAllUsers = async function(req, res, next) {
	// Return collection of user info limited to email, first, last, id, 
	// and self (i.e. exclude password).
	const limitResultsTo = ["email", "first", "last"];
	try {
		let [ allUsers, totalCount ] = await Promise.all([
			models.getAllOfKind_paginated(constants.USER, req, limitResultsTo),
			models.getCountOfKind(constants.USER, req)]);
		allUsers.count = totalCount;
		return res.status(200).json(allUsers);
	}
	catch (err) {
		return next(err);
	}
} 

exports.getUser = async function (req, res, next) {
	// Return user info limited to email, first, last, id, and self. (i.e. 
	// exclude password).
	try {
		const limitResultsTo = ["email", "first", "last"];
		let user = await models.getOneOfKind(constants.USER, req.params.id, req,
			limitResultsTo);
		return res.status(200).json(user);
	}
	catch (err) {
		return next(err);
	}
};

exports.createUser = async function (req, res, next) {
	// (1) Validate that request body matches addUser schema.
	try {
		await utilities.validate(req.body, schemas.addUser);
	}
	catch (err) {
		return next(err);
	}

	let data = Object.assign({}, req.body);

	// (2) Confirm email is not already in system.
	const limitResultsTo = ["__key__"];	
	let existingUsers = await models.getSomeByValue(constants.USER, "email", 
		data.email, req, limitResultsTo);
	if (existingUsers.length > 0) {
		let err = new Error("Another user already exists with that email.");
		err.status = 400;
		return next(err);
	}

	// (3) Hash password for storage.
	// bcrypt provides hash and salt as one combined "hash"; only need to store
	// one thing for pw in datastore.
	try {
		let hash = await bcrypt.hash(data.password, constants.SALT_ROUNDS);
		data.password = hash;
	}
	catch (err) {
		return next(err);
	}

	// (4) Create user.
	let key;
	try {
		key = await models.addEntity(constants.USER, data);
	}
	catch (err) {
		return next(err);
	}

	// (5) Return id and location of newly-created resource.
	data.id = key.id;
	data = utilities.appendSelf(req, data);
	res.location(data.self);
	return res.status(201).json({ id: data.id });
};

exports.updateUser = async function (req, res, next) {
	// (1) Verify that the token id matches the user queried
	if (req.user.id != req.params.id) {
		let err = new Error("You are not authorized to make changes to this user.");
		err.status = 403;
		return next(err);
	}

	// (2) Validate that request body matches updateUser schema.
	try {
		await utilities.validate(req.body, schemas.updateUser);
	}
	catch (err) {
		return next(err);
	}

	// (3) Get existing data from datastore; if user doesn't exist, error.
	let data;
	try {
		data = await models.getOneOfKind(constants.USER, req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	// (4) Update data as needed with request body.
	data.first = req.body.first || data.first;
	data.last = req.body.last || data.last;
	if (req.body.email && (req.body.email != data.email)) {
		// Confirm new email doesn't already belong to someone else.
		const limitResultsTo = ["__key__"];	
		let existingUsers = await models.getSomeByValue(constants.USER, "email", 
			data.email, req, limitResultsTo);
		if (existingUsers.length > 0) {
			let err = new Error("Another user already exists with that email.");
			err.status = 400;
			return next(err);
		}
		data.email = req.body.email;
	}
	if (req.body.password) {
		try {
			let hash = await bcrypt.hash(req.body.password, constants.SALT_ROUNDS);
			data.password = hash;
		}
		catch (err) {
			return next(err);
		}
	}
	try {
		let key = await models.updateEntity(constants.USER, req.params.id, data);
	}
	catch (err) {
		return next(err);
	}

	// (5) Return location of updated resource in Location header.
	res.location(data.self);
	return res.status(303).end();
};

exports.deleteUser = async function (req, res, next) {
	// (1) Verify that the token id matches the user queried
	if (req.user.id != req.params.id) {
		let err = new Error("You are not authorized to make changes to this user.");
		err.status = 403;
		return next(err);
	}

	// (2) Fetch all of this user's property.
	let usersExpenses, usersEnvelopes;
	try {
		[ usersExpenses, usersEnvelopes ] = await Promise.all([
			models.getSomeByValue(constants.EXPENSE, "owner", req.user.id, req),
			models.getSomeByValue(constants.ENVELOPE, "owner", req.user.id, req)]);
	}
	catch (err) {
		return next(err);
	}

	// (3) Delete user's property
	let deletedExpenses, deletedEnvelopes;
	try {
		[ deletedExpenses, deletedEnvelopes ] = await Promise.all([
			models.deleteBatch(constants.EXPENSE, usersExpenses),
			models.deleteBatch(constants.ENVELOPE, usersEnvelopes)]);
	}
	catch (err) {
		return next(err);
	}

	// (4) Delete record for user.
	try{
		await models.deleteEntity(constants.USER, req.params.id);
	}
	catch (err) {
		return next(err);
	}
	return res.status(204).end();
};

exports.getUsersExpenses = async function (req, res, next) {
	// Return collection of all expenses with owner == req.params.id.
	let allExpenses = {
		items: [],
		count: 0
	};
	try {
		allExpenses.items = await models.getSomeByValue(constants.EXPENSE, 
			"owner", req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	allExpenses.count = allExpenses.items.length;

	allExpenses.items.map(eachExpense => {
		if (eachExpense.envelope) {
			eachExpense = utilities.expandEnvelope(req, eachExpense);
		}
		return utilities.expandOwner(req, eachExpense);
	});

	return res.status(200).json(allExpenses);
};

exports.getUsersEnvelopes = async function (req, res, next) {
	// Return collection of all envelopes with owner == req.params.id.
	let allEnvelopes = {
		items: [],
		count: 0
	};
	try {
		allEnvelopes.items = await models.getSomeByValue(constants.ENVELOPE,
			"owner", req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	allEnvelopes.count = allEnvelopes.items.length;

	let results = allEnvelopes.items.map(async (eachEnvelope) => {
		eachEnvelope = utilities.expandOwner(req, eachEnvelope);
		return await utilities.expandExpenses(req, eachEnvelope);
	});
	allEnvelopes.items = await(Promise.all(results));

	return res.status(200).json(allEnvelopes);
};