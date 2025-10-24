import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { Server } from 'http';

import { OrderCreatedListener} from "./events/listeners/order-created-listener";
import { OrderCancelledListener} from "./events/listeners/order-cancelled-listener";

if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
}

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
}

if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
}
if (!process.env.NATS_STREAM_NAME_FOR_PUBLISH) {
    throw new Error('NATS_STREAM_NAME_FOR_PUBLISH must be defined');
}

let server: Server;

const handleShutdown = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);

    if (server) {
        await new Promise<void>((resolve) => {
            server.close((err) => {
                if (err) {
                    console.error("Error closing web server:", err);
                } else {
                    console.log("Web server closed.");
                }
                resolve();
            });
        });
    }

    if (natsWrapper.client) {
        try {
            await natsWrapper.client.drain();
            console.log('NATS connection drained and closed.');
        } catch (err) {
            console.error('Error during NATS drain:', err);
        }
    }

    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (err) {
        console.error('Error disconnecting from MongoDB:', err);
    }

    console.log('Graceful shutdown completed.');
    process.exit(0);
};

try {
    await natsWrapper.connect(process.env.NATS_URL);
    natsWrapper.client.closed().then(async (err) => {
        if (err) {
            console.error("NATS connection closed with an error:", err);
            await handleShutdown('NATS connection error');
        } else {
            console.log("NATS connection closed gracefully!");
        }
    });

    const listeners = [
        new OrderCreatedListener(natsWrapper.client),
        new OrderCancelledListener(natsWrapper.client)
    ];

    listeners.forEach(listener => {
        listener.listen()
            .catch(async (err) => {
                await handleShutdown(`${listener.constructor.name} failed ${err}`);
            });
        console.log(`${listener.constructor.name} started.`);
    });

    console.log('All listeners started, continuing with other tasks...');



    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    mongoose.connection.on('disconnected', () => {
        console.error('MongoDB disconnected!');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected!');
    });

    mongoose.connection.on('error', async (err) => {
        console.error('MongoDB connection error:', err);
        await handleShutdown('MongoDB connection error');
    });

    server = app.listen(3000, () => {
        console.log("Server running on port 3000");
    });

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

} catch (err) {
    console.error("Start error:", err);
    await handleShutdown("Start error");
}



