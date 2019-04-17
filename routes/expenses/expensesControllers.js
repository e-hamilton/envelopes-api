"use strict";

const models = require("../../models/datastoreModels");
const constants = require("../../configs/constants");
const utilities = require("../../globals/utilities");
const schemas = require("./schemas");

exports.getAllExpenses = async function (req, res, next) {
	// Return collection of all expenses.
	let allExpenses, totalCount;
	try {
		[ allExpenses, totalCount ] = await Promise.all([
			models.getAllOfKind_paginated(constants.EXPENSE, req),
			models.getCountOfKind(constants.EXPENSE, req)]);
	}
	catch (err) {
		return next(err);
	}

	allExpenses.count = totalCount;
	
	let results = allExpenses.items.map((eachOne) => { 
		if (eachOne.envelope) {
			eachOne = utilities.expandEnvelope(req, eachOne);
		}
		return utilities.expandOwner(req, eachOne); 
	});

	return res.status(200).json(allExpenses);
};

exports.getExpense = async function (req, res, next) {
	// Return expense info.
	try {
		let expense = await models.getOneOfKind(constants.EXPENSE, 
			req.params.id, req);
		if (expense.envelope) {
			expense = utilities.expandEnvelope(req, expense);
		}
		expense = utilities.expandOwner(req, expense);
		return res.status(200).json(expense);
	}
	catch (err) {
		return next(err);
	}
};

exports.createExpense = async function (req, res, next) {
	// (1) Validate that request body matches addExpense schema.
	try {
		await utilities.validate(req.body, schemas.addExpense);
	}
	catch (err) {
		return next(err);
	}

	let data = Object.assign({}, req.body);
	data.cost = parseFloat(req.body.cost);
	data.envelope = null;
	data.owner = req.user.id;

	// (2) Create expense.
	let key;
	try {
		key = await models.addEntity(constants.EXPENSE, data);
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

exports.updateExpense = async function (req, res, next) {
	// (1) Validate that request body matches updateExpense schema.
	try {
		await utilities.validate(req.body, schemas.updateExpense);
	}
	catch (err) {
		return next(err);
	}

	// (2) Get existing data from datastore; if expense doesn't exist, error.
	let data;
	try {
		data = await models.getOneOfKind(constants.EXPENSE, req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	// (3) Check authorization to update
	if (req.user.id != data.owner) {
		let msg = "You are not authorized to make changes to this expense.";
		let err = new Error(msg);
		err.status = 403;
		return next(err);
	}

	// (4) Update data as needed with request body.
	data.name = req.body.name || data.name;
	data.cost = parseFloat(req.body.cost || data.cost);
	data.description = req.body.description || data.description;

	try {
		let key = await models.updateEntity(constants.EXPENSE, req.params.id, 
			data);
	}
	catch (err) {
		return next(err);
	}

	// (5) Return location of updated resource in Location header.
	res.location(data.self);
	return res.status(303).end();
};

exports.deleteExpense = async function (req, res, next) {
	// (1) Get existing data from datastore; if expense doesn't exist, error.
	let data;
	try {
		data = await models.getOneOfKind(constants.EXPENSE, req.params.id, req);
	}
	catch (err) {
		return next(err);
	}

	// (2) Check authorization to delete.
	if (req.user.id != data.owner) {
		let msg = "You are not authorized to make changes to this expense.";
		let err = new Error(msg);
		err.status = 403;
		return next(err);
	}

	// (3) Delete record for user.
	try{
		await models.deleteEntity(constants.EXPENSE, req.params.id);
	}
	catch (err) {
		return next(err);
	}
	return res.status(204).end();
};