import mongoose from "mongoose";

const propertyPaymentSchema = new mongoose.Schema(
  {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property", 
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    rent: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    monthlyBill: {
      type: String,
      default: null,
    },
    pendingRent: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    tds: {
      type: Number,
      default: 0,
    },
    assessmentBill: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    maintenance: {
      whoPays: {
        type: String,
        enum: ["Owner", "Tenant"],
        default: "Owner",
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    electricityBill: {
      isPaid: {
        type: Boolean,
        default: false,
      },
      isInstallment: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    rentInstallment: {
      isInstallment: {
        type: Boolean,
        default: false,
      },
    },
    maintenanceInstallment: {
      isInstallment: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    uploads: {
      paymentScreenshot: {
        type: String,
        default: null,
      },
      monthlyBill: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const PropertyPayment = mongoose.model(
  "PropertyPayment",
  propertyPaymentSchema
);
export default PropertyPayment;
