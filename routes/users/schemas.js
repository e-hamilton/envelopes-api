"use strict";

const Joi = require("joi");
const constants = require("../../configs/constants");

exports.addUser = Joi.object().keys({
	email: Joi.string().email().required(),
	first: Joi.string().max(constants.LIMITS.STRING_MAX).required(),
	last: Joi.string().max(constants.LIMITS.STRING_MAX).required(),
	password: Joi.string().min(constants.LIMITS.PW_MIN)
		.max(constants.LIMITS.PW_MAX).required()
});

exports.updateUser = Joi.object().keys({
	email: Joi.string().email(),
	first: Joi.string().max(constants.LIMITS.STRING_MAX),
	last: Joi.string().max(constants.LIMITS.STRING_MAX),
	password: Joi.string().min(constants.LIMITS.PW_MIN)
		.max(constants.LIMITS.PW_MAX)
});