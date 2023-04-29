import mongoose, { InferSchemaType } from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: false },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export type UserType = InferSchemaType<typeof userSchema> & { _id: string };

export default mongoose.model("User", userSchema);
