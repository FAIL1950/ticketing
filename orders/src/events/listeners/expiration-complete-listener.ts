import { Listener, Subjects, OrderStatus, type ExpirationCompleteEvent } from "@agotickets/common";
import { durableName } from "./durable-name";
import type { JsMsg } from "nats";
import { Order } from "../../models/order";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
    readonly subject = Subjects.ExpirationComplete;
    stream = "EXPIRATION";
    durableNameBase = durableName;

    async onMessage(data: ExpirationCompleteEvent["data"], msg: JsMsg)
    {
        console.log('Message received:', this.subject, this.durableName);

        const order = await Order.findById(data.orderId).populate('ticket');

        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status === OrderStatus.Complete) {
            return msg.ack();
        }

        order.set({
            status: OrderStatus.Cancelled,
        });

        await order.save();

        await new OrderCancelledPublisher(this.client).publish({
            id: order.id,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        });

        msg.ack();

    }
}