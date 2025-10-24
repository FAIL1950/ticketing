import type { JsMsg } from "nats";
import {Subjects, Listener } from "@agotickets/common";
import type { TicketCreatedEvent } from "@agotickets/common";
import { Ticket } from "../../models/ticket";
import { durableName } from "./durable-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    stream = "TICKETS";
    readonly subject = Subjects.TicketCreated;
    durableNameBase = durableName;

    async onMessage(data: TicketCreatedEvent["data"], msg: JsMsg)
    {
        console.log('Message received:', this.subject, this.durableName);
        const { id, title, price } = data;
        const ticket = Ticket.build({
            id, title, price
        });

        await ticket.save();

        msg.ack();
    }
}

