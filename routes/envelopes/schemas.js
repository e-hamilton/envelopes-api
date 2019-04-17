"use strict";

const Joi = require("joi");
const constants = require("../../configs/constants");

exports.addEnvelope = Joi.object().keys({
	name: Joi.string().max(constants.LIMITS.STRING_MAX).required(),
	totalAmount: Joi.number().required()
});

exports.updateEnvelope = Joi.object().keys({
	name: Joi.string().max(constants.LIMITS.STRING_MAX),
	totalAmount: Joi.number()
});