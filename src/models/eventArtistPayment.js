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

const eventArtistPaymentSchema = new mongoose.Schema(
  {
    events_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    artist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    feesOfArtist: {
      type: Number,
      default: 0,
    },
    advanceFees: {
      type: Number,
      default: 0,
    },
    tds: {
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
  },
  {
    timestamps: true,
  }
);

const EventArtistPayment = mongoose.model(
  "EventArtistPayment",
  eventArtistPaymentSchema
);
export default EventArtistPayment;
