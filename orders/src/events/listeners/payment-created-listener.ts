import {Subjects, Listener, OrderStatus, type PaymentCreatedEvent} from "@agotickets/common";
import {durableName} from "./durable-name";
import type {JsMsg} from "nats";
import { Order } from "../../models/order";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent>
{
    readonly subject = Subjects.PaymentCreated;
    stream = "PAYMENTS";
    durableNameBase = durableName;

    async onMessage(data: PaymentCreatedEvent["data"], msg: JsMsg)
    {
        const order = await Order.findById(data.orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        order.set({
            status: OrderStatus.Complete,
        })
        await order.save();

        msg.ack();
    }

}