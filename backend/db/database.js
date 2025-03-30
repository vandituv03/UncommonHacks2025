const User = require("../models/UserSchema");

const check_in = async (userId, pointsToAdd) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.Loyalty_Points += pointsToAdd;
    return await user.save();
  } catch (error) {
    console.error("Error in check_in:", error.message);
    throw error;
  }
};

module.exports = {
  check_in,
};
