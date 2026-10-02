function envInt(name, fallback) {
  const v = parseInt(process.env[name], 10)
  return Number.isFinite(v) && v >= 0 ? v : fallback
}

// WhatsApp runs "on demand": it connects only when a reminder has to go out and disconnects
// again once nothing has been sent for idleCloseMs. The login stays saved in MongoDB, so the
// next connection needs no QR scan. Between sends there is no open connection and no extra RAM.
export const config = {
  idleCloseMs: envInt('WHATSAPP_IDLE_CLOSE_SEC', 60) * 1000,

  // Connecting (and finishing a QR login) must complete within this time.
  launchTimeoutMs: envInt('WHATSAPP_LAUNCH_TIMEOUT_SEC', 90) * 1000,

  // QR screen: closed when nobody has looked at the page for qrIdleMs, or after qrMaxMs in total.
  qrIdleMs: envInt('WHATSAPP_QR_IDLE_SEC', 90) * 1000,
  qrMaxMs: envInt('WHATSAPP_QR_MAX_SEC', 300) * 1000,

  // Health check of an open connection; consecutive failures before it is dropped.
  watchdogIntervalMs: envInt('WHATSAPP_WATCHDOG_SEC', 60) * 1000,
  watchdogFailLimit: 2,

  sendTimeoutMs: 60 * 1000,
  // How long a send waits for the connection to come up.
  sendWaitReadyMs: envInt('WHATSAPP_SEND_WAIT_READY_SEC', 180) * 1000,

  // Reminders go out only between these hours (server local time), never at night.
  sendWindowStartHour: envInt('WHATSAPP_SEND_FROM_HOUR', 8),
  sendWindowEndHour: envInt('WHATSAPP_SEND_UNTIL_HOUR', 21),
  // Safety limits so the number is not flagged as a bulk sender. The rest waits for the next hour / day.
  maxPerDay: envInt('WHATSAPP_MAX_PER_DAY', 40),
  maxPerHour: envInt('WHATSAPP_MAX_PER_HOUR', 10),
  // Gap between two messages, randomised so the account does not look like a bot.
  sendGapMs: () => (process.env.WA_SEND_GAP_MS ? Number(process.env.WA_SEND_GAP_MS) : 4000 + Math.floor(Math.random() * 5000)),
  // Unexpected send errors are retried a few times ("WhatsApp offline" never counts as an attempt).
  maxAttempts: 3,
  retryDelayMs: 10 * 60 * 1000,

  // How often the server looks for reminders to queue and send.
  jobIntervalMs: envInt('WHATSAPP_JOB_INTERVAL_SEC', 300) * 1000,
}
