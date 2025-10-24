import { Subjects, Publisher } from "@agotickets/common";
import type { ExpirationCompleteEvent } from "@agotickets/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    readonly subject = Subjects.ExpirationComplete;
    stream = "EXPIRATION";
}