import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

jest.mock("../nats-wrapper");
process.env.STRIPE_KEY = process.env.STRIPE_KEY || 'sk_test_51RoMPXDJHr40y0JKQbkFggFhu0BKzcFZCHcsk5PchTQl03bELBAOjulhAMc0M75F3QWYa8PjnGFGbaJ2ZSvYzgxO00xRHYViff';

import {app} from "../app"

declare global {
    var signin: (id?: string) => string[];
}

let mongo: any;
beforeAll(async () =>
{
    process.env.JWT_KEY = 'asdf';

    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();

    await mongoose.connect(mongoUri, {});
});

beforeEach(async () =>
{
    jest.clearAllMocks();
    if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();

        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
});

afterAll(async () =>
{
    await mongoose.connection.close();
    if (mongo) {
        await mongo.stop();
    }
});

global.signin = (id?: string) =>
{
    const payload = {
        id: id || new mongoose.Types.ObjectId().toHexString(),
        email: 'test@test.com'
    };

    const token = jwt.sign(payload, process.env.JWT_KEY!);

    const session = { jwt: token };

    const sessionJSON = JSON.stringify(session);

    const base64 = Buffer.from(sessionJSON).toString('base64');

    return [`session=${base64}`];
};



