import mongoose from "mongoose";

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
    paymentReceipt: {
      type: String,
    },
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
