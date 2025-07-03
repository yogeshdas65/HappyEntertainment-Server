import Property from "../../models/property.js";
import PropertyPayment from "../../models/propertyPayment.js";
import mongoose from "mongoose";
import { getNextBillNo } from "../../middleware/helper.js"; // adjust path as needed
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const newPropertyCreation = async (req, reply) => {
  try {
    const {
      buildName,
      tenantName,
      rent,
      maintenanceAmount,
      aadharCardNumber,
      pancardNumber,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      gst,
      startDate,
      endDate,
    } = req.body;

    console.log(
      buildName,
      tenantName,
      rent,
      maintenanceAmount,
      aadharCardNumber,
      pancardNumber,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      gst,
      startDate,
      endDate
    );

    const newProperty = await Property.create({
      buildName,
      tenantName,
      rent,
      maintenanceAmount,
      aadharCardNumber,
      pancardNumber,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      gst,
      startDate,
      endDate,
      netIncomeGenerated: 0, // Default at creation
    });

    return reply.code(201).send({
      message: "Property created successfully",
      data: newProperty,
    });
  } catch (error) {
    console.error("Error creating property:", error);
    return reply.code(500).send({
      message: "Failed to create property",
      error: error.message,
    });
  }
};

export const updateProperty = async (req, reply) => {
  try {
    const {
      buildName,
      tenantName,
      rent,
      maintenanceAmount,
      aadharCardNumber,
      pancardNumber,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      gst,
      startDate,
      endDate,
    } = req.body;

    const { _id } = req.params;

    if (!_id) {
      return reply.code(400).send({
        message: 'Property ID is required for update',
      });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      _id,
      {
        buildName,
        tenantName,
        rent,
        maintenanceAmount,
        aadharCardNumber,
        pancardNumber,
        bankAccountName,
        bankAccountType,
        bankAccountNumber,
        bankIfscCode,
        gst,
        startDate,
        endDate,
      },
      { new: true }
    );

    if (!updatedProperty) {
      return reply.code(404).send({
        message: 'Property not found',
      });
    }

    return reply.code(200).send({
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (error) {
    console.error('Error updating property:', error);
    return reply.code(500).send({
      message: 'Failed to update property',
      error: error.message,
    });
  }
};

export const getallProperty = async (req, reply) => {
  try {
    const { name } = req.query;

    let filter = {};

    if (name) {
      filter = {
        $or: [
          { tenantName: { $regex: name, $options: "i" } },
          { buildName: { $regex: name, $options: "i" } },
        ],
      };
    }
    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .populate("payments"); 

    return reply.code(200).send({
      message: "Properties fetched successfully",
      data: properties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return reply.code(500).send({
      message: "Failed to fetch properties",
      error: error.message,
    });
  }
};

export const makePayment = async (req, reply) => {
  try {
    const {
      property_id,
      buildName,
      tenantName,
      address,
      date,
      rent,
      pendingRent,
      gst,
      tds,
      endDate,
      startDate,
      monthlyBill,
      isPaid,
      assessmentBill,
      finalAmount,
      maintenance,
      electricityBill,
      rentInstallment,
      maintenanceInstallment,
      electricityInstallment,
      uploads, // { paymentScreenshot, monthlyBill }
    } = req.body;

    // Check if property exists
    const property = await Property.findById(property_id);
    if (!property) {
      return reply
        .code(404)
        .send({ success: false, message: "Property not found" });
    }

    // Create new payment record
    const payment = new PropertyPayment({
      property_id,
      buildName,
      tenantName,
      address,
      date,
      rent,
      endDate,
      startDate,
      monthlyBill,
      isPaid,
      pendingRent,
      gst,
      tds,
      assessmentBill,
      finalAmount,
      maintenance,
      electricityBill,
      rentInstallment,
      maintenanceInstallment,
      electricityInstallment,
      uploads,
    });

    await payment.save();

    // Add payment to property's payments array
    property.payments.push(payment._id);
    await property.save();

    reply.code(201).send({
      success: true,
      message: "Payment recorded successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
