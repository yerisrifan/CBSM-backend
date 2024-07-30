const cron = require("node-cron");

// Run the check every day at midnight
// create schedule run every 6 hours

// 0 0 * * * - midnight
// */5 * * * * - every 5 minutes
// */6 * * * * - every 6 hours
// */12 * * * * - every 12 hours

// const checkEggs = require("./checkEggs");

cron.schedule("0 */6 * * *", async () => {
  console.log("Running daily egg check...");
  try {
    //await checkEggs();
    console.log("Daily egg check completed successfully.");
  } catch (error) {
    console.error("Error during daily egg check:", error);
  }
});
