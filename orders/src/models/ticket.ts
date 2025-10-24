import mongoose from "mongoose";
import { Order, OrderStatus } from "./order"; // Предполагаем, что OrderStatus доступен
import { toJSON } from "@agotickets/common";

interface ITicketMethods {
    isReserved(): Promise<boolean>;
}

const ticketSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },

    },
    {
        optimisticConcurrency: true,
        methods: {
            isReserved: async function (): Promise<boolean> {
                const existingOrder = await Order.findOne({
                    ticket: this,
                    status: {
                        $in: [
                            OrderStatus.Created,
                            OrderStatus.AwaitingPayment,
                            OrderStatus.Complete,
                        ],
                    },
                });
                return !!existingOrder;
            },
        },
    },
);

toJSON(ticketSchema);

ticketSchema.set('versionKey', 'version');

type Doc = mongoose.InferSchemaType<typeof ticketSchema> & {
    version: number;
};
export type Document = mongoose.HydratedDocument<Doc, ITicketMethods>;
type Attrs = Pick<Doc, 'title' | 'price' > & { id: string };

ticketSchema.statics.build = function(attrs: Attrs): Document {
    return new this({
        _id: attrs.id,
        title: attrs.title,
        price: attrs.price,
    });
};

ticketSchema.statics.findByEvent = function(event: { id: string, version: number }): Promise<Document | null> {
    return Ticket.findOne({
        _id: event.id,
        version: event.version - 1,
    });
};

interface TicketModel extends mongoose.Model<Doc, {}, ITicketMethods> {
    build(attrs: Attrs): Document;
    findByEvent(event: { id: string, version: number }): Promise<Document | null>;
}

export const Ticket = mongoose.model<Doc, TicketModel>('Ticket', ticketSchema);
