const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const constants = require("../configs/constants");

const keypath = {
	public: path.join(__dirname, "../configs/public.KEY"),
	private: path.join(__dirname, "../configs/private.KEY")
};

const key = {
	public: fs.readFileSync(keypath.public, "utf8"),
	private: fs.readFileSync(keypath.private, "utf8")
};

// HEADER CHECKS ---------------------------------------------------------------
// Forces 'Accept: application/json' header in request. Responds with a 406 Not
// Acceptable response if this header is not present in the request.
exports.acceptJSON = function (req, res, next) {
	if (!req.accepts("application/json")) {
		let msg = "Header: 'Accept: application/json' required.";
		return res.status(406).json({ error: msg });
	}
	return next();
};

// Forces 'Content-Type: application/json' header in request. Responds with a
// 415 Unsupported Media Type response if this header is not present in the
// request.
exports.contentTypeJSON = function(req, res, next) {
	if (!req.is("application/json")) {
		let msg = "Header: 'Content-Type: application/json' required.";
		return res.status(415).json({ error: msg });
	}
	return next();
};

// SECURING ROUTES -------------------------------------------------------------
// Checks contents of incoming 'x-access-token' header and appends user object
// to request if successful. User has id and email attributes.
exports.verifyJWT = function (req, res, next) {
	let token = req.headers["x-access-token"];
	if (!token) {
		let msg = "Header 'x-access-token' required.";
		return res.status(401).json({ error: msg });
	}
	const verifyOptions = {
		issuer: constants.JWT.ISS,
		audience: constants.JWT.AUD,
		expiresIn: constants.JWT.EXP,
		algorithm: constants.JWT.ALG
	};

	let decoded;
	try {
		decoded = jwt.verify(token, key.public, verifyOptions)
	}
	catch (err) {
		return res.status(401).json({ error: err.message });
	}

	req.user = {
		id: decoded.id,
		email: decoded.sub
	};
	
	return next();
};