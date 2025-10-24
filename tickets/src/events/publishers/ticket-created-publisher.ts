import { Publisher, Subjects } from "@agotickets/common";
import type { TicketCreatedEvent } from "@agotickets/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    stream = process.env.NATS_STREAM_NAME_FOR_PUBLISH!;
    readonly subject = Subjects.TicketCreated;
}

