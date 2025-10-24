import mongoose from "mongoose";
import { Password } from "../services/password";
import { toJSON } from "@agotickets/common";

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        password: { type: String, required: true },
    },
);

toJSON(userSchema, "password");

userSchema.pre('save', async function () {
    if(this.isModified("password")) {
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed);
    }
});

type UserDoc = mongoose.InferSchemaType<typeof userSchema>;
type UserDocument = mongoose.HydratedDocument<UserDoc>;
type UserAttrs = Pick<UserDoc, 'email' | 'password'>;

userSchema.statics.build = function(attrs: UserAttrs): UserDocument {
    return new this(attrs);
};

interface UserModel extends mongoose.Model<UserDoc> {
    build(attrs: UserAttrs): UserDocument;
}

export const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

