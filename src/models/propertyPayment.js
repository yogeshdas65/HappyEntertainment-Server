import mongoose from "mongoose";
import { type } from "os";

const propertyPaymentSchema = new mongoose.Schema(
  {
    property_id: {
      type: String,
      required: true,
    },
    buildName: {
      type: String,
      required: true,
    },
    tenantName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    rent: {
      type: Number,
      required: true,
    },
    isPaid:{
      type:Boolean,
      required:true
    },
    startDate:{
      type:Date,
      required:true
    },
    endDate:{
      type:Date,
      required:true
    },
    monthlyBill:{
      type:String,
      required:true
    },
    pendingRent: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      required: true,
    },
    tds: {
      type: Number,
      required: true,
    },
    assessmentBill: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    maintenance: {
      whoPays: {
        type: String,
        enum: ["Owner", "Tenant"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    electricityBill: {
      isPaid: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    rentInstallment: {
      isInstallment: {
        type: Boolean,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    maintenanceInstallment: {
      isInstallment: {
        type: Boolean,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    electricityInstallment: {
      isInstallment: {
        type: Boolean,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
    uploads: {
      paymentScreenshot: {
        type: String,
        required: true,
      },
      monthlyBill: {
        type: String,
        required: true,
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
