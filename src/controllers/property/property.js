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
        message: "Property ID is required for update",
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
        message: "Property not found",
      });
    }

    return reply.code(200).send({
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return reply.code(500).send({
      message: "Failed to update property",
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
      .populate({
        path: "payments",
        populate: {
          path: "property_id",
          model: "Property",
        },
      });

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

export const generateMonthlyBill = async (req, reply) => {
  try {
    const { property_id, month, startDate, endDate } = req.body;

    console.log(property_id, month, startDate, endDate);

    // Validate required fields
    if (!property_id || !month || !startDate || !endDate) {
      return reply.code(400).send({
        success: false,
        message: "Property ID, month, startDate, and endDate are required",
      });
    }

    // Check if bill already exists
    const existingBill = await PropertyPayment.findOne({ property_id, month });
    if (existingBill) {
      return reply.code(409).send({
        success: false,
        message: "Monthly bill already exists for this property and month",
      });
    }

    // Find the property
    const existingproperty = await Property.findById(property_id).populate(
      "payments"
    );

    if (!existingproperty) {
      return reply.code(404).send({
        success: false,
        message: "Property not found",
      });
    }

    // Parse dates to Date objects
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Calculate billing components
    const rent = existingproperty.rent || 0;
    const maintenance = existingproperty.maintenanceAmount || 0;
    const gstRate = 0.18;
    const gst = parseFloat((rent * gstRate).toFixed(2));
    const tdsRate = 0.1;
    const tds = parseFloat((rent * tdsRate).toFixed(2));
    const assessmentBill = 0; // update logic if needed
    const finalAmount = rent + maintenance + gst - tds;

    // Create and save payment bill
    const payment = new PropertyPayment({
      property_id,
      month,
      rent,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      maintenance: {
        whoPays: "Tenant",
        amount: maintenance,
      },
      gst,
      tds,
      assessmentBill,
      finalAmount,
    });

    const payment_id = await payment.save();
    existingproperty.payments.push(payment_id._id);
    await existingproperty.save();
    const updatedProperty = await Property.findById(property_id).populate({
      path: "payments",
      populate: {
        path: "property_id", // now this will work
        model: "Property",
      },
    });

    return reply.code(201).send({
      success: true,
      message: "Monthly bill generated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    console.error("Error generating monthly bill:", error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateMonthlyBill = async (req, reply) => {
  try {
    const {
      id,
      isPaid,
      finalAmount,
      isInstallment,
      whoPaysMaintenance,
      isMaintenanceInstallment,
      maintenanceAmount,
      isElectricityPaid,
      isElectricityInstallment,
      electricityAmount,
    } = req.body;
    console.log( id,
      "isPaid" , isPaid,
      finalAmount,
      isInstallment,
      whoPaysMaintenance,
      isMaintenanceInstallment,
      maintenanceAmount,
      isElectricityPaid,
      isElectricityInstallment,
      electricityAmount)

    const files = req.files || {};
    const paymentScreenshot = files["paymentScreenshot"]?.[0] || null;
    const monthlyBill = files["monthlyBill"]?.[0] || null;

    const updateData = {
      isPaid: isPaid === "true",
      finalAmount: Number(finalAmount),
      rentInstallment: {
        isInstallment: isInstallment === "true",
      },
      maintenance: {
        whoPays: whoPaysMaintenance,
        amount: Number(maintenanceAmount),
      },
      maintenanceInstallment: {
        isInstallment: isMaintenanceInstallment === "true",
        amount: Number(maintenanceAmount),
      },
      electricityBill: {
        isPaid: isElectricityPaid === "true",
        isInstallment: isElectricityInstallment === "true",
        amount: Number(electricityAmount),
      },
      uploads: {},
    };

    // Upload paymentScreenshot to S3
    if (paymentScreenshot) {
      const fileKey = `property_payments/screenshots/${Date.now()}_${paymentScreenshot.originalname}`;
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: paymentScreenshot.buffer,
        ContentType: paymentScreenshot.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;
      updateData.uploads.paymentScreenshot = fileUrl;
    }

    // Upload monthlyBill to S3
    if (monthlyBill) {
      const fileKey = `property_payments/bills/${Date.now()}_${monthlyBill.originalname}`;
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: monthlyBill.buffer,
        ContentType: monthlyBill.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;
      updateData.uploads.monthlyBill = fileUrl;
    }

    const updated = await PropertyPayment.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("property_id");

    if (!updated) {
      return reply.code(404).send({
        success: false,
        message: "Payment not found",
      });
    }

    return reply.send({
      success: true,
      message: "Monthly bill updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update monthly bill error:", error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
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
