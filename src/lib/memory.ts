import { db } from './db';

export interface MemoryData {
  category: 'PEOPLE' | 'PROJECT' | 'DEADLINE' | 'PREFERENCE' | 'GENERAL';
  content: string;
  tags?: string[];
}

/**
 * Saves a new piece of long-term memory for the user.
 */
export async function saveMemory(userId: string, data: MemoryData) {
  const tagsStr = data.tags ? data.tags.map(t => t.trim().toLowerCase()).join(',') : '';
  
  const memory = await db.memory.create({
    data: {
      userId,
      category: data.category,
      content: data.content,
      tags: tagsStr,
    },
  });

  await db.log.create({
    data: {
      userId,
      type: 'SYSTEM',
      status: 'INFO',
      message: `Saved new memory in category ${data.category}`,
    },
  });

  return memory;
}

/**
 * Retrieves all memories for a user, optionally filtered by keyword matching.
 */
export async function getMemories(userId: string, query?: string) {
  const allMemories = await db.memory.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  if (!query) {
    return allMemories;
  }

  // Basic associative search: check if any query words match content or tags
  const searchWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (searchWords.length === 0) return allMemories;

  return allMemories.filter(mem => {
    const contentText = mem.content.toLowerCase();
    const tagsText = mem.tags.toLowerCase();
    return searchWords.some(word => contentText.includes(word) || tagsText.includes(word));
  });
}

/**
 * Deletes a memory record.
 */
export async function deleteMemory(userId: string, memoryId: string) {
  await db.memory.deleteMany({
    where: {
      id: memoryId,
      userId,
    },
  });
}

/**
 * Injects memory context into a prompt.
 */
export async function getMemoryPromptContext(userId: string, userQuery: string): Promise<string> {
  const relevantMemories = await getMemories(userId, userQuery);
  if (relevantMemories.length === 0) return '';

  const memoryBlocks = relevantMemories.map(mem => {
    return `- [${mem.category}] ${mem.content} (Tags: ${mem.tags})`;
  });

  return `
[RELATED MEMORIES]
The following relevant facts, projects, or preferences were retrieved from your memory database:
${memoryBlocks.join('\n')}
Use this context to inform your responses where applicable.
`;
}
