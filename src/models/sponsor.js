import mongoose from "mongoose";

const sponsorSchema = new mongoose.Schema(
  {
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    sponsorName: {
      type: String,
      trim: true,
    },
    sponsorIndustry: {
      type: [String],
      enum: [
        "Automobile",
        "Technology",
        "Education",
        "Hospitality",
        "Legal",
        "Entertainment",
      ],
      default: [],
    },
    eventPreparationFinished: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    emailId: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    gst: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sponsor = mongoose.model("Sponsor", sponsorSchema);
export default Sponsor;
