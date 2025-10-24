import mongoose from "mongoose";
import {toJSON, OrderStatus} from "@agotickets/common";

export {OrderStatus};

const orderSchema = new mongoose.Schema(
    {
        userId: {type: String, required: true},
        price: {type: Number, required: true},
        status: {
            type: String,
            required: true,
            enum: Object.values(OrderStatus),
            default: OrderStatus.Created
        },
    },
    {
        optimisticConcurrency: true,
    }
);

toJSON(orderSchema);

orderSchema.set('versionKey', 'version');

type Doc = mongoose.InferSchemaType<typeof orderSchema> & {
    version: number;
};
type Document = mongoose.HydratedDocument<Doc>;
type Attrs = Doc & {
    id: string;
};

orderSchema.statics.build = function (attrs: Attrs): Document
{
    return new Order({
        _id: attrs.id,
        version: attrs.version,
        price: attrs.price,
        userId: attrs.userId,
        status: attrs.status,
    });

};

interface OrderModel extends mongoose.Model<Doc>
{
    build(attrs: Attrs): Document;
}

export const Order = mongoose.model<Doc, OrderModel>('Order', orderSchema);

