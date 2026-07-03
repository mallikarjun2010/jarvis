export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[JARVIS OS] Server booting... Initializing background automation daemon.');

    // Run the loop check every 5 minutes
    setInterval(async () => {
      try {
        const { db } = await import('./lib/db');
        const { runMorningDigest, runEveningPrep } = await import('./lib/automation');

        console.log('[DAEMON] Running background check for scheduled automations...');

        // Fetch users who have active Google OAuth tokens and have auto-digest enabled
        const users = await db.user.findMany({
          include: {
            settings: true,
            tokens: true,
          },
        });

        const now = new Date();
        const currentHour = now.getHours();

        for (const user of users) {
          // Skip if user does not have settings or Google authentication, or auto digest is disabled
          if (!user.settings?.autoDigest || user.tokens.length === 0) continue;

          // Define window thresholds for today
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          // 1. Morning Digest: Schedule at 8:00 AM (runs if between 8:00 AM and 11:00 AM and hasn't run today)
          if (currentHour >= 8 && currentHour < 11) {
            const alreadyRun = await db.automationJob.findFirst({
              where: {
                userId: user.id,
                type: 'DAILY_PLAN',
                createdAt: { gte: startOfToday },
              },
            });

            if (!alreadyRun) {
              console.log(`[DAEMON] Triggering auto Morning Digest for user: ${user.email}`);
              await runMorningDigest(user.id);
            }
          }

          // 2. Evening Prep: Schedule at 9:00 PM (runs if after 9:00 PM and hasn't run today)
          if (currentHour >= 21) {
            const alreadyRun = await db.automationJob.findFirst({
              where: {
                userId: user.id,
                type: 'EVENING_PREP',
                createdAt: { gte: startOfToday },
              },
            });

            if (!alreadyRun) {
              console.log(`[DAEMON] Triggering auto Evening Prep for user: ${user.email}`);
              await runEveningPrep(user.id);
            }
          }
        }
      } catch (err) {
        console.error('[DAEMON ERROR] Automated cron runner failed:', err);
      }
    }, 1000 * 60 * 5); // 5 minutes
  }
}
