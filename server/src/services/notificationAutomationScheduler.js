const notificationAutomationService = require("./notificationAutomationService");

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

let schedulerTimer = null;
let automationRunning = false;

const normalizeIntervalMs = (intervalMs) => {
  if (
    intervalMs === undefined ||
    intervalMs === null ||
    intervalMs === ""
  ) {
    return DEFAULT_INTERVAL_MS;
  }

  const normalizedInterval = Number(intervalMs);

  if (
    !Number.isFinite(normalizedInterval) ||
    normalizedInterval <= 0
  ) {
    throw new Error(
      "Notification automation interval must be a number greater than 0."
    );
  }

  return normalizedInterval;
};

const executeNotificationAutomation = async ({
  dueSoonHours,
} = {}) => {
  if (automationRunning) {
    console.log(
      "Notification automation skipped because a previous run is still in progress."
    );

    return {
      skipped: true,
      reason: "AUTOMATION_ALREADY_RUNNING",
    };
  }

  automationRunning = true;

  try {
    const result =
      await notificationAutomationService.runNotificationAutomation({
        dueSoonHours,
      });

    console.log(
      "Notification automation completed successfully.",
      JSON.stringify(result)
    );

    return {
      skipped: false,
      result,
    };
  } catch (error) {
    console.error(
      "Notification automation failed."
    );
    console.error(error);

    return {
      skipped: false,
      error,
    };
  } finally {
    automationRunning = false;
  }
};

const startNotificationAutomationScheduler = ({
  intervalMs = DEFAULT_INTERVAL_MS,
  dueSoonHours,
  runImmediately = true,
} = {}) => {
  if (schedulerTimer) {
    return {
      started: false,
      reason: "SCHEDULER_ALREADY_RUNNING",
    };
  }

  const normalizedIntervalMs =
    normalizeIntervalMs(intervalMs);

  if (runImmediately) {
    executeNotificationAutomation({
      dueSoonHours,
    }).catch((error) => {
      console.error(
        "Unexpected notification automation scheduler error."
      );
      console.error(error);
    });
  }

  schedulerTimer = setInterval(() => {
    executeNotificationAutomation({
      dueSoonHours,
    }).catch((error) => {
      console.error(
        "Unexpected notification automation scheduler error."
      );
      console.error(error);
    });
  }, normalizedIntervalMs);

  console.log(
    `Notification automation scheduler started. Interval: ${normalizedIntervalMs} ms.`
  );

  return {
    started: true,
    intervalMs: normalizedIntervalMs,
    dueSoonHours,
  };
};

const stopNotificationAutomationScheduler = () => {
  if (!schedulerTimer) {
    return {
      stopped: false,
      reason: "SCHEDULER_NOT_RUNNING",
    };
  }

  clearInterval(schedulerTimer);

  schedulerTimer = null;

  console.log(
    "Notification automation scheduler stopped."
  );

  return {
    stopped: true,
  };
};

module.exports = {
  DEFAULT_INTERVAL_MS,
  executeNotificationAutomation,
  startNotificationAutomationScheduler,
  stopNotificationAutomationScheduler,
};