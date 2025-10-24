import { Subjects, Publisher, type PaymentCreatedEvent} from "@agotickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    readonly subject = Subjects.PaymentCreated;
    stream = "PAYMENTS";
}