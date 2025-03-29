const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    Loyalty_Points: {
      type: Number,
      default: 0,
    },
    Total_Bids: {
      type: Number,
      default: 0,
    },
    ifAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "Users",
  },
);

module.exports = mongoose.model("User", userSchema);
