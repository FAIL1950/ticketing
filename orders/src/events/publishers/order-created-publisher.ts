import { Publisher, Subjects} from "@agotickets/common";
import type { OrderCreatedEvent } from '@agotickets/common'

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
    stream = "ORDERS";
    readonly subject= Subjects.OrderCreated;
}