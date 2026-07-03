import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './db';
import * as googleService from './google';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Runs the Morning Digest automation workflow.
 * Gathers unread emails, calendar events, tasks, and creates an AI summary.
 */
export async function runMorningDigest(userId: string): Promise<string> {
  console.log(`[AUTOMATION] Starting Morning Digest for user: ${userId}`);
  
  const job = await db.automationJob.create({
    data: {
      userId,
      type: 'DAILY_PLAN',
      status: 'RUNNING',
      scheduledTime: new Date(),
    },
  });

  try {
    // 1. Fetch unread emails
    let emailsSummary = 'No unread emails.';
    try {
      const gmail = await googleService.getGmailClient(userId);
      const res = await gmail.users.messages.list({ userId: 'me', q: 'is:unread', maxResults: 10 });
      const list = res.data.messages || [];
      if (list.length > 0) {
        const details = await Promise.all(
          list.map(async (msg) => {
            const mRes = await gmail.users.messages.get({ userId: 'me', id: msg.id || '' });
            const headers = mRes.data.payload?.headers || [];
            const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
            return `- From: ${from} | Subject: ${subject}`;
          })
        );
        emailsSummary = details.join('\n');
      }
    } catch (e: any) {
      console.error('Morning digest failed fetching emails:', e);
      emailsSummary = `Failed to retrieve emails: ${e.message || e}`;
    }

    // 2. Fetch Calendar schedule for today
    let calendarSummary = 'No meetings scheduled for today.';
    try {
      const calendar = await googleService.getCalendarClient(userId);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: todayStart.toISOString(),
        timeMax: todayEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      const list = res.data.items || [];
      if (list.length > 0) {
        calendarSummary = list
          .map((evt) => {
            const start = evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day';
            return `- ${start}: ${evt.summary}`;
          })
          .join('\n');
      }
    } catch (e: any) {
      console.error('Morning digest failed fetching calendar:', e);
      calendarSummary = `Failed to retrieve calendar: ${e.message || e}`;
    }

    // 3. Fetch pending local tasks
    let tasksSummary = 'No tasks in the database.';
    try {
      const pendingTasks = await db.task.findMany({
        where: { userId, status: 'PENDING' },
        orderBy: { priority: 'desc' },
      });
      if (pendingTasks.length > 0) {
        tasksSummary = pendingTasks
          .map((t) => `- [${t.priority}] ${t.title} ${t.dueDate ? `(Due: ${new Date(t.dueDate).toLocaleDateString()})` : ''}`)
          .join('\n');
      }
    } catch (e: any) {
      console.error('Morning digest failed fetching tasks:', e);
    }

    // 4. Send context to Gemini for a consolidated, premium daily layout
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
Generate a cinematic, premium "Morning Briefing" for Mallikarjun.
Greet him enthusiastically as Jarvis OS (AI Operating System).

Here is today's snapshot:

[UNREAD EMAILS]
${emailsSummary}

[TODAY'S CALENDAR]
${calendarSummary}

[PENDING TASKS]
${tasksSummary}

Instructions:
1. Provide a warm, premium greeting.
2. Outline key emails that need attention. Highlight if any sender seems urgent.
3. Call out today's schedule conflicts or key meetings.
4. Recommend a "Today's Focus" item based on their pending tasks.
5. Keep the formatting highly organized with clear emoji highlights. Avoid raw lists; make it flow beautifully.
`;

    const response = await model.generateContent(prompt);
    const resultText = response.response.text();

    // Save success in database
    await db.automationJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        runTime: new Date(),
        result: resultText,
      },
    });

    await db.log.create({
      data: {
        userId,
        type: 'AUTOMATION',
        status: 'INFO',
        message: 'Morning Digest run completed successfully.',
      },
    });

    return resultText;
  } catch (err: any) {
    console.error('Morning Digest Automation failed:', err);
    await db.automationJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        runTime: new Date(),
        result: `Error: ${err.message || err}`,
      },
    });
    await db.log.create({
      data: {
        userId,
        type: 'AUTOMATION',
        status: 'ERROR',
        message: `Morning Digest failed: ${err.message || err}`,
      },
    });
    throw err;
  }
}

/**
 * Runs the Evening Prep digest automation workflow.
 */
export async function runEveningPrep(userId: string): Promise<string> {
  console.log(`[AUTOMATION] Starting Evening Prep for user: ${userId}`);

  const job = await db.automationJob.create({
    data: {
      userId,
      type: 'EVENING_PREP',
      status: 'RUNNING',
      scheduledTime: new Date(),
    },
  });

  try {
    // 1. Fetch completed tasks today
    let tasksCompletedToday = 'No tasks marked completed today.';
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const completed = await db.task.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          updatedAt: { gte: todayStart },
        },
      });
      if (completed.length > 0) {
        tasksCompletedToday = completed.map((t) => `- ${t.title}`).join('\n');
      }
    } catch (e: any) {
      console.error('Evening prep failed fetching completed tasks:', e);
    }

    // 2. Fetch tomorrow's meetings
    let tomorrowCalendar = 'No meetings scheduled for tomorrow.';
    try {
      const calendar = await googleService.getCalendarClient(userId);
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: tomorrowStart.toISOString(),
        timeMax: tomorrowEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      const list = res.data.items || [];
      if (list.length > 0) {
        tomorrowCalendar = list
          .map((evt) => {
            const start = evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day';
            return `- ${start}: ${evt.summary}`;
          })
          .join('\n');
      }
    } catch (e: any) {
      console.error('Evening prep failed fetching calendar:', e);
    }

    // 3. Ask Gemini to compile the Prep Briefing
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
Generate a futuristic "Evening Preparedness Report" for Mallikarjun.
As Jarvis OS, summarize his productivity and outline what is in store for tomorrow.

Here is the evening snapshot:

[COMPLETED TODAY]
${tasksCompletedToday}

[TOMORROW'S SCHEDULE]
${tomorrowCalendar}

Instructions:
1. Greet him as Jarvis OS and congratulate him on completing the day's tasks.
2. Highlight tomorrow's schedule, calling out if they need to prepare files or wake up early for meetings.
3. Suggest 2-3 focus items for tomorrow.
4. Keep the presentation ultra-clean, elegant, and structured with emojis.
`;

    const response = await model.generateContent(prompt);
    const resultText = response.response.text();

    await db.automationJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        runTime: new Date(),
        result: resultText,
      },
    });

    await db.log.create({
      data: {
        userId,
        type: 'AUTOMATION',
        status: 'INFO',
        message: 'Evening Prep run completed successfully.',
      },
    });

    return resultText;
  } catch (err: any) {
    console.error('Evening Prep Automation failed:', err);
    await db.automationJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        runTime: new Date(),
        result: `Error: ${err.message || err}`,
      },
    });
    await db.log.create({
      data: {
        userId,
        type: 'AUTOMATION',
        status: 'ERROR',
        message: `Evening Prep failed: ${err.message || err}`,
      },
    });
    throw err;
  }
}
