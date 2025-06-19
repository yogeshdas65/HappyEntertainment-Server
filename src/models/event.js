import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    artists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
    sponsors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sponsor",
      },
    ],
    eventName: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventPreparationFinished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
