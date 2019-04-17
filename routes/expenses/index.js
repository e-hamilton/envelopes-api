"use strict";

const express = require("express");
const expenses = express.Router();
const middleware = require("../../globals/middleware");
const verifyJWT = middleware.verifyJWT;
expenses.use(verifyJWT);	// secures all routes for this router
// Force "Accept: application/json" header
const acceptJSON = middleware.acceptJSON;
// Force "Content-Type: application/json" header
const contentTypeJSON = middleware.contentTypeJSON;

// CONTROLLER ------------------------------------------------------------------
const expensesControllers = require("./expensesControllers");

// EXPENSES CRUD ROUTES --------------------------------------------------------

// Return all expenses (protected).
// Access: Open to any user with valid JWT.
expenses.get("/", acceptJSON, expensesControllers.getAllExpenses);

// Return single expense by ID (protected).
// Access: Open to any user with valid JWT.
expenses.get("/:id", acceptJSON, expensesControllers.getExpense);

// Add new expense (protected).
// Access: Open to any user with valid JWT.
expenses.post("/", contentTypeJSON, expensesControllers.createExpense);

// Update expense (protected).
// Access: Restricted to owner of expense.
expenses.patch("/:id", contentTypeJSON, expensesControllers.updateExpense);

// Delete expense (protected).
// Access: Restricted to owner of expense.
expenses.delete("/:id", expensesControllers.deleteExpense);


module.exports = expenses;