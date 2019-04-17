"use strict";

const models = require("../../models/datastoreModels");
const constants = require("../../configs/constants");
const utilities = require("../../globals/utilities");
const schemas = require("./schemas");

exports.getAllEnvelopes = async function (req, res, next) {
	// Return collection of all envelopes.
	let allEnvelopes, totalCount;
	try {
		[ allEnvelopes, totalCount ] = await Promise.all([
			models.getAllOfKind_paginated(constants.ENVELOPE, req),
			models.getCountOfKind(constants.ENVELOPE, req)]);
	}
	catch (err) {
		return next(err);
	}

	allEnvelopes.count = totalCount;

	let results = allEnvelopes.items.map(async (envelope) => { 
		envelope = utilities.expandOwner(req, envelope); 
		envelope = await utilities.expandExpenses(req, envelope);
		return envelope;
	});
	allEnvelopes.items = await(Promise.all(results));

	return res.status(200).json(allEnvelopes);
};

exports.getEnvelope = async function (req, res, next) {
	// Return envelope info.
	try {
		let envelope = await models.getOneOfKind(constants.ENVELOPE, 
			req.params.id, req);
		envelope = utilities.expandOwner(req, envelope);
		envelope = await utilities.expandExpenses(req, envelope);
		
		return res.status(200).json(envelope);
	}
	catch (err) {
		return next(err);
	}
};

exports.createEnvelope = async function (req, res, next) {
	// (1) Validate that request body matches addEnvelope schema.
	try {
		await utilities.validate(req.body, schemas.addEnvelope);
	}
	catch (err) {
		return next(err);
	}

	let data = Object.assign({}, req.body);
	data.totalAmount = parseFloat(req.body.totalAmount);
	data.owner = req.user.id;

	// (2) Create envelope.
	let key;
	try {
		key = await models.addEntity(constants.ENVELOPE, data);
	}
	catch (err) {
		return next(err);
	}

	// (3) Return id and location of newly-created resource.
	data.id = key.id;
	data = utilities.appendSelf(req, data);
	res.location(data.self);
	return res.status(201).json({ id: data.id });
};

exports.updateEnvelope = async function (req, res, next) {
	// (1) Validate that request body matches updateEnvelope schema.
	try {
		await utilities.validate(req.body, schemas.updateEnvelope);
	}
	catch (err) {
		return next(err);
	}

	// (2) Get existing data from datastore; if envelope doesn't exist, error.
	let data;
	try {
		data = await models.getOneOfKind(constants.ENVELOPE, req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	// (3) Check authorization to update
	if (req.user.id != data.owner) {
		let msg = "You are not authorized to make changes to this envelope.";
		let err = new Error(msg);
		err.status = 403;
		return next(err);
	}

	// (4) Update data as needed with request body.
	data.name = req.body.name || data.name;
	data.totalAmount = parseFloat(req.body.totalAmount || data.totalAmount);

	try {
		let key = await models.updateEntity(constants.ENVELOPE, req.params.id, 
			data);
	}
	catch (err) {
		return next(err);
	}

	// (5) Return location of updated resource in Location header.
	res.location(data.self);
	return res.status(303).end();
};

exports.deleteEnvelope = async function (req, res, next) {
	// (1) Get existing data from datastore; if envelope doesn't exist, error.
	let data;
	try {
		data = await models.getOneOfKind(constants.ENVELOPE, req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	// (2) Check authorization to delete.
	if (req.user.id != data.owner) {
		let msg = "You are not authorized to make changes to this envelope.";
		let err = new Error(msg);
		err.status = 403;
		return next(err);
	}

	// (3) Get envelope's expenses. If it has any, update each expense to have
	// expense.envelope=null.
	// To-do: Once relationship is implemented...
	try {
		let envExpenses = await models.getSomeByValue(constants.EXPENSE, 
			"envelope", data.id, req);
		let results = envExpenses.map(async (expense) => {
			expense.envelope = null;
			return await models.updateEntity(constants.EXPENSE, expense.id, 
				expense);
		});
		await(Promise.all(results));
	}
	catch (err) {
		return next(err);
	}

	// (4) Delete record for user.
	try{
		await models.deleteEntity(constants.ENVELOPE, req.params.id);
	}
	catch (err) {
		return next(err);
	}
	return res.status(204).end();
};


// ENVELOPE-EXPENSES RELATIONSHIP ----------------------------------------------

exports.addExpenseToEnv = async function (req, res, next) {
	// (1) Fetch envelope and expense from req params
	let envelope, expense;
	try {
		[ envelope, expense ] = await Promise.all([
			models.getOneOfKind(constants.ENVELOPE, req.params.envelopeId, req),
			models.getOneOfKind(constants.EXPENSE, req.params.expenseId, req)]);
	}
	catch (err) {
		return next(err);
	}

	// (2) Verify user owns both resources.
	if ((req.user.id != envelope.owner) || (req.user.id != expense.owner)) {
		let msg = "You are not authorized to modify one or both of these " +
			"resources.";
		let err = new Error(msg);
		err.status = 403;
		return next(err);
	}

	// (3) Update expense
	expense.envelope = envelope.id;
	
	try {
		let key = await models.updateEntity(constants.EXPENSE, expense.id, 
			expense);
	}
	catch (err) {
		next(err);
	}

	// (4) Return location of collection of envelope's expenses in res location
	// header.
	let url = `${req.protocol}://${req.get("host")}/envelopes/${envelope.id}` + 
		`/expenses`;
	res.location(url);
	return res.status(303).end();
};

exports.getExpensesInEnv = async function (req, res, next) {
	// (1) Return collection of expenses in given envelope
	let collection = {};
	let items;
	try {
		items = await models.getSomeByValue(constants.EXPENSE, "envelope", 
			req.params.envelopeId, req);
	}
	catch (err) {
		return next(err);
	}
	
	collection.items = items.map((eachExpense) => { 
		if (eachExpense.envelope) {
			eachExpense = utilities.expandEnvelope(req, eachExpense);
		}
		return utilities.expandOwner(req, eachExpense); 
	});

	collection.count = collection.items.length;

	res.status(200).json(collection);
};

exports.removeExpenseFromEnv = async function (req, res, next) {
	// (1) Fetch envelope and expense based on req params
	let envelope, expense;
	try {
		[ envelope, expense ] = await Promise.all([
			models.getOneOfKind(constants.ENVELOPE, req.params.envelopeId, req),
			models.getOneOfKind(constants.EXPENSE, req.params.expenseId, req)]);
	}
	catch (err) {
		return next(err);
	}

	// (2) Verify user owns both resources.
	if ((req.user.id != envelope.owner) || (req.user.id != expense.owner)) {
		let msg = "You are not authorized to modify one or both of these " +
			"resources.";
		let err = new Error(msg);
		err.status = 403;
		return next(err);
	}

	// (3) Update expense if expense truly lists the envelope as its envelope.
	if (expense.envelope != envelope.id) {
		let err = new Error(`Expense ID ${expense.id} is not in envelope ID` +
			`${envelope.id}.`);
		err.status = 400;
		return next(err);
	}
	expense.envelope = null;
	
	try {
		let key = await models.updateEntity(constants.EXPENSE, expense.id, 
			expense);
	}
	catch (err) {
		next(err);
	}

	// (4) Return location of collection of envelope's expenses in res location
	// header.
	let url = `${req.protocol}://${req.get("host")}/envelopes/${envelope.id}` + 
		`/expenses`;
	res.location(url);
	return res.status(303).end();
};