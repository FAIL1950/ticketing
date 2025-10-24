import mongoose from "mongoose";
import { toJSON } from "@agotickets/common";

const ticketSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        price: { type: Number, required: true },
        userId: { type: String, required: true },
        orderId: { type: String },
    },
    {
        optimisticConcurrency: true
    }
);

ticketSchema.set('versionKey', 'version');

toJSON(ticketSchema);

type Doc = mongoose.InferSchemaType<typeof ticketSchema> & {
    version: number;
};
type Document = mongoose.HydratedDocument<Doc>;
type Attrs = Pick<Doc, 'title' | 'price' | 'userId'>;

ticketSchema.statics.build = function(attrs: Attrs): Document {
    return new this(attrs);
};

interface TicketModel extends mongoose.Model<Doc> {
    build(attrs: Attrs): Document;
}

export const Ticket = mongoose.model<Doc, TicketModel>('Ticket', ticketSchema);

