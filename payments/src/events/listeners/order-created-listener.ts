import { Listener, Subjects, type OrderCreatedEvent} from "@agotickets/common";
import { durableName } from "./durable-name";
import type {JsMsg} from "nats";
import { Order } from "../../models/order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    readonly subject = Subjects.OrderCreated;
    durableNameBase = durableName;
    stream = "ORDERS";

    async onMessage(data: OrderCreatedEvent['data'], msg: JsMsg) {
        console.log('Message received:', this.subject, this.durableName);
        const order = Order.build({
            id: data.id,
            price: data.ticket.price,
            status: data.status,
            userId: data.userId,
            version: data.version,
        });

        await order.save();

        msg.ack();
    };
}