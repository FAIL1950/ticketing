import mongoose, {type PopulatedDoc} from "mongoose";
import {toJSON, OrderStatus} from "@agotickets/common";

import type {Document as TicketDocument} from "./ticket";

export {OrderStatus};

const orderSchema = new mongoose.Schema(
    {
        userId: {type: String, required: true},
        status: {
            type: String,
            required: true,
            enum: Object.values(OrderStatus),
            default: OrderStatus.Created
        },
        expiresAt: {type: mongoose.Schema.Types.Date},
        ticket: {type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true}
    },
    {
        optimisticConcurrency: true,
    }
);

toJSON(orderSchema);

orderSchema.set('versionKey', 'version');

type Doc = mongoose.InferSchemaType<typeof orderSchema> & { ticket: PopulatedDoc<TicketDocument> } & {
    version: number;
};
type Document = mongoose.HydratedDocument<Doc>;
type Attrs = Omit<Doc, 'ticket' | 'version' | 'expiresAt'> & {
    ticket: TicketDocument;
    expiresAt: NativeDate | null;  // ← теперь обязательное
};

orderSchema.statics.build = function (attrs: Attrs): Document
{
    return new this(attrs);
};

interface OrderModel extends mongoose.Model<Doc>
{
    build(attrs: Attrs): Document;
}

export const Order = mongoose.model<Doc, OrderModel>('Order', orderSchema);

