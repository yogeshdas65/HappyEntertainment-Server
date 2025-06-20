import mongoose from "mongoose";

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
    finalAmount:{
      type: Number,
      default: 0,
    },
    paymentReceipt: {
      type: String,
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
