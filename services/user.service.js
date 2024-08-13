const User = require("../models/user.model");
const fs = require("fs");
const { sendNotifications } = require("../utils/notification");

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
    const query = { user_level: { $ne: 0 } }; // filter for user_level !== 0
    return await User.find().sort({ createdAt: -1 }).lean();
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
      const user = await User.findById(id);

      if (!user) {
        throw new Error("User not found");
      }

      if (userData.avatar && userData.avatar !== user.avatar) {
        await this.removeOldAvatar(user.avatar);
      }

      Object.assign(user, userData);
      await user.save();

      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async removeOldAvatar(avatarPath) {
    try {
      if (avatarPath && fs.existsSync(avatarPath)) {
        await fs.promises.unlink(avatarPath);
      }
    } catch (error) {
      console.error(`Error removing old avatar: ${error.message}`);
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

  static async sendNotificationToAllUsers(title, body) {
    try {
      const users = await User.find();
      users.forEach((user) => {
        if (user.notification.fcm_token) {
          sendNotifications([user.notification.fcm_token], title, body);
        }
      });
    } catch (error) {
      throw new Error(
        `Error sending notification to all users: ${error.message}`
      );
    }
  }
}

module.exports = UserService;
