const User = require("../models/user.model");
const Canary = require("../models/canary.model");
const Pair = require("../models/pair.model");
const Incubation = require("../models/incubation.model");
const Egg = require("../models/eggs.model");
const { Expo } = require("expo-server-sdk");
const mongoose = require("mongoose");

// inisiasi expo
const expo = new Expo({ useFcmV1: true });

// Function to check and update spouses
async function checkAndUpdateSpouses(fatherId, motherId) {
  try {
    // Check if father and mother are already spouses
    const [father, mother] = await Promise.all([
      Canary.findById(fatherId),
      Canary.findById(motherId),
    ]);

    // if father and mother are already spouses
    if (
      father.rels.spouses.includes(motherId) &&
      mother.rels.spouses.includes(fatherId)
    ) {
      // just update data.status to 1
      await Promise.all([
        Canary.updateOne({ _id: fatherId }, { "data.status": 1 }),
        Canary.updateOne({ _id: motherId }, { "data.status": 1 }),
      ]);
      return;
    }

    await Promise.all([
      Canary.updateOne(
        { _id: fatherId },
        { "data.status": 1, $push: { "rels.spouses": motherId } }
      ),
      Canary.updateOne(
        { _id: motherId },
        { "data.status": 1, $push: { "rels.spouses": fatherId } }
      ),
    ]);
  } catch (error) {
    console.error("Error in checkAndUpdateSpouses:", error);
    throw error;
  }
}

// Function to remove spouses from rels
async function removeSpouses(fatherId, motherId) {
  try {
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
  } catch (error) {
    console.error("Error in removeSpouses:", error);
    throw error;
  }
}

async function getAllRelatedCanaries(id) {
  const canary = await Canary.findOne({ id });
  if (!canary) {
    throw new Error("Canary not found");
  }

  let visited = new Set();
  let toVisit = [canary.id];
  let result = [];

  while (toVisit.length > 0) {
    const currentId = toVisit.pop();
    if (!visited.has(currentId.toString())) {
      visited.add(currentId.toString());
      const canary = await Canary.findOne({ id: currentId })
        .select("data.ring data.avatar data.gender data.seri rels id")
        .lean();
      if (canary) {
        canary.data.avatar = process.env.BASE_URL + "/" + canary.data.avatar;
        result.push(canary);

        const { spouses, children, father, mother } = canary.rels;

        if (spouses.length > 0) {
          spouses.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        }

        if (children.length > 0) {
          children.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        }

        if (father && !visited.has(father.toString())) {
          toVisit.push(father);
        }

        if (mother && !visited.has(mother.toString())) {
          toVisit.push(mother);
        }
      }
    }
  }

  return result;
}

async function deleteAllRelatedCanaries(_id) {
  const canary = await Canary.findOne({ _id });
  if (!canary) {
    throw new Error("Canary not found");
  }

  let visited = new Set();
  let toVisit = [canary.id];

  while (toVisit.length > 0) {
    const currentId = toVisit.pop();
    if (!visited.has(currentId.toString())) {
      visited.add(currentId.toString());
      const currentCanary = await Canary.findOne({ id: currentId });
      if (currentCanary) {
        const { spouses, children, father, mother } = currentCanary.rels;

        if (spouses && spouses.length > 0) {
          spouses.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        } else {
          // jika bukan array lakukan toVisit.push(spouses)
          if (spouses && !visited.has(spouses.toString())) {
            toVisit.push(spouses);
          }
        }

        if (children && children.length > 0) {
          children.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        } else {
          // jika bukan array lakukan toVisit.push(children)
          if (children && !visited.has(children.toString())) {
            toVisit.push(children);
          }
        }

        if (father && !visited.has(father.toString())) {
          toVisit.push(father);
        }

        if (mother && !visited.has(mother.toString())) {
          toVisit.push(mother);
        }

        // Hapus dokumen kenari dari basis data
        //await Canary.deleteOne({ id: currentId });

        // Perbarui relasi kenari yang lain agar tidak lagi merujuk pada kenari yang dihapus
        await Canary.updateMany(
          {
            $or: [
              { "rels.spouses": currentId },
              { "rels.father": currentId },
              { "rels.mother": currentId },
              { "rels.children": currentId },
            ],
          },
          {
            $pull: {
              "rels.spouses": currentId,
              "rels.children": currentId,
            },
            $unset: {
              "rels.father": currentId,
              "rels.mother": currentId,
            },
          }
        );
      }
    }
  }
  await Canary.findOneAndDelete(_id);
}

