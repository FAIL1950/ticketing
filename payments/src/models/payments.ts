import mongoose from "mongoose";
import {toJSON} from "@agotickets/common";

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
        },
        stripeId: {
            type: String,
            required: true,
        }
    },
);

toJSON(paymentSchema);

type Doc = mongoose.InferSchemaType<typeof paymentSchema>;
type Document = mongoose.HydratedDocument<Doc>;
type Attrs = Doc;

paymentSchema.statics.build = function (attrs: Attrs): Document
{
    return new Payment(attrs);

};

interface PaymentModel extends mongoose.Model<Doc>
{
    build(attrs: Attrs): Document;
}

export const Payment = mongoose.model<Doc, PaymentModel>('Payment', paymentSchema);

