import mongoose from "mongoose";
import { getNextBillNo } from "../../middleware/helper.js"; // adjust path as needed
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import  Sponsor  from "../../models/sponsor.js";
import EventSponsorPayment from "../../models/eventSponsorPayment.js";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const newSponsorCreation = async (req, reply) => {
  try {
    const {
      sponsorName,
      sponsorIndustry,
      phoneNumber,
      emailId,
      address,
      gst,
      events,
      eventPreparationFinished,
    } = req.body;

    // Basic validation (optional but recommended)
    if (!sponsorName || !phoneNumber || !emailId || !address || !gst) {
      return reply.status(400).send({ message: "Missing required fields" });
    }

    const newSponsor = new Sponsor({
      sponsorName,
      sponsorIndustry,
      phoneNumber,
      emailId,
      address,
      gst,
      events,
      eventPreparationFinished,
    });

    const savedSponsor = await newSponsor.save();

    reply.status(201).send({
      message: "Sponsor created successfully",
      sponsor: savedSponsor,
    });
  } catch (error) {
    console.error("Error creating sponsor:", error);
    reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const updateSponsor = async (req, reply) => {
  try {
    const { _id } = req.params;
    const {
      sponsorName,
      sponsorIndustry,
      phoneNumber,
      emailId,
      address,
      gst,
      eventPreparationFinished,
    } = req.body;

    // Basic validation (same as create)
    if (!sponsorName || !phoneNumber || !emailId || !address || !gst) {
      return reply.status(400).send({ message: "Missing required fields" });
    }

    const sponsor = await Sponsor.findById(_id);
    if (!sponsor) {
      return reply.status(404).send({ message: "Sponsor not found." });
    }

    // Update fields (except `events`)
    sponsor.sponsorName = sponsorName;
    sponsor.sponsorIndustry = sponsorIndustry || [];
    sponsor.phoneNumber = phoneNumber;
    sponsor.emailId = emailId;
    sponsor.address = address;
    sponsor.gst = gst;
    sponsor.eventPreparationFinished = eventPreparationFinished;

    const updatedSponsor = await sponsor.save();

    reply.status(200).send({
      message: "Sponsor updated successfully",
      sponsor: updatedSponsor,
    });
  } catch (error) {
    console.error("Error updating sponsor:", error);
    reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const getSponsors = async (req, reply) => {
  try {
    const { name, selectedRoles } = req.query;
    console.log("name:", name);
    const roles = Array.isArray(selectedRoles)
      ? selectedRoles
      : selectedRoles
      ? [selectedRoles]
      : [];

      console.log("selectedRoles:", typeof roles, roles); // might be string or array


    let filter = {};

    if (name) {
      filter = {
        $or: [
          { sponsorName: { $regex: name, $options: 'i' } },
          { emailId: { $regex: name, $options: 'i' } },
        ],
      };
    }

      // Filter by selectedRoles if provided
      if (roles.length > 0) {
        filter.sponsorIndustry = { $in: roles };
      }
  

    const sponsors = await Sponsor.find(filter)
      .sort({ createdAt: -1 })
      // .populate('events'); // Optional: remove if not needed

    return reply.code(200).send({
      message: 'Sponsors fetched successfully',
      data: sponsors,
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return reply.code(500).send({
      message: 'Failed to fetch sponsors',
      error: error.message,
    });
  }
};

export const getSponsorEventList = async (req, reply) => {
  try {
    const { _id, name } = req.query;

    if (!_id) {
      return reply.code(400).send({ message: "Sponsor ID (_id) is required" });
    }

    const sponsor = await Sponsor.findById(_id).populate({
      path: "events",
      options: { sort: { date: -1 } },
    });

    if (!sponsor) {
      return reply.code(404).send({ message: "Sponsor not found" });
    }

    let filteredEvents = sponsor.events;

    if (name) {
      const regex = new RegExp(name, "i"); // case-insensitive match
      filteredEvents = sponsor.events.filter((event) =>
        regex.test(event.eventName)
      );
    }

    return reply.code(200).send({
      message: "Sponsor fetched successfully",
      data: {
        ...sponsor.toObject(),
        events: filteredEvents, // only include filtered events
      },
    });
  } catch (error) {
    console.error("Error fetching sponsor events:", error);
    return reply.code(500).send({
      message: "Failed to fetch sponsor events",
      error: error.message,
    });
  }
};

export const getPaymentsOfSingleEventOfSponsor = async (req, reply) => {
  try {
    const { events_id, sponsor_id } = req.query;

    if (!events_id || !sponsor_id) {
      return reply.status(400).send({
        message: "Both events_id and sponsor_id are required",
      });
    }

    const payments = await EventSponsorPayment.find({ events_id, sponsor_id })
    .populate('events_id')   // Populate the event document
    .populate('sponsor_id');  // Populate the artist document

    console.log("Payments fetched:", payments);

    return reply.code(200).send({
      message: "Event payments fetched successfully",
      data: payments || [],
    });
  } catch (error) {
    console.error("Error fetching event payments:", error);
    return reply.status(500).send({
      message: "Something went wrong while fetching event payments",
      error: error.message,
    });
  }
};