// Fungsi untuk mengirim notifikasi
async function sendNotifications(tokens, title, body, data = {}) {
  let messages = [];
  for (let token of tokens) {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: token,
      sound: "default",
      title: title,
      body: body,
      priority: "high",
      data: data,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log("notification sent ..." + ticketChunk);
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  }

  return tickets;
}

// Fungsi untuk mengupdate parent spouse dan child
async function updateParentChildAndSpouse(
  oldParentId,
  newParentId,
  childId,
  parentType,
  otherParentId,
  session
) {
  if (oldParentId && oldParentId.toString() !== newParentId.toString()) {
    // Menghapus anak dari daftar anak orangtua lama
    await Canary.findByIdAndUpdate(
      oldParentId,
      { $pull: { "rels.children": childId } },
      { session }
    );
  }

  if (newParentId) {
    const newParent = await Canary.findById(newParentId).session(session);

    // Menambahkan anak ke daftar anak orangtua baru
    await Canary.findByIdAndUpdate(
      newParentId,
      {
        $addToSet: { "rels.children": childId },
        ...(parentType === "father"
          ? { "data.gender": "M" }
          : { "data.gender": "F" }),
      },
      { session }
    );

    // Memeriksa dan menambahkan pasangan jika belum ada
    if (newParent.rels.spouses.length === 0 && otherParentId) {
      await Canary.findByIdAndUpdate(
        newParentId,
        { $addToSet: { "rels.spouses": otherParentId } },
        { session }
      );

      // Menambahkan pasangan ke orangtua lainnya juga
      await Canary.findByIdAndUpdate(
        otherParentId,
        {
          $addToSet: {
            "rels.spouses": newParentId,
            "rels.children": childId,
          },
          ...(parentType === "father"
            ? { "data.gender": "F" }
            : { "data.gender": "M" }),
        },
        { session }
      );
    }
  }
}

// Fungsi untuk menghapus user dan data terkait
async function deleteUserAndRelatedData(userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the user
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete Canaries
    await Canary.deleteMany({ owner: userId }).session(session);

    // Delete Pairs
    const pairs = await Pair.find({ owner: userId }).session(session);
    for (const pair of pairs) {
      await Incubation.deleteMany({ pair: pair._id }).session(session);
    }
    await Pair.deleteMany({ owner: userId }).session(session);

    // Delete Incubations
    const incubations = await Incubation.find({ owner: userId }).session(
      session
    );
    for (const incubation of incubations) {
      await Egg.deleteMany({ incubation: incubation._id }).session(session);
    }
    await Incubation.deleteMany({ owner: userId }).session(session);

    // Delete Eggs
    await Egg.deleteMany({ owner: userId }).session(session);

    // Delete User
    await User.findByIdAndDelete(userId).session(session);

    // Commit the transaction
    await session.commitTransaction();
    console.log(`User ${userId} and all related data deleted successfully`);
  } catch (error) {
    // If an error occurred, abort the transaction
    await session.abortTransaction();
    console.error("Error deleting user and related data:", error);
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
}

async function updateEggStatus() {
  const today = new Date();
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  try {
    const result = await Egg.updateMany(
      {
        status: "Incubating",
        laid_date: { $lte: fourteenDaysAgo },
      },
      {
        $set: {
          status: "Hatched",
          hatched_date: today,
        },
      }
    );

    console.log(`Updated ${result.nModified} eggs to Hatched status.`);
  } catch (error) {
    console.error("Error updating egg status:", error);
  }
}

async function sendNotificationEggHatched() {
  try {
    const hatchedEggs = await Egg.find({
      status: "Hatched",
      hatched_date: { $gte: today },
    }).populate("owner"); // Assuming you have an 'owner' field with a reference to the User model

    if (hatchedEggs.length === 0) {
      console.log("No hatched eggs found.");
      return;
    }

    for (const egg of hatchedEggs) {
      const title = "Egg Hatched";
      const body = `Your egg has hatched!`;
      const data = {
        egg_id: egg._id,
        status: "Hatched",
      };

      const response = await sendNotifications(
        [egg.owner.notification.fcm_token],
        title,
        body,
        data
      );
      console.log("Notification sent", response);
    }
  } catch (error) {
    console.error("Error sending egg hatched notifications:", error);
  }
}

module.exports = {
  checkAndUpdateSpouses,
  removeSpouses,
  getAllRelatedCanaries,
  deleteAllRelatedCanaries,
  sendNotifications,
  updateParentChildAndSpouse,
  deleteUserAndRelatedData,
  updateEggStatus,
  sendNotificationEggHatched,
};
