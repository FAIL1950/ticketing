import { connect } from 'nats';
import { TicketCreatedPublisher } from "./events/ticket-created-publisher";

console.clear();

async function publisher() {
    try {

        const nc = await connect({
            servers: 'localhost:4222',
            waitOnFirstConnect: true
        });

        console.log('Publisher connected to NATS');
        const publisher = new TicketCreatedPublisher(nc);

        await publisher.publish({
            id: '123',
            title: 'concert',
            price: 20
        });

    } catch (err) {
        console.error('Error:', err);
    }

}

publisher();