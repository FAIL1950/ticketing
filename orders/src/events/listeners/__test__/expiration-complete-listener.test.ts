import { natsWrapper } from "../../../nats-wrapper";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { Order } from "../../../models/order";
import { Ticket } from "../../../models/ticket";
import mongoose from "mongoose";
import { OrderStatus } from "@agotickets/common";
import type { ExpirationCompleteEvent } from "@agotickets/common";
import type {JsMsg} from "nats";

const setup = async () => {
    const listener = new ExpirationCompleteListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const order = Order.build({
        status: OrderStatus.Created,
        userId: 'asdasdad',
        expiresAt: new Date(),
        ticket
    });
    await order.save();

    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id,
    };

    //@ts-ignore
    const msg: JsMsg = {
        ack: jest.fn(),
    }

    return { listener, data, msg, order, ticket };
}

it('updates the order status to cancelled', async () => {
    const { listener, data, msg, order } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emit an OrderCancelled event', async () => {
    const { listener, data, msg, order } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();

    const decoder = new TextDecoder();
    const eventData = JSON.parse(decoder.decode((natsWrapper.client.jetstream().publish as jest.Mock).mock.calls[0][1]));

    expect(eventData.id).toEqual(order.id);
});

it('ack the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});