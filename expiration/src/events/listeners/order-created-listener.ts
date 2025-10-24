import {Listener, type OrderCreatedEvent, Subjects} from '@agotickets/common';
import type {JsMsg} from "nats";
import {durableName} from "./durable-name";
import {expirationQueue} from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<OrderCreatedEvent>
{
    readonly subject = Subjects.OrderCreated;
    stream = "ORDERS";
    durableNameBase = durableName;

    async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg)
    {
        console.log('Message received:', this.subject, this.durableName);

        const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
        console.log('Waiting this many mills to process the job:', delay);

        await expirationQueue.add(
            {
                orderId: data.id,
            },
            {
                delay,
            }
        );

        msg.ack();
    }
}