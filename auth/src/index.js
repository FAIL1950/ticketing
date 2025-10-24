"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var app_1 = require("./app");
if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
}
try {
    await mongoose_1.default.connect("mongodb://auth-mongo-srv:27017/auth");
    console.log("Connected to MongoDB");
    app_1.app.listen(3000, function () {
        console.log("Server running on port 3000");
    });
}
catch (err) {
    console.error("Start error:", err);
}
