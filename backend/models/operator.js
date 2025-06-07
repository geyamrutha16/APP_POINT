import mongoose from "mongoose";

const operator = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

const Operator = mongoose.model("Operator", operator);
export default Operator;
