import { OrderCancelledListener } from "../order-cancelled-listener";
import {natsWrapper} from "../../../nats-wrapper";
import {Ticket} from "../../../models/ticket";
import {type OrderCancelledEvent, OrderStatus} from "@agotickets/common";
import mongoose from "mongoose";
import type {JsMsg} from "nats";

const setup = async () => {
    const listener = new OrderCancelledListener(natsWrapper.client);

    const orderId = new mongoose.Types.ObjectId().toHexString();

    const ticket = Ticket.build({
        title: 'concert',
        price: 99,
        userId: 'asdf',
    });
    ticket.set({ orderId })

    await ticket.save();

    const data: OrderCancelledEvent['data'] = {
        id: orderId,
        version: 0,
        ticket: {
            id: ticket.id,
        }
    }

    //@ts-ignore
    const msg: JsMsg = {
        ack: jest.fn(),
    };

    return { listener, data, msg, ticket, orderId };

};

it('updates the ticket, publishes an event, and acks the message', async () => {
    const { listener, data, msg, ticket, orderId } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.orderId).not.toBeDefined();
    expect(msg.ack).toHaveBeenCalled();
    expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();
})