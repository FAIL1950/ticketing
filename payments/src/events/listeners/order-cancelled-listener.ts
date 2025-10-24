import {
    Listener,
    Subjects,
    type OrderCancelledEvent,
    OrderStatus
} from "@agotickets/common";
import { durableName } from "./durable-name";
import type {JsMsg} from "nats";
import { Order } from "../../models/order";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled;
    durableNameBase = durableName;
    stream = "ORDERS";

    async onMessage(data: OrderCancelledEvent['data'], msg: JsMsg) {
        console.log('Message received:', this.subject, this.durableName);
        const order = await Order.findOne({
            _id: data.id,
            version: data.version - 1,
        });

        if (!order) {
            throw new Error("Order not found");
        }

        order.set({ status: OrderStatus.Cancelled });
        await order.save();

        msg.ack();
    };
}