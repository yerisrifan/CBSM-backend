// utils/index.js
const Canary = require("../models/canary.model");

// Function to check and update spouses
async function checkAndUpdateSpouses(fatherId, motherId) {
  await Promise.all([
    Canary.updateOne(
      { _id: fatherId },
      { status: 1, $push: { "rels.spouses": motherId } }
    ),
    Canary.updateOne(
      { _id: motherId },
      { status: 1, $push: { "rels.spouses": fatherId } }
    ),
  ]);
}

// Function to remove spouses from rels
async function removeSpouses(fatherId, motherId) {
  await Promise.all([
    Canary.updateOne(
      { _id: fatherId },
      { $pull: { "rels.spouses": motherId } }
    ),
    Canary.updateOne(
      { _id: motherId },
      { $pull: { "rels.spouses": fatherId } }
    ),
  ]);
}

module.exports = checkAndUpdateSpouses;

module.exports = {
  checkAndUpdateSpouses,
  removeSpouses,
};
