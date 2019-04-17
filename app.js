"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
app.use(bodyParser.json());

global.appRoot = path.resolve(__dirname);

// ROUTER ----------------------------------------------------------------------
const routes = require("./routes");
app.use("/", routes);


// ERROR HANDLERS --------------------------------------------------------------

// 404-Not Found.
app.use((req, res, next) => {
	let err = new Error("Invalid endpoint.");
	err.status = 404;
	next(err);
});

// Error handler.
app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.message.indexOf("JSON")) {
		err.status = 400;
		err.message = "JSON parsing error in request body.";
	}
	else {
		if (!err.status) {
			err.status = 500;
		}
		if (!err.message) {
			// Mystery Error...
			console.log(err);
			err.message = "Yikes! Something broke!";
		} 
	}
	return res.status(err.status).json({ error: err.message });
});


// LISTEN ----------------------------------------------------------------------
const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Server listening on port ${port}...`);
});