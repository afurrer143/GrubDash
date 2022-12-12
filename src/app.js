const express = require("express");
const cors = require("cors");

const errorHandler = require("./errors/errorHandler");
const notFound = require("./errors/notFound");
const ordersRouter = require("./orders/orders.router");
const dishesRouter = require("./dishes/dishes.router");

const app = express();

// You have not learned about CORS yet.
// The following line let's this API be used by any website.
app.use(cors());
app.use(express.json());

app.use("/dishes", dishesRouter);
app.use("/orders", ordersRouter);

// Not found handler auto called
app.use(notFound);

// Error handler, should be auto called
app.use(errorHandler);

module.exports = app;
