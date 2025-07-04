import mongoose from "mongoose";
import { getNextBillNo } from "../../middleware/helper.js"; // adjust path as needed
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import Event from "../../models/event.js";
import Artist from "../../models/artist.js";
import Sponsor from "../../models/sponsor.js";
import EventArtistPayment from "../../models/eventArtistPayment.js";
import EventSponsorPayment from "../../models/eventSponsorPayment.js";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const newEventCreation = async (req, reply) => {
  try {
    const { eventName, eventDate, artists, sponsors } = req.body;

    if (!eventName || !eventDate) {
      return reply
        .status(400)
        .send({ message: "Event name and date are required." });
    }

    if (artists && !Array.isArray(artists)) {
      return reply
        .status(400)
        .send({ message: "Artists must be an array of ObjectIds." });
    }

    if (sponsors && !Array.isArray(sponsors)) {
      return reply
        .status(400)
        .send({ message: "Sponsors must be an array of ObjectIds." });
    }

    const newEvent = new Event({
      eventName,
      eventDate,
      artists: artists || [],
      sponsors: sponsors || [],
    });
    const savedEvent = await newEvent.save();

    //payment
    for (let i = 0; i < artists.length; i++) {
      const newArtistPayment = new EventArtistPayment({
        events_id: savedEvent._id,
        artist_id: artists[i],
      });
      const savedArtistPayment = await newArtistPayment.save();

      await Artist.findByIdAndUpdate(artists[i], {
        $addToSet: { events: savedEvent._id }, // use $addToSet to avoid duplicates
      });
    }
    for (let i = 0; i < sponsors.length; i++) {
      const newSponsorPayment = new EventSponsorPayment({
        events_id: savedEvent._id,
        sponsor_id: sponsors[i],
      });
      const savedSponsorPayment = await newSponsorPayment.save();

      await Sponsor.findByIdAndUpdate(sponsors[i], {
        $addToSet: { events: savedEvent._id }, // use $addToSet to avoid duplicates
      });
    }

    return reply.status(201).send({
      message: "Event created successfully",
      data: savedEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const updateEvent = async (req, reply) => {
  try {
    const { _id } = req.params;
    const { eventName, eventDate, artists = [], sponsors = [] } = req.body;
    console.log(eventName, eventDate, artists, sponsors);

    if (!eventName || !eventDate) {
      return reply
        .status(400)
        .send({ message: "Event name and date are required." });
    }

    if (!Array.isArray(artists) || !Array.isArray(sponsors)) {
      return reply
        .status(400)
        .send({ message: "Artists and Sponsors must be arrays." });
    }

    // Fetch existing event
    const existingEvent = await Event.findById(_id);
    if (!existingEvent) {
      return reply.status(404).send({ message: "Event not found." });
    }

    // Old and new artist/sponsor ID sets
    const oldArtistIds = existingEvent.artists.map((id) => id.toString());
    const oldSponsorIds = existingEvent.sponsors.map((id) => id.toString());

    const newArtistIds = artists.map((id) => id.toString());
    const newSponsorIds = sponsors.map((id) => id.toString());

    // Find artists to add and remove
    const artistsToAdd = newArtistIds.filter(
      (id) => !oldArtistIds.includes(id)
    );
    const artistsToRemove = oldArtistIds.filter(
      (id) => !newArtistIds.includes(id)
    );

    // Find sponsors to add and remove
    const sponsorsToAdd = newSponsorIds.filter(
      (id) => !oldSponsorIds.includes(id)
    );
    const sponsorsToRemove = oldSponsorIds.filter(
      (id) => !newSponsorIds.includes(id)
    );

    // Update event
    existingEvent.eventName = eventName;
    existingEvent.eventDate = eventDate;
    existingEvent.artists = newArtistIds;
    existingEvent.sponsors = newSponsorIds;
    const updatedEvent = await existingEvent.save();

    // Update Artist references
    for (let id of artistsToAdd) {
      await Artist.findByIdAndUpdate(id, {
        $addToSet: { events: existingEvent._id },
      });
      await new EventArtistPayment({
        events_id: existingEvent._id,
        artist_id: id,
      }).save();
    }

    for (let id of artistsToRemove) {
      await Artist.findByIdAndUpdate(id, {
        $pull: { events: existingEvent._id },
      });
      await EventArtistPayment.deleteOne({
        events_id: existingEvent._id,
        artist_id: id,
      });
    }

    // Update Sponsor references
    for (let id of sponsorsToAdd) {
      await Sponsor.findByIdAndUpdate(id, {
        $addToSet: { events: existingEvent._id },
      });
      await new EventSponsorPayment({
        events_id: existingEvent._id,
        sponsor_id: id,
      }).save();
    }

    for (let id of sponsorsToRemove) {
      await Sponsor.findByIdAndUpdate(id, {
        $pull: { events: existingEvent._id },
      });
      await EventSponsorPayment.deleteOne({
        events_id: existingEvent._id,
        sponsor_id: id,
      });
    }

    return reply.status(200).send({
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return reply.status(500).send({ message: "Internal Server Error" });
  }
};

export const getEvents = async (req, reply) => {
  try {
    const { name } = req.query;

    let filter = {};

    if (name) {
      filter = {
        eventName: { $regex: name, $options: "i" },
      };
    }

    const events = await Event.find(filter)
      .sort({ updatedAt: -1 })
      .populate("artists")
      .populate("sponsors")
      .limit(20);

    return reply.code(200).send({
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return reply.code(500).send({
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

export const getPaymentsOfSingleEvent = async (req, reply) => {
  try {
    const { events_id } = req.query;

    if (!events_id) {
      return reply.status(400).send({ message: "Event ID is required" });
    }

    const artists = await EventArtistPayment.find({ events_id })
      .populate("artist_id")
      .populate("events_id");

    const sponsors = await EventSponsorPayment.find({ events_id })
      .populate("sponsor_id")
      .populate("events_id");

    return reply.code(200).send({
      message: "Event payments fetched successfully",
      data: {
        artists,
        sponsors,
      },
    });
  } catch (error) {
    console.error("Error fetching event payments:", error);
    return reply.status(500).send({
      message: "Something went wrong while fetching event payments",
    });
  }
};

export const updateArtistPaymentOfEvent = async (req, reply) => {
  try {
    const { _id, feesOfArtist, advanceFees, tds, finalAmount, paymentReceipt } =
      req.body;

    if (!_id) {
      return reply.status(400).send({ message: "Missing _id for update." });
    }

    const updateFields = {};

    // ✅ CONDITION 1: If paymentReceipt is present, ONLY update receipt + isPaid
    if (paymentReceipt) {
      updateFields.paymentReceipt = paymentReceipt;
      updateFields.isPaid = true;
    } else {
      // ✅ CONDITION 2: If no paymentReceipt, update only fee-related fields
      if (feesOfArtist !== undefined) {
        updateFields.feesOfArtist = Number(feesOfArtist);
      }
      if (advanceFees !== undefined) {
        updateFields.advanceFees = Number(advanceFees);
      }
      if (tds !== undefined) {
        updateFields.tds = Number(tds);
      }
      if (finalAmount !== undefined) {
        updateFields.finalAmount = Number(finalAmount);
      }
    }

    const updated = await EventArtistPayment.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return reply
        .status(404)
        .send({ message: "Artist payment record not found." });
    }

    return reply.send({
      message: "Artist payment updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating artist payment:", error);
    return reply.status(500).send({ message: "Internal server error." });
  }
};

export const updateSponsorPaymentOfEvent = async (req, reply) => {
  try {
    const {
      _id,
      donationBySponsor,
      advanceDonation,
      gst,
      finalAmount,
      paymentReceipt,
    } = req.body;

    if (!_id) {
      return reply.status(400).send({ message: "Missing _id for update." });
    }

    const updateFields = {};

    // ✅ CONDITION 1: If paymentReceipt is present, ONLY update receipt + isPaid
    if (paymentReceipt) {
      updateFields.paymentReceipt = paymentReceipt;
      updateFields.isPaid = true;
    } else {
      // ✅ CONDITION 2: If no paymentReceipt, update only fee-related fields
      if (donationBySponsor !== undefined) {
        updateFields.donationBySponsor = Number(donationBySponsor);
      }
      if (advanceDonation !== undefined) {
        updateFields.advanceDonation = Number(advanceDonation);
      }
      if (gst !== undefined) {
        updateFields.gst = Number(gst);
      }
      if (finalAmount !== undefined) {
        updateFields.finalAmount = Number(finalAmount);
      }
    }

    const updated = await EventSponsorPayment.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return reply
        .status(404)
        .send({ message: "Sponsor payment record not found." });
    }

    return reply.send({
      message: "Sponsor payment updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Sponsor payment:", error);
    return reply.status(500).send({ message: "Internal server error." });
  }
};

export const uploadPaymentReceipt = async (req, reply) => {
  try {
    const { _id, role } = req.body;
    const file = req.file;

    // Validate inputs
    if (!_id || !file || !role) {
      return reply
        .code(400)
        .send({ message: "Missing required fields (_id, file, role)" });
    }

    // Determine S3 folder
    const folder =
      role === "artist"
        ? "artist_payments"
        : role === "sponsor"
        ? "sponsor_payments"
        : role === "sponsor-invoice"
        ? "invoice_payment"
        : "other_payment";

    const fileKey = `${folder}/${Date.now()}_${file.originalname}`;
    const fileBuffer = fs.readFileSync(file.path);

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      // ACL: 'public-read',
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;

    // Delete local file
    fs.unlinkSync(file.path);

    let updatedPayment = null;

    if (role === "artist") {
      const paymentDoc = await EventArtistPayment.findById(_id);
      if (!paymentDoc) {
        return reply
          .code(404)
          .send({ message: "Artist payment record not found" });
      }

      const installmentNumber = paymentDoc.paymentReceipts.length + 1;

      paymentDoc.paymentReceipts.push({
        installmentNumber,
        receiptUrl: fileUrl,
      });

      updatedPayment = await paymentDoc.save();
    } else if (role === "sponsor") {
      const paymentDoc = await EventSponsorPayment.findById(_id);
      if (!paymentDoc) {
        return reply
          .code(404)
          .send({ message: "Sponsor payment record not found" });
      }

      const installmentNumber = paymentDoc.paymentReceipts.length + 1;

      paymentDoc.paymentReceipts.push({
        installmentNumber,
        receiptUrl: fileUrl,
      });

      updatedPayment = await paymentDoc.save();
    } else if (role === "sponsor-invoice") {
      const paymentInvoiceDoc = await EventSponsorPayment.findById(_id);
      if (!paymentInvoiceDoc) {
        return reply
          .code(404)
          .send({ message: "Sponsor payment record not found" });
      }

      paymentInvoiceDoc.invoiceBill = fileUrl;

      updatedPayment = await paymentInvoiceDoc.save();
    } else {
      return reply
        .code(400)
        .send({
          message:
            "Invalid role. Must be 'artist', 'sponsor', or 'sponsor-invoice'",
        });
    }

    return reply.code(200).send({
      message: "Payment receipt uploaded successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return reply.code(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
