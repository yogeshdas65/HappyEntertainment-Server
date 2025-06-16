import Counter from "../models/counter.js";

export async function getNextBillNo() {
    const counter = await Counter.findOneAndUpdate(
      { _id: "bill_no_counter" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
  
    return counter.seq;
  }