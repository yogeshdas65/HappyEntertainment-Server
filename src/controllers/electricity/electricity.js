import Electricity from "../../models/electricity.js";
import mongoose from "mongoose";
import { getNextBillNo } from "../../middleware/helper.js"; // adjust path as needed
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const newPlantCreation = async (req, reply) => {
  const { plantName, periodicBills, electricityBill } = req.body;
  try {
    const newDoc = new Electricity({
      plantName,
      periodicBills,
      electricityBill,
    });
    await newDoc.save();
    console.log("Electricity data saved successfully.");
    reply
      .code(201)
      .send({ message: "Electricity data saved successfully.", data: newDoc });
  } catch (error) {
    console.error("Error saving electricity data:", error);
    reply.code(500).send({ error: "Failed to save electricity data." });
  }
};

export const getPlantNames = async (req, reply) => {
  try {
    const { id } = req.params;

    let data;

    if (id) {
      data = await Electricity.findById(id).select("_id plantName");
      if (!data) {
        return reply.code(404).send({ message: "Plant not found" });
      }
    } else {
      data = await Electricity.find().select("_id plantName");
    }

    reply
      .code(200)
      .send({ message: "Plant name(s) fetched successfully", data });
  } catch (error) {
    console.error("Error fetching plant names:", error);
    reply.code(500).send({ error: "Failed to fetch plant names" });
  }
};

export const getSinglePlant = async (req, reply) => {
  const { _id } = req.params;
  try {
    const plant = await Electricity.findById(_id);
    if (!plant) {
      return reply.code(404).send({ message: "Plant not found" });
    }
    reply
      .code(200)
      .send({ message: "Plant fetched successfully", data: plant });
  } catch (error) {
    console.error("Error fetching single plant:", error);
    reply.code(500).send({ error: "Failed to fetch single plant" });
  }
};

export const getBillTypeChoice = async (req, reply) => {
  const { _id, billType, billNo } = req.query;

  if (!_id || !billType) {
    return reply.code(400).send({ message: "_id and billType are required" });
  }

  const periodicBillTypes = [
    "consultingFeesByOasis",
    "dsmAdviceBills",
    "forecastingAndSchedulingBills",
    "consultingFeesByEnrich",
    "amc",
  ];
  const electricityBillTypes = [
    "energyInvoice",
    "electricityBillForPlant",
    "challan",
  ];

  let fullPath = "";
  if (periodicBillTypes.includes(billType)) {
    fullPath = `periodicBills.${billType}`;
  } else if (electricityBillTypes.includes(billType)) {
    fullPath = `electricityBill.${billType}`;
  } else {
    return reply.code(400).send({ message: "Invalid billType provided" });
  }

  try {
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(_id) } },
      {
        $project: {
          filteredBills: {
            $filter: {
              input: `$${fullPath}`,
              as: "bill",
              cond: billNo
                ? { $eq: ["$$bill.billNo", parseInt(billNo)] }
                : { $toBool: true },
            },
          },
        },
      },
      {
        $addFields: {
          filteredBills: {
            $sortArray: {
              input: "$filteredBills",
              sortBy: { updatedAt: -1 },
            },
          },
        },
      },
    ];

    const result = await Electricity.aggregate(pipeline);

    if (!result.length || result[0].filteredBills.length === 0) {
      return reply.code(200).send([]);
    }

    return reply.code(200).send({
      message: "Bills fetched successfully",
      data: result[0].filteredBills,
    });
  } catch (error) {
    console.error("Aggregation error:", error.message, error.stack);
    return reply.code(500).send({
      error: "Failed to fetch bills using aggregation",
      details: error.message,
    });
  }
};

