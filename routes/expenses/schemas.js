"use strict";

const Joi = require("joi");
const constants = require("../../configs/constants");

exports.addExpense = Joi.object().keys({
	name: Joi.string().max(constants.LIMITS.STRING_MAX).required(),
	cost: Joi.number().required(),
	description: Joi.string().max(constants.LIMITS.TEXT_MAX)
});

exports.updateExpense = Joi.object().keys({
	name: Joi.string().max(constants.LIMITS.STRING_MAX),
	cost: Joi.number(),
	description: Joi.string().max(constants.LIMITS.TEXT_MAX)
});