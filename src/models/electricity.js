import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

// Bill schema (intended to be a top-level schema if using AutoIncrement)
const BillSchema = new mongoose.Schema({
  billNo: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  finalAmount: { type: Number, required: true },
  maintenanceAmount: { type: Number, required: true, default: 0 },
  isPaid: { type: Boolean, default: false },
  receiptUrl: { type: String, required: true },
  paymentScreenshot: { type: String , default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Apply auto-increment to BillSchema
BillSchema.plugin(AutoIncrement, {
  inc_field: "billNo",
  id: "bill_no_counter",
  start_seq: 1,
});

const MonthlyBillSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  finalAmount: { type: Number, required: true },
  maintenanceAmount: { type: Number, required: true, default: 0 },
  isPaid: { type: Boolean, default: false },
  receiptUrl: { type: String, required: true },
  paymentScreenshot: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ElectricitySchema = new mongoose.Schema({
  plantName: { type: String, required: true },
  netIncomeGenerated: { type: Number, default: 0 },

  periodicBills: {
    consultingFeesByOasis: { type: [BillSchema], default: [] },
    dsmAdviceBills: { type: [BillSchema], default: [] },
    forecastingAndSchedulingBills: { type: [BillSchema], default: [] },
    consultingFeesByEnrich: { type: [BillSchema], default: [] },
    amc: { type: [BillSchema], default: [] },
  },

  electricityBill: {
    energyInvoice: { type: [MonthlyBillSchema], default: [] },
    electricityBillForPlant: { type: [MonthlyBillSchema], default: [] },
    challan: { type: [MonthlyBillSchema], default: [] },
  },
  createdAt: { type: Date, default: Date.now },
});

const Electricity = mongoose.model("Electricity", ElectricitySchema);
export default Electricity;
