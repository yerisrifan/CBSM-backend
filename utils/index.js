const Canary = require("../models/canary.model");
const { Expo } = require("expo-server-sdk");

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

// Fungsi untuk mengupdate parent dan child
async function updateParentChild(
  oldParentId,
  newParentId,
  childId,
  parentType,
  session
) {
  if (oldParentId && oldParentId.toString() !== newParentId.toString()) {
    // Remove child from old parent's children list
    await Canary.findByIdAndUpdate(
      oldParentId,
      { $pull: { "rels.children": childId } },
      { session }
    );
  }

  if (newParentId) {
    // Add child to new parent's children list
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
  }
}

module.exports = {
  checkAndUpdateSpouses,
  removeSpouses,
  getAllRelatedCanaries,
  deleteAllRelatedCanaries,
  sendNotifications,
  updateParentChild,
};
