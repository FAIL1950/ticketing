import {TicketUpdatedListener} from "../ticket-updated-listener";
import {natsWrapper} from "../../../nats-wrapper";
import mongoose from "mongoose";
import type {JsMsg} from "nats";
import type {TicketUpdatedEvent} from "@agotickets/common";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    const listener = new TicketUpdatedListener(natsWrapper.client);

    const ticket = Ticket.build({
       id: new mongoose.Types.ObjectId().toHexString(),
       title: 'concert',
       price: 20
    });
    await ticket.save();

    const data: TicketUpdatedEvent['data'] = {
        version: ticket.version + 1,
        id: ticket.id,
        title: 'new concert',
        price: 999,
        userId: 'sadasdasadas',
    };

    // @ts-ignore
    const msg: JsMsg = {
        ack: jest.fn(),
    }

    return { listener, data, msg, ticket };
};

it('finds, updates and saves a ticket', async () => {
    const { listener, data, msg, ticket } = await setup();

    await listener.onMessage(data,msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket).toBeDefined();
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);

});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data,msg);

    expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async () => {
    const { listener, data, msg } = await setup();

    data.version = 10;

    await expect(listener.onMessage(data, msg)).rejects.toThrow();
    expect(msg.ack).not.toHaveBeenCalled();
});