const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const db_url = process.env.MONGO_URI || "mongodb://localhost:27017";
    await mongoose.connect(db_url+"/codeIDE");
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = connectDB;