"use strict";

const Joi = require("joi");

exports.userCreds = Joi.object().keys({
	email: Joi.string().required(),
	password: Joi.string().required()
});