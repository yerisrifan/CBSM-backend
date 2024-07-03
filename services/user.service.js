const User = require("../models/user.model");

class UserService {
  static async getUserById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error getting user: ${error.message}`);
    }
  }

  static async getAllUsers() {
    try {
      return await User.find();
    } catch (error) {
      throw new Error(`Error getting users: ${error.message}`);
    }
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
      return await User.findByIdAndUpdate(id, userData, { new: true });
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

  static async updateUserFCMToken(id, fcm_token) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: { fcm_token } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating FCM token: ${error.message}`);
    }
  }
}

module.exports = UserService;
