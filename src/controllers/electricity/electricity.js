import Electricity from "../../models/electricity.js";

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
    reply.code(200).send({ message: "Plant fetched successfully", data: plant });
  } catch (error) {
    console.error("Error fetching single plant:", error);
    reply.code(500).send({ error: "Failed to fetch single plant" });
  }
};
