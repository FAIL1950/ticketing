import { natsWrapper } from "./nats-wrapper";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";

if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
}
if (!process.env.NATS_STREAM_NAME_FOR_PUBLISH) {
    throw new Error('NATS_STREAM_NAME_FOR_PUBLISH must be defined');
}

console.log('Starting...');

const handleShutdown = async (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);

    if (natsWrapper.client) {
        try {
            await natsWrapper.client.drain();
            console.log('NATS connection drained and closed.');
        } catch (err) {
            console.error('Error during NATS drain:', err);
        }
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
    ];

    listeners.forEach(listener => {
        listener.listen()
            .catch(async (err) => {
                await handleShutdown(`${listener.constructor.name} failed ${err}`);
            });
        console.log(`${listener.constructor.name} started.`);
    });

    console.log('All listeners started, continuing with other tasks...');

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

} catch (err) {
    console.error("Start error:", err);
    await handleShutdown("Start error");
}



