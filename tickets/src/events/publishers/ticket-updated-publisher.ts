import { Publisher, Subjects } from "@agotickets/common";
import type { TicketUpdatedEvent } from "@agotickets/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    stream = process.env.NATS_STREAM_NAME_FOR_PUBLISH!;
    readonly subject = Subjects.TicketUpdated;
}

