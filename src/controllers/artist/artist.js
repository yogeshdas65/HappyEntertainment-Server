import mongoose from "mongoose";
import { getNextBillNo } from "../../middleware/helper.js"; // adjust path as needed
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import Artist from "../../models/artist.js";
import EventArtistPayment from "../../models/eventArtistPayment.js";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const newArtistCreation = async (req, reply) => {
  try {
    const {
      artistName,
      companyNameOfArtist,
      aadharCardNumber,
      pancardNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
      bankAccountType,
      gst,
      roles,
      events,
      eventPreparationFinished,
    } = req.body;

    // Basic validation
    const requiredFields = {
      artistName,
      companyNameOfArtist,
      aadharCardNumber,
      pancardNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
      bankAccountType,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return reply.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const newArtist = new Artist({
      artistName,
      companyNameOfArtist,
      aadharCardNumber,
      pancardNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
      bankAccountType,
      gst,
      roles,
      events,
      eventPreparationFinished,
    });

    const savedArtist = await newArtist.save();

    return reply.status(201).send({
      message: "Artist created successfully",
      artist: savedArtist,
    });
  } catch (error) {
    console.error("Error creating artist:", error);
    return reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const updateArtist = async (req, reply) => {
  try {
    const { _id } = req.params;
    const {
      artistName,
      companyNameOfArtist,
      aadharCardNumber,
      pancardNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
      bankAccountType,
      gst,
      roles,
      eventPreparationFinished,
    } = req.body;

    // Basic validation
    const requiredFields = {
      artistName,
      companyNameOfArtist,
      aadharCardNumber,
      pancardNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
      bankAccountType,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return reply.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const artist = await Artist.findById(_id);
    if (!artist) {
      return reply.status(404).send({ message: "Artist not found." });
    }

    // Update fields
    artist.artistName = artistName;
    artist.companyNameOfArtist = companyNameOfArtist;
    artist.aadharCardNumber = aadharCardNumber;
    artist.pancardNumber = pancardNumber;
    artist.bankAccountNumber = bankAccountNumber;
    artist.bankIfscCode = bankIfscCode;
    artist.bankAccountName = bankAccountName;
    artist.bankAccountType = bankAccountType;
    artist.gst = gst;
    artist.roles = roles || [];
    artist.eventPreparationFinished = eventPreparationFinished;

    const updatedArtist = await artist.save();

    return reply.status(200).send({
      message: "Artist updated successfully",
      artist: updatedArtist,
    });
  } catch (error) {
    console.error("Error updating artist:", error);
    return reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const getArtistList = async (req, reply) => {
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
          { artistName: { $regex: name, $options: "i" } },
          { companyNameOfArtist: { $regex: name, $options: "i" } },
        ],
      };
    }

    // Filter by selectedRoles if provided
    if (roles.length > 0) {
      filter.roles = { $in: roles };
    }

    const artists = await Artist.find(filter).sort({ createdAt: -1 });
    // .populate("events"); // Uncomment if you want to populate events

    return reply.code(200).send({
      message: "Artists fetched successfully",
      data: artists,
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return reply.code(500).send({
      message: "Failed to fetch artists",
      error: error.message,
    });
  }
};

export const getArtistEventList = async (req, reply) => {
  try {
    const { _id, name } = req.query;

    if (!_id) {
      return reply.code(400).send({ message: "Artist ID (_id) is required" });
    }

    const artist = await Artist.findById(_id).populate({
      path: "events",
      options: { sort: { date: -1 } },
    });

    if (!artist) {
      return reply.code(404).send({ message: "Artist not found" });
    }

    let filteredEvents = artist.events;
    if (name) {
      const regex = new RegExp(name, "i"); // case-insensitive
      filteredEvents = artist.events.filter((event) =>
        regex.test(event.eventName)
      );
    }

    return reply.code(200).send({
      message: "Artist fetched successfully",
      data: {
        ...artist.toObject(),
        events: filteredEvents, // return only filtered events
      },
    });
  } catch (error) {
    console.error("Error fetching artist events:", error);
    return reply.code(500).send({
      message: "Failed to fetch artist events",
      error: error.message,
    });
  }
};

export const getPaymentsOfSingleEventOfArtist = async (req, reply) => {
  try {
    const { events_id, artist_id } = req.query;

    if (!events_id || !artist_id) {
      return reply.status(400).send({
        message: "Both events_id and artist_id are required",
      });
    }

    const payments = await EventArtistPayment.find({ events_id, artist_id })
    .populate('events_id')   // Populate the event document
    .populate('artist_id');  // Populate the artist document

    return reply.code(200).send({
      message: "Event payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching event payments:", error);
    return reply.status(500).send({
      message: "Something went wrong while fetching event payments",
      error: error.message,
    });
  }
};
