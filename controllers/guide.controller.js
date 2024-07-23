const GuideService = require("../services/guide.service");

class GuideController {
  static async createGuide(req, res) {
    try {
      const guide = await GuideService.createGuide(req.body);
      res.status(201).send({ msg: "Guide created successfully", guide });
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async getAllGuides(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const { guides, total } = await GuideService.getAllGuides({
        limit,
        skip,
      });

      res.status(200).json({
        msg: "Guides fetched successfully",
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        guides,
      });
    } catch (error) {
      console.error("Error in getAllGuides:", error);
      res
        .status(500)
        .json({ msg: "Error fetching guides", error: error.message });
    }
  }

  static async getGuideById(req, res) {
    const _id = req.params.id;
    try {
      const guide = await GuideService.getGuideById(_id);
      if (!guide) {
        return res.status(404).send({ msg: "Guide not found" });
      }
      res.status(200).send({ msg: "Guide fetched successfully", guide });
    } catch (error) {
      res.status(500).send(error);
    }
  }

  static async updateGuide(req, res) {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["title", "content"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates!" });
    }
    try {
      const guide = await GuideService.updateGuide(req.params.id, req.body);
      if (!guide) {
        return res.status(404).send({ msg: "Guide not found" });
      }
      res.status(200).send({ msg: "Guide updated successfully", guide });
    } catch (error) {
      res.status(500).send(error);
    }
  }

  static async deleteGuide(req, res) {
    try {
      const guide = await GuideService.deleteGuide(req.params.id);
      if (!guide) {
        return res.status(404).send({ msg: "Guide not found" });
      }
      res.status(200).send({ msg: "Guide deleted successfully", guide });
    } catch (error) {
      res.status(500).send(error);
    }
  }
}

module.exports = GuideController;
