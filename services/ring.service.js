const Ring = require("../models/ring.model");

class RingService {
  static async getRingById(id) {
    try {
      return await Ring.findById(id);
    } catch (error) {
      throw new Error(`Error getting ring: ${error.message}`);
    }
  }
  static async getAllRings() {
    // Return all rings sorted by alphabetical order
    try {
      return await Ring.find().sort({ ring_code: 1 });
    } catch (error) {
      throw new Error(`Error getting rings: ${error.message}`);
    }
  }

  static async createRing(ringData) {
    try {
      const ring = new Ring(ringData);
      await ring.save();
      return ring;
    } catch (error) {
      throw new Error(`Error creating ring: ${error.message}`);
    }
  }
  // Create static async method updateRing
  static async updateRing(id, ringData) {
    try {
      // Find ring by id
      const ring = await Ring.findById(id);
      // If ring not found
      if (!ring) {
        // Throw new error
        throw new Error("Ring not found");
      }
      // Assign ringData to ring
      Object.assign(ring, ringData);
      // Await ring.save()
      await ring.save();
      // Return ring
      return ring;
    } catch (error) {
      // Catch error
      throw new Error(`Error updating ring: ${error.message}`);
    }
  }
  // Create static async method deleteRing
  static async deleteRing(id) {
    try {
      // Find ring by id
      const ring = await Ring.findById(id);
      // If ring not found
      if (!ring) {
        // Throw new error
        throw new Error("Ring not found");
      }
      // Await ring.remove()
      await ring.remove();
    } catch (error) {
      // Catch error
      throw new Error(`Error deleting ring: ${error.message}`);
    }
  }
}
// Export RingService

module.exports = RingService;
