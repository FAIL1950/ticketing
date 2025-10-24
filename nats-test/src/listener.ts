import {
    connect
} from 'nats';

import {TicketCreatedListener} from './events/ticket-created-listener';


console.clear();

async function start()
{
    const nc = await connect({servers: 'localhost:4222'});
    console.log('Listener connected to NATS');

    process.on('SIGINT', async () =>
    {
        console.log('Received SIGINT, closing NATS connection...');
        await nc.close();
        process.exit();
    });

    process.on('SIGTERM', async () =>
    {
        console.log('Received SIGTERM, closing NATS connection...');
        await nc.close();
        process.exit();
    });

    await new TicketCreatedListener(nc).listen();
}

start()
    .catch(console.error);






