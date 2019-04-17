"use strict";

const express = require("express");
const envelopes = express.Router();
const middleware = require("../../globals/middleware");
const verifyJWT = middleware.verifyJWT;
envelopes.use(verifyJWT);	// secures all routes
// Force "Accept: application/json" header
const acceptJSON = middleware.acceptJSON;
// Force "Content-Type: application/json" header
const contentTypeJSON = middleware.contentTypeJSON;

// CONTROLLER ------------------------------------------------------------------
const envelopesControllers = require("./envelopesControllers");

// ENVELOPES CRUD ROUTES -------------------------------------------------------

// Return all envelopes (protected).
// Access: Open to any user with valid JWT.
envelopes.get("/", acceptJSON, envelopesControllers.getAllEnvelopes);

// Return single envelope by ID (protected).
// Access: Open to any user with valid JWT.
envelopes.get("/:id", acceptJSON, envelopesControllers.getEnvelope);

// Add new envelope (protected).
// Access: Open to any user with valid JWT.
envelopes.post("/", contentTypeJSON, envelopesControllers.createEnvelope);

// Update envelope (protected).
// Access: Restricted to owner of envelope.
envelopes.patch("/:id", contentTypeJSON, envelopesControllers.updateEnvelope);

// Delete envelopes (protected).
// Access: Restricted to owner of envelopes.
envelopes.delete("/:id", envelopesControllers.deleteEnvelope);

// ENVELOPE EXPENSES ROUTES ----------------------------------------------------

// Add expense to envelope (protected).
// Access: Restricted to owner of both envelope and expense.
envelopes.put("/:envelopeId/expenses/:expenseId", 
	envelopesControllers.addExpenseToEnv);

// Get all expenses for an envelope (protected).
// Access: Open to any user with valid JWT.
envelopes.get("/:envelopeId/expenses", acceptJSON, 
	envelopesControllers.getExpensesInEnv);

// Remove expense from envelope (protected).
// Access: Restricted to owner of both envelope and expense.
envelopes.delete("/:envelopeId/expenses/:expenseId", 
	envelopesControllers.removeExpenseFromEnv);


module.exports = envelopes;