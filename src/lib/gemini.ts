import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { db } from './db';
import { getMemoryPromptContext, saveMemory } from './memory';
import * as googleService from './google';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Define standard tools for Gmail, Calendar, Sheets, Drive, Docs, Tasks, and Memory
const toolDeclarations: FunctionDeclaration[] = [
  // --- GMAIL TOOLS ---
  {
    name: 'list_unread_emails',
    description: 'Retrieves a summary list of the user\'s latest unread emails.',
    parameters: {
      type: 'OBJECT',
      properties: {
        maxResults: { type: 'INTEGER', description: 'Max number of emails to fetch (default: 5)' }
      }
    }
  },
  {
    name: 'search_emails',
    description: 'Searches Gmail emails using a query string (e.g. "from:Rahul invoice").',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Gmail search query string' },
        maxResults: { type: 'INTEGER', description: 'Max results (default: 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_email_details',
    description: 'Fetches full details including headers and body text of a specific email by ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        messageId: { type: 'STRING', description: 'The unique Gmail message ID' }
      },
      required: ['messageId']
    }
  },
  {
    name: 'send_email',
    description: 'Sends a brand new email to a recipient.',
    parameters: {
      type: 'OBJECT',
      properties: {
        to: { type: 'STRING', description: 'Recipient email address' },
        subject: { type: 'STRING', description: 'Subject line' },
        body: { type: 'STRING', description: 'Body content of the email' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'reply_to_email',
    description: 'Replies to an existing email thread using the Gmail message ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        messageId: { type: 'STRING', description: 'ID of the email to reply to' },
        replyBody: { type: 'STRING', description: 'Content of the reply message' }
      },
      required: ['messageId', 'replyBody']
    }
  },

  // --- CALENDAR TOOLS ---
  {
    name: 'list_calendar_events',
    description: 'Lists Google Calendar events for a specific time range.',
    parameters: {
      type: 'OBJECT',
      properties: {
        timeMin: { type: 'STRING', description: 'ISO string starting date (e.g. 2026-07-01T00:00:00Z)' },
        timeMax: { type: 'STRING', description: 'ISO string ending date (e.g. 2026-07-02T23:59:59Z)' }
      }
    }
  },
  {
    name: 'create_calendar_event',
    description: 'Creates an event in the user\'s Google Calendar.',
    parameters: {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING', description: 'Event title' },
        startTime: { type: 'STRING', description: 'Start time ISO string (e.g. 2026-07-02T16:00:00+05:30)' },
        endTime: { type: 'STRING', description: 'End time ISO string (e.g. 2026-07-02T17:00:00+05:30)' },
        description: { type: 'STRING', description: 'Optional meeting notes or description' }
      },
      required: ['summary', 'startTime', 'endTime']
    }
  },

  // --- DRIVE / DOCS TOOLS ---
  {
    name: 'list_drive_files',
    description: 'Searches or lists files in the user\'s Google Drive.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Optional search query, e.g. name contains "Budget"' },
        maxResults: { type: 'INTEGER', description: 'Max results (default: 10)' }
      }
    }
  },
  {
    name: 'read_drive_file',
    description: 'Reads the text content of a Google Doc or text file from Drive.',
    parameters: {
      type: 'OBJECT',
      properties: {
        fileId: { type: 'STRING', description: 'The Google Drive file ID' }
      },
      required: ['fileId']
    }
  },
  {
    name: 'create_google_doc',
    description: 'Creates a new Google Doc with specified title and content.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Title of the Google Doc' },
        content: { type: 'STRING', description: 'Initial body text content' }
      },
      required: ['title', 'content']
    }
  },

  // --- SHEETS TOOLS ---
  {
    name: 'append_sheet_row',
    description: 'Appends a list of cells (row) to a Google Sheet.',
    parameters: {
      type: 'OBJECT',
      properties: {
        spreadsheetId: { type: 'STRING', description: 'The Google Sheets spreadsheet ID' },
        range: { type: 'STRING', description: 'The sheet range or name (e.g., "Sheet1!A:Z" or "Sheet1")' },
        values: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Array of strings representing the cells in the row'
        }
      },
      required: ['spreadsheetId', 'range', 'values']
    }
  },

  // --- LOCAL TASKS ---
  {
    name: 'list_local_tasks',
    description: 'Gets the user\'s pending and completed tasks list from the local DB.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'create_local_task',
    description: 'Creates a new task in the local tasks list database.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Task title' },
        description: { type: 'STRING', description: 'Task notes/details' },
        dueDate: { type: 'STRING', description: 'Due date ISO string (optional)' },
        priority: { type: 'STRING', description: 'LOW, MEDIUM, or HIGH (default: MEDIUM)' }
      },
      required: ['title']
    }
  },
  {
    name: 'complete_local_task',
    description: 'Marks a local task as COMPLETED in the database by ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'The local database task ID' }
      },
      required: ['taskId']
    }
  },

  // --- MEMORY ---
  {
    name: 'add_long_term_memory',
    description: 'Stores a custom fact, project detail, deadline, or user preference in long term memory.',
    parameters: {
      type: 'OBJECT',
      properties: {
        content: { type: 'STRING', description: 'The information to remember' },
        category: {
          type: 'STRING',
          description: 'PEOPLE, PROJECT, DEADLINE, PREFERENCE, or GENERAL'
        },
        tags: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'List of tags to associate with this memory'
        }
      },
      required: ['content', 'category']
    }
  }
];

