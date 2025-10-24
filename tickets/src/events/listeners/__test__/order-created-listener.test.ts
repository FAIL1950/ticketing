import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";
import type { OrderCreatedEvent } from "@agotickets/common";
import mongoose from "mongoose";
import { OrderStatus } from "@agotickets/common";
import type {JsMsg} from "nats";

const setup = async () => {
    const listener = new OrderCreatedListener(natsWrapper.client);

    const ticket = Ticket.build({
        title: 'concert',
        price: 99,
        userId: 'asdf'
    });

    await ticket.save();

    const data: OrderCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        status: OrderStatus.Created,
        userId: 'asdasda',
        expiresAt: 'asdasdsad',
        ticket: {
            id: ticket.id,
            price: ticket.price,
        }
    }

    //@ts-ignore
    const msg: JsMsg = {
        ack: jest.fn(),
    };

    return { listener, data, msg, ticket };

};

it('sets the userId of the ticket', async () => {
    const { listener, data, msg, ticket } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
    const { listener, data, msg, ticket } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
    const { listener, data, msg, ticket } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();

    const decoder = new TextDecoder();
    const ticeketUpdatedData = JSON.parse(decoder.decode((natsWrapper.client.jetstream().publish as jest.Mock).mock.calls[0][1]));

    expect(data.id).toEqual(ticeketUpdatedData.orderId);
});