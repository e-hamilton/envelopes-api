"use strict";

const ds = require("../configs/datastore");
const datastore = ds.datastore;
const constants = require("../configs/constants");
const utilities = require("../globals/utilities");

// CREATE MODELS ---------------------------------------------------------------

exports.addEntity = async function (kind, data) {
	let key = datastore.key(kind);
	await datastore.save({"key": key, "data": data});
	return key;
};

// READ MODELS -----------------------------------------------------------------

// Optional argument limitKeys (array of strings) to run a projection query
// (i.e. to only return the first and last names, ["first", "last"]). 
exports.getOneOfKind = async function (kind, id, req, limitKeys=undefined) {
	let key = datastore.key([kind, parseInt(id, 10)]);
	let query = datastore.createQuery(kind).filter("__key__", "=", key);
	if (limitKeys) {
		query.select(limitKeys);
	}
	let results = await datastore.runQuery(query);
	if (results[0][0] != undefined) {
		let entity = utilities.appendIdAndSelf(req, results[0][0]);
		return entity;
	}
	else {
		let err = new Error(`${kind} ID ${id} not found.`);
		err.status = 404;
		throw err;
	}
};

// Optional argument limitKeys (array of strings) to run a projection query
// (i.e. to only return the first and last names, ["first", "last"]).
// Note that Google won't allow you to project only the selected key. For example,
// if key = "email", limitKeys cannot be ["email"] but may be ["email", "last"].
exports.getSomeByValue = async function (kind, key, value, req, limitKeys=undefined) {
	let query = datastore.createQuery(kind).filter(key, '=', value);
	if (limitKeys) {
		query.select(limitKeys);
	}
	let matches = await datastore.runQuery(query);
	let results = matches[0].map(
		(eachOne) => { return utilities.appendIdAndSelf(req, eachOne); }
	);
	return results;
};

// Optional argument limitKeys (array of strings) to run a projection query
// (i.e. to only return the first and last names, ["first", "last"]).
exports.getAllOfKind = async function (kind, req, limitKeys=undefined) {
	// Will return up to ds.LOOKUP_LIMIT results. 
	let query = datastore.createQuery(kind);
	if (limitKeys) {
		query.select(limitKeys);
	}
	let entities = await datastore.runQuery(query);
	let results = entities[0].map(
		(eachOne) => { return utilities.appendIdAndSelf(req, eachOne); }
	);
	return results;
};

// Optional argument limitKeys (array of strings) to run a projection query
// (i.e. to only return the first and last names, ["first", "last"]);
exports.getAllOfKind_paginated = async function (kind, req, limitKeys=undefined) {
	let query = datastore.createQuery(kind)
		.limit(Math.min(constants.PAGE_LIMIT, ds.LOOKUP_LIMIT));
	if (limitKeys) {
		query.select(limitKeys);
	}
	if (Object.keys(req.query).includes("cursor")) {
		// FYI: Google's cursor will sometimes include non-alphanumeric chars, 
		// but Express will decode spaces and other reserved characters from 
		// req query params. Here I decode to get spaces and symbols like "=",
		// etc. and reencode using encodeURI() to be safe. EncodeURI() doesn't
		// try to replace reserved characters or unreserved marks while 
		// encodeURIComponenet() will. I chose to replace spaces with "+" using 
		// a regex because encodeURI will replace them with "%20" and that 
		// causes an invalid encoding error.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI
		let cursor = decodeURIComponent(req.query.cursor).replace(/\s/g, "+");
		cursor = encodeURI(cursor);
		query = query.start(cursor);
	}
	let entities = await datastore.runQuery(query);
	let results = {};
	results.items = entities[0].map(
		(x) => { return utilities.appendIdAndSelf(req, x); }
	);
	if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
		results.next = `${req.protocol}://${req.get("host")}${req.baseUrl}` + 
			`?cursor=${entities[1].endCursor}`;
	}
	return results;
};

exports.getCountOfKind = async function (kind, req) {
	//This function runs a keys-only query to reduce latency.
	let query = datastore.createQuery(kind)
		.select("__key__")
		.limit(ds.LOOKUP_LIMIT);
	let count = 0;
	let cursor = null;
	while (true) {
		if (cursor) {
			query = query.start(cursor);
		}
		let keys = await datastore.runQuery(query);	
		count += keys[0].length;
		if (keys[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
			cursor = keys[1].endCursor;
		}
		else {
			break;
		}
	}
	return count;
};

// UPDATE MODELS ---------------------------------------------------------------

exports.updateEntity = async function (kind, id, data) {
	let updateData = Object.assign({}, data);
	let key = datastore.key([kind, parseInt(id, 10)]);
	if (updateData.id) {
		delete updateData.id;
	}
	if (updateData.self) {
		delete updateData.self;
	}
	await datastore.update({ "key": key, "data": updateData});
	return key;
};

// DELETE MODELS ---------------------------------------------------------------

exports.deleteEntity = async function (kind, id) {
	let key = datastore.key([kind, parseInt(id, 10)]);
	await datastore.delete(key);
	return key;
};

// Each entity in entityArray must be an object with, at minimum, an id property.
exports.deleteBatch = async function (kind, entityArray) {
	let entities = [];

	entityArray.forEach(entity => {
		let key = datastore.key([kind, parseInt(entity.id, 10)]);
		entities.push(key);
	});

	await datastore.delete(entities);
	return entities;
};