export const addBillForPlant = async (req, reply) => {
  try {
    const { _id, billType, finalAmount, startDate, endDate } = req.body;
    const file = req.file;

    console.log("Received file:", file);
    console.log("Received body:", req.body);

    if (!_id || !billType || !file || !finalAmount || !startDate || !endDate) {
      return reply.code(400).send({ message: "Missing required fields" });
    }

    // Determine subdocument path
    const periodicBillTypes = [
      "consultingFeesByOasis",
      "dsmAdviceBills",
      "forecastingAndSchedulingBills",
      "consultingFeesByEnrich",
      "amc",
    ];
    const electricityBillTypes = [
      "energyInvoice",
      "electricityBillForPlant",
      "challan",
    ];

    let fullPath = "";
    let useMonthlySchema = false;

    if (periodicBillTypes.includes(billType)) {
      fullPath = `periodicBills.${billType}`;
    } else if (electricityBillTypes.includes(billType)) {
      fullPath = `electricityBill.${billType}`;
      useMonthlySchema = true;
    } else {
      return reply.code(400).send({ message: "Invalid billType provided" });
    }

    // Upload to S3
    const fileBuffer = fs.readFileSync(file.path);
    const fileKey = `bills/${Date.now()}_${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));
    const receiptUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;

    // Delete local file
    fs.unlinkSync(file.path);

    // Prepare bill object
    const bill = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      finalAmount: Number(finalAmount),
      receiptUrl,
      isPaid: false,
    };

    if (useMonthlySchema) {
      // Add month & year
      const start = new Date(startDate);
      bill.month = start.toLocaleString('default', { month: 'long' });
      bill.year = start.getFullYear();
    } else {
      // Add billNo for periodicBills only
      bill.billNo = await getNextBillNo();
    }

    // Push into nested array
    const updateData = {};
    updateData[fullPath] = bill;

    const updatedDoc = await Electricity.findByIdAndUpdate(
      _id,
      { $push: updateData },
      { new: true }
    );

    if (!updatedDoc) {
      return reply.code(404).send({ message: "Plant not found" });
    }

    return reply.code(200).send({
      message: "Bill added successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error adding bill:", error);
    return reply.code(500).send({ message: "Failed to add bill", error: error.message });
  }
};

export const uploadPaymentScreenShot = async (req, reply) => {
  try {
    const { _id, billType, bill_id } = req.body;
    const file = req.file;

    if (!_id || !billType || !bill_id || !file) {
      return reply.code(400).send({ message: "Missing required fields" });
    }

    // Upload screenshot to S3
    const fileBuffer = fs.readFileSync(file.path);
    const fileKey = `payment_screenshots/${Date.now()}_${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));
    const paymentScreenshot = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;

    // Delete local file
    fs.unlinkSync(file.path);

    // Define bill path
    const periodicBillTypes = [
      "consultingFeesByOasis",
      "dsmAdviceBills",
      "forecastingAndSchedulingBills",
      "consultingFeesByEnrich",
      "amc",
    ];
    const electricityBillTypes = [
      "energyInvoice",
      "electricityBillForPlant",
      "challan",
    ];

    let arrayPath = '';
    let isPeriodic = false;

    if (periodicBillTypes.includes(billType)) {
      arrayPath = `periodicBills.${billType}`;
      isPeriodic = true;
    } else if (electricityBillTypes.includes(billType)) {
      arrayPath = `electricityBill.${billType}`;
    } else {
      return reply.code(400).send({ message: "Invalid billType" });
    }

    // Construct query & update
    const updateQuery = {
      _id,
      [`${arrayPath}._id`]: bill_id,
    };

    const updateOperation = {
      $set: {
        [`${arrayPath}.$.isPaid`]: true,
        [`${arrayPath}.$.paymentScreenshot`]: paymentScreenshot,
      },
    };

    const updatedDoc = await Electricity.findOneAndUpdate(updateQuery, updateOperation, {
      new: true,
    });

    if (!updatedDoc) {
      return reply.code(404).send({ message: "Bill not found or Plant not found" });
    }

    return reply.code(200).send({
      message: "Payment screenshot uploaded and bill marked as paid",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error uploading payment screenshot:", error);
    return reply.code(500).send({ message: "Internal Server Error", error: error.message });
  }
};