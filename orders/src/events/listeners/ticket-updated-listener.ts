import type { JsMsg } from "nats";
import {Subjects, Listener } from "@agotickets/common";
import type { TicketUpdatedEvent } from "@agotickets/common";
import { Ticket } from "../../models/ticket";
import { durableName } from "./durable-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
    stream = "TICKETS";
    readonly subject = Subjects.TicketUpdated;
    durableNameBase = durableName;

    async onMessage(data: TicketUpdatedEvent["data"], msg: JsMsg)
    {
        console.log('Message received:', this.subject, this.durableName);

        const ticket = await Ticket.findByEvent(data);
        if (!ticket) {
            throw new Error("Ticket not found!");
        }

        const { title, price } = data;
        ticket.set({ title, price });
        ticket.markModified('title', 'price')
        await ticket.save();

        msg.ack();
    }
}

