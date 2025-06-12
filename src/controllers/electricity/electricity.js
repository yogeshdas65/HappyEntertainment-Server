import Electricity from "../../models/electricity.js";
import mongoose from "mongoose";

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
