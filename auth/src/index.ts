import mongoose from "mongoose";
import { app } from "./app";

if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
}

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
}

try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(3000, () =>
    {
        console.log("Server running on port 3000");
    });
} catch (err) {
    console.error("Start error:", err);
}



