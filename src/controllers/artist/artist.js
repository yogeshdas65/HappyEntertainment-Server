import mongoose from "mongoose";
import { getNextBillNo } from "../../middleware/helper.js"; // adjust path as needed
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import  Artist  from "../../models/artist.js";

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
        message: `Missing required fields: ${missingFields.join(', ')}`,
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
      message: 'Artist created successfully',
      artist: savedArtist,
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getArtist = async (req, reply) => {
  try {
    const { name } = req.query;

    let filter = {};

    if (name) {
      filter = {
        $or: [
          { artistName: { $regex: name, $options: 'i' } },
          { companyNameOfArtist: { $regex: name, $options: 'i' } },
        ],
      };
    }

    const artists = await Artist.find(filter)
      .sort({ createdAt: -1 })
      // .populate('events'); // Uncomment if you want to populate events

    return reply.code(200).send({
      message: 'Artists fetched successfully',
      data: artists,
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
    return reply.code(500).send({
      message: 'Failed to fetch artists',
      error: error.message,
    });
  }
};
