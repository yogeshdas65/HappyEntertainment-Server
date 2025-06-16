import mongoose from "mongoose";

// Define the counter schema
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., "bill_no_counter"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", CounterSchema);
export default Counter;