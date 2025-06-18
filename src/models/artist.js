import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    artistName:{
      type:String,
      required:true
    },
    eventPreparationFinished: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    companyNameOfArtist:{
      type:String,
      required:true
    },
    aadharCardNumber: {
      type: String,
      required: true,
    },
    pancardNumber: {
      type: String,
      required: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
    },
    bankIfscCode: {
      type: String,
      required: true,
    },
    bankAccountName: {
      type: String,
      required: true,
    },
    bankAccountType: {
      type: String,
      enum: ["Savings", "Current"],
      required: true,
    },
    gst: {
      type: String,
    },
    roles: {
      type: [String],
      enum: [
        'Lead Singer',
        'Background Singer',
        'Director',
        'Producer',
        'Composer',
        'Instrument Player',
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Artist = mongoose.model("Artist", artistSchema);
export default Artist;
