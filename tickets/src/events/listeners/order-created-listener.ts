import { Listener, Subjects, type OrderCreatedEvent } from "@agotickets/common";
import { durableName } from "./durable-name";
import type {JsMsg} from "nats";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";


export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    readonly subject = Subjects.OrderCreated;
    stream = "ORDERS";
    durableNameBase = durableName;
    async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg)
    {
        console.log('Message received:', this.subject, this.durableName);
        const ticket = await Ticket.findById(data.ticket.id);
        if (!ticket) {
            throw new Error('Ticket not found.');
        }

        ticket.set({ orderId: data.id});

        await ticket.save();

        await new TicketUpdatedPublisher(this.client).publish({
            id: ticket.id,
            price: ticket.price,
            title: ticket.title,
            userId: ticket.userId,
            orderId: ticket.orderId,
            version: ticket.version
        });

        msg.ack();
    }
}