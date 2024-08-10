const { Expo } = require("expo-server-sdk");
const winston = require("winston");
const User = require("../models/user.model");

// inisiasi expo
const expo = new Expo();

// inisiasi logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// fungsi untuk membagi notifikasi menjadi chunk
const chunkMessages = (messages) => {
  const chunks = [];
  let chunk = [];
  messages.forEach((message) => {
    chunk.push(message);
    if (chunk.length === 100) {
      chunks.push(chunk);
      chunk = [];
    }
  });
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
};

// fungsi untuk mengirim notifikasi dengan logika retry
async function sendNotificationsWithRetry(messages, maxRetries = 3) {
  let retriesLeft = maxRetries;
  let failedMessages = messages;

  while (retriesLeft > 0 && failedMessages.length > 0) {
    logger.info(
      `Attempt ${maxRetries - retriesLeft + 1} to send ${
        failedMessages.length
      } messages`
    );

    let chunks = chunkMessages(failedMessages);
    let tickets = [];
    failedMessages = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error("Error sending chunk:", error);
        failedMessages.push(...chunk);
      }
    }

    let receiptIds = tickets
      .filter((ticket) => ticket.id)
      .map((ticket) => ticket.id);
    let receiptIdChunks = chunkMessages(receiptIds);

    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        for (let [receiptId, receipt] of Object.entries(receipts)) {
          if (receipt.status === "error") {
            logger.error(`Error for receipt ${receiptId}:`, receipt);
            let originalMessage = messages.find((msg) => msg.id === receiptId);
            if (originalMessage) {
              failedMessages.push(originalMessage);
            }
          }
        }
      } catch (error) {
        logger.error("Error getting receipts:", error);
      }
    }

    retriesLeft--;
    if (failedMessages.length > 0 && retriesLeft > 0) {
      logger.info(
        `Retrying ${failedMessages.length} failed messages in 5 seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }

  if (failedMessages.length > 0) {
    logger.error(
      `Failed to send ${failedMessages.length} messages after ${maxRetries} attempts`
    );
  }
}

// Function to send notification to all users
async function sendNotificationToAllUsers(title, body) {
  try {
    const users = await User.find({
      "notification.fcm_token": { $exists: true, $ne: null },
    });

    let messages = [];
    for (let user of users) {
      if (Expo.isExpoPushToken(user.notification.fcm_token)) {
        messages.push({
          to: user.notification.fcm_token,
          sound: "default",
          title: title,
          body: body,
          data: { withSome: "data" },
          id: user._id.toString(), // Add an ID to track this message
        });
      } else {
        logger.warn(`Invalid Expo push token for user ${user._id}`);
      }
    }

    await sendNotificationsWithRetry(messages);
    logger.info("Finished sending notifications to all users");
  } catch (error) {
    logger.error(`Error sending notification to all users: ${error.message}`);
    throw error;
  }
}

async function sendNotifications(tokens, title, body) {
  try {
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: title,
      body: body,
      data: { withSome: "data" },
    }));
    await sendNotificationsWithRetry(messages);
    logger.info("Finished sending notifications");
  } catch (error) {
    logger.error(`Error sending notifications: ${error.message}`);
    throw error;
  }
}

async function sendNotificationToUserById(userId, title, body) {
  try {
    const user = await User.findById(userId);

    if (!user || !user.notification || !user.notification.fcm_token) {
      throw new Error("User not found or has no valid FCM token");
    }

    if (!Expo.isExpoPushToken(user.notification.fcm_token)) {
      throw new Error("Invalid Expo push token");
    }

    let message = {
      to: user.notification.fcm_token,
      sound: "default",
      title: title,
      body: body,
      data: { withSome: "data" },
      id: userId,
    };

    await sendNotificationsWithRetry([message]);
    logger.info(`Finished sending notification to user ${userId}`);
  } catch (error) {
    logger.error(
      `Error sending notification to user ${userId}: ${error.message}`
    );
    throw error;
  }
}

async function refreshFCMTokens() {
  logger.info("Starting FCM token refresh");
  try {
    const users = await User.find({
      "notification.fcm_token": { $exists: true, $ne: null },
    });
    for (let user of users) {
      if (!Expo.isExpoPushToken(user.notification.fcm_token)) {
        logger.warn(`Invalid FCM token for user ${user._id}, removing token`);
        user.notification.fcm_token = null;
        await user.save();
      }
    }
    logger.info("Finished FCM token refresh");
  } catch (error) {
    logger.error(`Error refreshing FCM tokens: ${error.message}`);
  }
}

async function sendNotificationEggHatched() {
  try {
    const hatchedEggs = await Egg.find({
      status: "Hatched",
      //hatched_date: { $gte: today },
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
  sendNotificationToAllUsers,
  sendNotificationToUserById,
  refreshFCMTokens,
  sendNotifications,
  sendNotificationEggHatched,
};
