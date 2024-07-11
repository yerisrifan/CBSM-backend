const User = require("../models/user.model");
const fs = require("fs");

class UserService {
  static async getUserById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error getting user: ${error.message}`);
    }
  }

  static async getAllUsers() {
    // create filter show user with user_level !== 0
    const query = { user_level: { $ne: 0 } };
    return await User.find(query).sort({ createdAt: -1 }).lean();
  }

  static async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async updateUser(id, userData) {
    try {
      const oldUserData = await User.findById(id);
      if (userData.avatar && userData.avatar !== oldUserData.avatar) {
        fs.unlinkSync(oldUserData.avatar);
        console.log("Avatar deleted", oldUserData.avatar);
      }

      const user = await User.findByIdAndUpdate(id, userData, { new: true });

      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async deleteUser(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async updateUserFCMToken(id, fcm_token, deviceInfo) {
    try {
      return await User.findByIdAndUpdate(
        id,
        {
          $set: {
            notification: {
              fcm_token,
              os: deviceInfo.os,
              deviceName: deviceInfo.deviceName,
            },
          },
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating FCM token: ${error.message}`);
    }
  }
}

module.exports = UserService;
