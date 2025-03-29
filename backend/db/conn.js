const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "Uncommon2025", // ✅ Explicitly set the database name here
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB - Uncommon2025"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/*const mongoose = require("mongoose");
  require("dotenv").config();
  
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
    */
