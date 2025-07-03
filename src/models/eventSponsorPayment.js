import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    receiptUrl: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const eventSponsorPaymentSchema = new mongoose.Schema(
  {
    events_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    sponsor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: true,
    },
    donationBySponsor: {
      type: Number,
      default: 0,
    },
    advanceDonation: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    paymentReceipts: [receiptSchema],
    invoiceBill: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const EventSponsorPayment = mongoose.model(
  "EventSponsorPayment",
  eventSponsorPaymentSchema
);
export default EventSponsorPayment;
