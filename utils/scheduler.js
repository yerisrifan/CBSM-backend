const cron = require("node-cron");
const { updateEggStatus, sendNotificationEggHatched } = require(".");

// Run the check every day at midnight
// create schedule run every 6 hours

// 0 0 * * * - midnight
// */5 * * * * - every 5 minutes
// */6 * * * * - every 6 hours
// */12 * * * * - every 12 hours
// */24 * * * * - every 24 hours

cron.schedule("*/5 * * * *", async () => {
  console.log("Running daily egg check...");
  try {
    await updateEggStatus();
    console.log("Daily egg check completed successfully.");
  } catch (error) {
    console.error("Error during daily egg check:", error);
  }
});

cron.schedule("5 3 * * *", async () => {
  console.log("Running daily egg check...");
  try {
    await sendNotificationEggHatched();
    console.log("Daily egg check completed successfully.");
  } catch (error) {
    console.error("Error during daily egg check:", error);
  }
});
