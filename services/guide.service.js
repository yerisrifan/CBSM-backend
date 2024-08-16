const Guide = require("../models/guide.model");

class GuideService {
  static async createGuide(data) {
    const guide = new Guide(data);
    await guide.save();
    return guide;
  }

  static async getAllGuides({ limit, skip }) {
    try {
      // create filter if there guide.status and guide.status === "published" return all, but hidden if guide.status === "draft" and guide.status === "archived"
      const filter = {
        $or: [{ status: "published" }, { status: { $exists: false } }],
      };

      // buat filter agar guide yang tampil hanya dengan status archived
      //const filter = { status: "archived" };

      const guides = await Guide.find(filter)
        .populate("author")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      return { guides, total: guides.length };
    } catch (error) {
      throw new Error(`Failed to fetch guides: ${error.message}`);
    }
  }
  static async getGuideById(id) {
    return Guide.findById(id).populate("author").lean();
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
