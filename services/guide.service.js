const Guide = require("../models/guide.model");

class GuideService {
  static async createGuide(data) {
    const guide = new Guide(data);
    await guide.save();
    return guide;
  }

  static async getAllGuides() {
    return Guide.find().populate("author");
  }

  static async getGuideById(id) {
    return Guide.findById(id);
  }

  static async updateGuide(id, data) {
    return Guide.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  static async deleteGuide(id) {
    return Guide.findByIdAndDelete(id);
  }
}

module.exports = GuideService;
