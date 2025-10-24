import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import {app} from "../app"

jest.mock("../nats-wrapper");

declare global {
    var signin: () => string[];
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

global.signin = () =>
{
    const payload = {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: 'test@test.com'
    };

    const token = jwt.sign(payload, process.env.JWT_KEY!);

    const session = { jwt: token };

    const sessionJSON = JSON.stringify(session);

    const base64 = Buffer.from(sessionJSON).toString('base64');

    return [`session=${base64}`];
};



