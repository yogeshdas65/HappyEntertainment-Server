import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    buildName: {
      type: String,
      required: true,
      trim: true,
    },
    netIncomeGenerated: {
      type: Number,
      default: 0,
    },
    tenantName: {
      type: String,
      required: true,
    },
    rent: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maintenanceAmount: {
      type: Number,
      required: true,
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
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyPayment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model("Property", propertySchema);
export default Property;