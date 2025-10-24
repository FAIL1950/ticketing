import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import {app} from "../app"

type TestAgent = ReturnType<typeof request.agent>;

declare global {
    var signin: () => Promise<TestAgent>;
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

global.signin = async () =>
{
    const agent = request.agent(app);
    const email = 'test@test.com';
    const password = 'password';

    await agent
        .post('/api/users/signup')
        .send({
            email, password
        })
        .expect(201);

    return agent;

};