/**
 * Maps function calls requested by Gemini to their actual local handler executions.
 */
async function executeTool(userId: string, functionName: string, args: any) {
  console.log(`[AGENT TOOL] Executing: ${functionName} with args:`, args);
  
  try {
    switch (functionName) {
      // --- GMAIL ---
      case 'list_unread_emails': {
        const gmail = await googleService.getGmailClient(userId);
        const max = args.maxResults || 5;
        const res = await gmail.users.messages.list({ userId: 'me', q: 'is:unread', maxResults: max });
        const list = res.data.messages || [];
        const details = await Promise.all(
          list.map(async (msg) => {
            try {
              const mRes = await gmail.users.messages.get({ userId: 'me', id: msg.id || '' });
              const headers = mRes.data.payload?.headers || [];
              const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
              const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
              const snippet = mRes.data.snippet || '';
              return { id: msg.id, from, subject, snippet };
            } catch (err) {
              console.warn(`Failed to retrieve unread email ${msg.id}:`, err);
              return { id: msg.id, from: 'Error reading message details', subject: 'Inaccessible', snippet: '' };
            }
          })
        );
        return { success: true, count: details.length, emails: details };
      }

      case 'search_emails': {
        const gmail = await googleService.getGmailClient(userId);
        const max = args.maxResults || 5;
        const res = await gmail.users.messages.list({ userId: 'me', q: args.query, maxResults: max });
        const list = res.data.messages || [];
        const details = await Promise.all(
          list.map(async (msg) => {
            try {
              const mRes = await gmail.users.messages.get({ userId: 'me', id: msg.id || '' });
              const headers = mRes.data.payload?.headers || [];
              const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
              const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
              const snippet = mRes.data.snippet || '';
              return { id: msg.id, from, subject, snippet };
            } catch (err) {
              console.warn(`Failed to retrieve search email ${msg.id}:`, err);
              return { id: msg.id, from: 'Error reading message details', subject: 'Inaccessible', snippet: '' };
            }
          })
        );
        return { success: true, query: args.query, count: details.length, emails: details };
      }

      case 'get_email_details': {
        const gmail = await googleService.getGmailClient(userId);
        const mRes = await gmail.users.messages.get({ userId: 'me', id: args.messageId });
        const headers = mRes.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h) => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name === 'Date')?.value || '';
        
        // Simple body extraction helper
        let body = '';
        const payload = mRes.data.payload;
        if (payload?.body?.data) {
          body = Buffer.from(payload.body.data, 'base64').toString('utf8');
        } else if (payload?.parts) {
          const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts[0];
          if (part?.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf8');
          }
        }
        if (!body) body = mRes.data.snippet || 'No body content.';
        
        return { id: args.messageId, from, subject, date, body };
      }

      case 'send_email': {
        const gmail = await googleService.getGmailClient(userId);
        const utf8Subject = `=?utf-8?B?${Buffer.from(args.subject).toString('base64')}?=`;
        const emailContent = [
          `To: ${args.to}`,
          `Subject: ${utf8Subject}`,
          'Content-Type: text/plain; charset=utf-8',
          'MIME-Version: 1.0',
          '',
          args.body
        ].join('\n');

        const base64EncodedEmail = Buffer.from(emailContent)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: base64EncodedEmail,
          },
        });
        return { success: true, to: args.to, subject: args.subject, message: 'Email sent successfully.' };
      }

      case 'reply_to_email': {
        const gmail = await googleService.getGmailClient(userId);
        // Get details of original email to construct subject/threadId
        const originalMsg = await gmail.users.messages.get({ userId: 'me', id: args.messageId });
        const headers = originalMsg.data.payload?.headers || [];
        const originalSubject = headers.find((h) => h.name === 'Subject')?.value || 'Re:';
        const subjectLine = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
        const toVal = headers.find((h) => h.name === 'From')?.value || '';
        const threadId = originalMsg.data.threadId || args.messageId;

        const emailContent = [
          `To: ${toVal}`,
          `Subject: =?utf-8?B?${Buffer.from(subjectLine).toString('base64')}?=`,
          `In-Reply-To: ${args.messageId}`,
          `References: ${args.messageId}`,
          'Content-Type: text/plain; charset=utf-8',
          'MIME-Version: 1.0',
          '',
          args.replyBody
        ].join('\n');

        const base64EncodedEmail = Buffer.from(emailContent)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: base64EncodedEmail,
            threadId: threadId,
          },
        });
        return { success: true, message: 'Reply sent successfully.', threadId };
      }

      // --- CALENDAR ---
      case 'list_calendar_events': {
        const calendar = await googleService.getCalendarClient(userId);
        const tMin = args.timeMin || new Date(Date.now() - 3600000 * 24).toISOString(); // Default yesterday
        const tMax = args.timeMax || new Date(Date.now() + 3600000 * 24 * 7).toISOString(); // Default next 7 days
        
        const res = await calendar.events.list({
          calendarId: 'primary',
          timeMin: tMin,
          timeMax: tMax,
          singleEvents: true,
          orderBy: 'startTime',
        });
        
        const events = (res.data.items || []).map(evt => ({
          id: evt.id,
          summary: evt.summary,
          start: evt.start?.dateTime || evt.start?.date,
          end: evt.end?.dateTime || evt.end?.date,
          description: evt.description,
        }));
        
        return { count: events.length, events };
      }

      case 'create_calendar_event': {
        const calendar = await googleService.getCalendarClient(userId);
        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: args.summary,
            description: args.description || 'Created by Jarvis OS Assistant',
            start: { dateTime: args.startTime },
            end: { dateTime: args.endTime },
          },
        });
        return { success: true, eventId: res.data.id, htmlLink: res.data.htmlLink, summary: args.summary };
      }

      // --- DRIVE / DOCS ---
      case 'list_drive_files': {
        const drive = await googleService.getDriveClient(userId);
        const res = await drive.files.list({
          q: args.query || undefined,
          pageSize: args.maxResults || 10,
          fields: 'files(id, name, mimeType, webViewLink)',
        });
        return { success: true, files: res.data.files || [] };
      }

      case 'read_drive_file': {
        const drive = await googleService.getDriveClient(userId);
        const meta = await drive.files.get({ fileId: args.fileId, fields: 'mimeType, name' });
        const mime = meta.data.mimeType || '';
        
        if (mime === 'application/vnd.google-apps.document') {
          // If Google Doc, fetch via Docs API
          const docs = await googleService.getDocsClient(userId);
          const docRes = await docs.documents.get({ documentId: args.fileId });
          // Compile text content from body paragraphs
          let content = '';
          const bodyParts = docRes.data.body?.content || [];
          for (const item of bodyParts) {
            if (item.paragraph) {
              const elements = item.paragraph.elements || [];
              for (const el of elements) {
                if (el.textRun?.content) {
                  content += el.textRun.content;
                }
              }
            }
          }
          return { name: meta.data.name, content };
        } else {
          // Normal file, download raw media string
          const res = await drive.files.get({ fileId: args.fileId, alt: 'media' }, { responseType: 'text' });
          return { name: meta.data.name, content: res.data };
        }
      }

      case 'create_google_doc': {
        const docs = await googleService.getDocsClient(userId);
        const drive = await googleService.getDriveClient(userId);
        
        // 1. Create document meta
        const doc = await docs.documents.create({
          requestBody: {
            title: args.title,
          },
        });
        
        const docId = doc.data.documentId;
        if (!docId) throw new Error('Google Doc creation returned empty ID.');

        // 2. Insert the initial content text
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: args.content,
                },
              },
            ],
          },
        });

        // 3. Retrieve link
        const fileMeta = await drive.files.get({ fileId: docId, fields: 'webViewLink' });
        return { success: true, documentId: docId, url: fileMeta.data.webViewLink, title: args.title };
      }

      // --- SHEETS ---
      case 'append_sheet_row': {
        const sheets = await googleService.getSheetsClient(userId);
        const res = await sheets.spreadsheets.values.append({
          spreadsheetId: args.spreadsheetId,
          range: args.range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [args.values],
          },
        });
        return { success: true, spreadsheetId: args.spreadsheetId, updatedCells: res.data.updates?.updatedCells };
      }

      // --- LOCAL DB TASKS ---
      case 'list_local_tasks': {
        const tasks = await db.task.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        return { count: tasks.length, tasks };
      }

      case 'create_local_task': {
        const date = args.dueDate ? new Date(args.dueDate) : null;
        const task = await db.task.create({
          data: {
            userId,
            title: args.title,
            description: args.description || '',
            dueDate: date,
            priority: args.priority || 'MEDIUM',
          },
        });
        return { success: true, taskId: task.id, title: task.title, status: task.status };
      }

      case 'complete_local_task': {
        await db.task.updateMany({
          where: { id: args.taskId, userId },
          data: { status: 'COMPLETED' },
        });
        return { success: true, taskId: args.taskId, status: 'COMPLETED' };
      }

      // --- MEMORY ---
      case 'add_long_term_memory': {
        const memory = await saveMemory(userId, {
          category: args.category,
          content: args.content,
          tags: args.tags,
        });
        return { success: true, memoryId: memory.id, content: memory.content };
      }

      default:
        throw new Error(`Tool handler for function '${functionName}' not implemented.`);
    }
  } catch (err: any) {
    console.error(`Error executing tool ${functionName}:`, err);
    await db.log.create({
      data: {
        userId,
        type: 'GOOGLE_API',
        status: 'ERROR',
        message: `Tool ${functionName} execution failed: ${err.message || err}`,
      },
    });
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Runs the complete Gemini API conversational loop, performing recursive tool calling as needed.
 */
export async function runAgentChat(
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<{ content: string; thoughts: string }> {
  // 1. Fetch relevant long-term memory for contextual injection
  const memoryContext = await getMemoryPromptContext(userId, userMessage);
  
  // 2. Fetch recent conversation messages history
  const recentMessages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 12, // Last 12 messages for quick context
  });

  const history = recentMessages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Create system prompt
  const systemInstruction = `You are Jarvis OS, a futuristic, premium, and highly capable digital OS personal assistant designed for Mallikarjun (referred to as "Mallikarjun").
You are connected to Mallikarjun's Google account and can query or perform actions on Gmail, Google Calendar, Sheets, Drive, Docs, as well as manage a local Tasks database and Memory bank.

CRITICAL INSTRUCTIONS:
1. Always analyze and perform multi-step planning. When asked a complex query, run tools sequentially or in parallel, reflect on the outputs, and proceed.
2. In ALL of your replies, you MUST output an internal monologue/thinking process describing your reasoning, observations, plans, and evaluation of tool outputs. 
   Wrap your inner monologue inside a <thoughts>...</thoughts> tag at the very beginning of your response.
   Example layout:
   <thoughts>
   User is asking to schedule a meeting. First, check today's schedule for conflicts.
   I will call list_calendar_events.
   </thoughts>
   I will check your calendar now.

3. Keep the actual user-facing text (outside <thoughts> tags) clean, refined, cinematic, and professional.
4. If a tool call fails, explain why and attempt an alternative route (Error Recovery/Reflection).
5. Current local date/time context: ${new Date().toLocaleString()}

${memoryContext}`;

  // Initialize Gemini model with tools at the model level
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
    tools: [{ functionDeclarations: toolDeclarations }],
  });

  // Start chat
  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2000,
    },
  });

  console.log(`[AGENT CHAT] Starting run loop for user message: "${userMessage}"`);
  
  // Send the user message and start the loop
  let result = await chat.sendMessage(userMessage);
  let functionCalls = result.response.functionCalls();

  // Loop as long as Gemini wants to call tools
  let loopLimit = 8; // Prevent infinite tool call loops
  while (functionCalls && functionCalls.length > 0 && loopLimit > 0) {
    loopLimit--;
    const toolResults: any[] = [];

    for (const call of functionCalls) {
      const toolOutput = await executeTool(userId, call.name, call.args);
      toolResults.push({
        functionResponse: {
          name: call.name,
          response: toolOutput,
        },
      });
    }

    // Send tool responses back to the model
    result = await chat.sendMessage(toolResults);
    functionCalls = result.response.functionCalls();
  }

  // Extract final text
  const rawText = result.response.text() || '';
  
  // Split thoughts from content
  let thoughts = '';
  let cleanContent = rawText;
  
  const thoughtsMatch = rawText.match(/<thoughts>([\s\S]*?)<\/thoughts>/i);
  if (thoughtsMatch) {
    thoughts = thoughtsMatch[1].trim();
    cleanContent = rawText.replace(/<thoughts>[\s\S]*?<\/thoughts>/i, '').trim();
  } else {
    // If model forgot the tag but wrote thoughts, fallback or make empty thoughts
    thoughts = 'Analyzing user intent and executing automated services.';
  }

  // Save the conversation history in database
  await db.message.create({
    data: {
      conversationId,
      role: 'user',
      content: userMessage,
    },
  });

  await db.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: cleanContent,
      thoughts: thoughts,
    },
  });

  // Log conversation step
  await db.log.create({
    data: {
      userId,
      type: 'GEMINI_API',
      status: 'INFO',
      message: `Gemini processed message for conversation ${conversationId}.`,
    },
  });

  return {
    content: cleanContent,
    thoughts,
  };
}
