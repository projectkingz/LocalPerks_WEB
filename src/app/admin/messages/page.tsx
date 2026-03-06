'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Clock } from 'lucide-react';

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'PARTNER' | 'CUSTOMER' | string;

type MessageUser = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
  };
  unreadCount: number;
  lastMessageAt: string | null;
};

type ThreadMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
};

type ThreadResponse = {
  otherUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  messages: ThreadMessage[];
  adminSenders?: {
    id: string;
    name: string | null;
    email: string;
  }[];
};

function groupMessagesByDate(messages: ThreadMessage[]) {
  const groups: {
    dateKey: string;
    label: string;
    messages: ThreadMessage[];
  }[] = [];

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const dateKey = d.toISOString().slice(0, 10);
    let group = groups.find((g) => g.dateKey === dateKey);
    if (!group) {
      group = {
        dateKey,
        label: d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        messages: [],
      };
      groups.push(group);
    }
    group.messages.push(msg);
  }

  return groups;
}

export default function AdminMessagesPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<MessageUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatUserIds, setSelectedChatUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [chatContent, setChatContent] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/messages/users');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to load message users');
          return;
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setError('Failed to load message users');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const loadThread = async (userId: string) => {
    setSelectedUserId(userId);
    setThread(null);
    setLoadingThread(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/messages/thread?otherUserId=${encodeURIComponent(userId)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load conversation');
        return;
      }
      const data = (await res.json()) as ThreadResponse;
      setThread(data);

      // refresh users list to update unread counts
      const usersRes = await fetch('/api/admin/messages/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch {
      setError('Failed to load conversation');
    } finally {
      setLoadingThread(false);
    }
  };

  const toggleChatSelection = (userId: string) => {
    setSelectedChatUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSendChat = async () => {
    if (!chatContent.trim()) return;

    setIsSendingChat(true);
    setError(null);

    try {
      const ids =
        selectedChatUserIds.size > 0
          ? Array.from(selectedChatUserIds)
          : selectedUserId
          ? [selectedUserId]
          : [];

      if (!ids.length) {
        setIsSendingChat(false);
        return;
      }

      for (const userId of ids) {
        const res = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: userId,
            content: chatContent,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to send chat messages');
          break;
        }
      }

      setChatContent('');
      if (selectedUserId) {
        await loadThread(selectedUserId);
      }
    } catch {
      setError('Failed to send chat messages');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Messages</h1>
      {session?.user && (
        <p className="text-sm text-gray-600 mb-4">
          Signed in as <span className="font-medium">{session.user.email}</span>
        </p>
      )}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: users and chat selection */}
        <div className="md:col-span-1 border rounded-lg bg-white shadow-sm p-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">
              Users who messaged admin
            </h2>
          </div>
          {loadingUsers ? (
            <p className="text-sm text-gray-500">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500">No messages received yet.</p>
          ) : (
            <ul className="space-y-1">
              {users.map((item) => (
                <li
                  key={item.user.id}
                  className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                    selectedUserId === item.user.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => loadThread(item.user.id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={selectedChatUserIds.has(item.user.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleChatSelection(item.user.id);
                      }}
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        {item.user.name || item.user.email}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {item.user.role} •{' '}
                        {item.lastMessageAt
                          ? new Date(item.lastMessageAt).toLocaleString()
                          : 'No messages'}
                      </div>
                    </div>
                  </div>
                  {item.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] text-white">
                      {item.unreadCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 border-t pt-3 space-y-1 text-[11px] text-gray-500">
            <p>
              Tip: tick one or more users above, then use the message box in the
              conversation panel to send a chat to them.
            </p>
          </div>
        </div>

        {/* Right columns: conversation + reply box */}
        <div className="md:col-span-2 border rounded-lg bg-white shadow-sm flex flex-col h-[520px]">
          <div className="p-3 flex-1 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              Conversation
            </h2>
            {loadingThread ? (
              <p className="text-sm text-gray-500">Loading conversation…</p>
            ) : !thread ? (
              <p className="text-sm text-gray-500">
                Select a user on the left to view their conversation and reply.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-600 mb-2">
                  With{' '}
                  <span className="font-medium">
                    {thread.otherUser.name || thread.otherUser.email} (
                    {thread.otherUser.role})
                  </span>
                </p>
                <div className="flex-1 overflow-y-auto border rounded mb-3 p-3 space-y-2">
                  {!thread.messages.length ? (
                    <p className="text-xs text-gray-500">
                      No messages in this conversation yet.
                    </p>
                  ) : (
                    groupMessagesByDate(thread.messages).map((group) => (
                      <div key={group.dateKey} className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex-1 h-px bg-gray-200" aria-hidden />
                          <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase shrink-0">
                            {group.label}
                          </span>
                          <span className="flex-1 h-px bg-gray-200" aria-hidden />
                        </div>
                        {group.messages.map((msg) => {
                          // In the admin view, treat ANY admin-sent message
                          // as "own" so that all admin messages appear on one side,
                          // and all customer/partner messages on the other.
                          const adminSenderIds = new Set(
                            (thread.adminSenders || []).map((a) => a.id),
                          );
                          const isOwn = adminSenderIds.has(msg.senderId);
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col gap-1 ${
                                isOwn ? 'items-end' : 'items-start'
                              }`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                                  isOwn
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                {msg.attachmentUrl && (
                                  <div className="mt-1.5">
                                    {msg.attachmentMimeType?.startsWith(
                                      'image/',
                                    ) ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={msg.attachmentUrl}
                                        alt={msg.attachmentName || 'Attachment'}
                                        className="max-h-32 rounded-xl border border-gray-200/50"
                                      />
                                    ) : (
                                      <a
                                        href={msg.attachmentUrl}
                                        download={
                                          msg.attachmentName || 'attachment'
                                        }
                                        className="inline-flex items-center text-[10px] underline underline-offset-2"
                                      >
                                        {msg.attachmentName ||
                                          'Download attachment'}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p
                                className="text-[11px] italic tabular-nums text-gray-400 tracking-wide"
                                aria-label={`Sent at ${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              >
                                <Clock className="inline-block h-3 w-3 mr-1 -mt-0.5 align-middle opacity-70" aria-hidden />
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          {/* Reply box – consistent with user messaging layout */}
          <div className="border-t px-3 py-2 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                className="w-full resize-none border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Type your message to user..."
                value={chatContent}
                onChange={(e) => setChatContent(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatContent.trim()}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                {isSendingChat ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

