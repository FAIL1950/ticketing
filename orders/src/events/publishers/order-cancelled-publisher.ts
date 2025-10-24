import { Publisher, Subjects} from "@agotickets/common";
import type { OrderCancelledEvent } from '@agotickets/common'

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    stream = "ORDERS";
    readonly subject= Subjects.OrderCancelled;
}