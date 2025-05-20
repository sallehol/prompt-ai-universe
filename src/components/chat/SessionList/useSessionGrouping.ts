
import { Session } from '@/types/chat';

export const useSessionGrouping = (sessions: Session[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { today: Session[]; yesterday: Session[]; previous7Days: Session[]; older: Session[] } = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: []
  };

  sessions.forEach(session => {
    const sessionDate = new Date(session.lastActivityAt); // Using lastActivityAt for grouping
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === today.getTime()) {
      groups.today.push(session);
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      groups.yesterday.push(session);
    } else if (sessionDate >= weekAgo) {
      groups.previous7Days.push(session);
    } else {
      groups.older.push(session);
    }
  });

  // Sort sessions within each group by lastActivityAt descending
  for (const key in groups) {
    groups[key as keyof typeof groups].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }
  
  return groups;
};
