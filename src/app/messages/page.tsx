'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, Clock, Paperclip } from 'lucide-react';

type Message = {
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
  messages: Message[];
  adminSenders?: {
    id: string;
    name: string | null;
    email: string;
  }[];
};

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isAdmin =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (status !== 'authenticated' || isAdmin) return;

    const fetchThread = async () => {
      setError(null);
      try {
        const res = await fetch('/api/messages/thread');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to load messages');
          return;
        }
        const data = (await res.json()) as ThreadResponse;
        setThread(data);
      } catch (e) {
        setError('Failed to load messages');
      }
    };

    fetchThread();
  }, [status, isAdmin]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages.length]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to send message');
        setIsSending(false);
        return;
      }

      const { message } = (await res.json()) as { message: Message };

      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
            }
          : prev,
      );
      setNewMessage('');
      setFile(null);
    } catch {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p className="text-gray-600">Please sign in to view your messages.</p>
      </div>
    );
  }

  const groupedByDate =
    !thread?.messages?.length
      ? []
      : thread.messages.reduce(
          (
            acc: { dateKey: string; label: string; messages: Message[] }[],
            msg,
          ) => {
            const d = new Date(msg.createdAt);
            const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
            let group = acc.find((g) => g.dateKey === dateKey);
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
              acc.push(group);
            }
            group.messages.push(msg);
            return acc;
          },
          [],
        );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
      {isAdmin && (
        <p className="text-sm text-gray-600 mb-4">
          Admin messaging tools are managed from the admin dashboard. This page is
          intended for customer and partner conversations with admin.
        </p>
      )}
      {!isAdmin && thread?.otherUser && (
        <p className="text-sm text-gray-600 mb-4">
          Conversation with{' '}
          <span className="font-medium">
            {thread.otherUser.role === 'ADMIN' || thread.otherUser.role === 'SUPER_ADMIN'
              ? 'Admin'
              : thread.otherUser.name || thread.otherUser.email}
          </span>
        </p>
      )}
      <div className="border rounded-lg bg-white shadow-sm flex flex-col h-[480px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {error}
            </div>
          )}
          {groupedByDate.length ? (
            groupedByDate.map((group) => (
              <div key={group.dateKey} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex-1 h-px bg-gray-200" aria-hidden />
                  <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase shrink-0">
                    {group.label}
                  </span>
                  <span className="flex-1 h-px bg-gray-200" aria-hidden />
                </div>
                {group.messages.map((msg) => {
                  const isOwn = msg.senderId === session.user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        {msg.attachmentUrl && (
                          <div className="mt-2">
                            {msg.attachmentMimeType?.startsWith('image/') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={msg.attachmentUrl}
                                alt={msg.attachmentName || 'Attachment'}
                                className="max-h-48 rounded-xl border border-gray-200/50"
                              />
                            ) : (
                              <a
                                href={msg.attachmentUrl}
                                download={msg.attachmentName || 'attachment'}
                                className="inline-flex items-center text-xs text-blue-100 underline underline-offset-2"
                              >
                                {msg.attachmentName || 'Download attachment'}
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
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {error
                ? 'Unable to load messages.'
                : 'No messages yet. Start the conversation below.'}
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="border-t px-3 py-2 flex items-end gap-2">
          {/* Hidden file inputs triggered by icon buttons */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
          />

          <div className="flex-1 flex flex-col gap-1">
            <textarea
              className="w-full resize-none border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Type your message to admin..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            {file && (
              <span className="text-[11px] text-gray-500 truncate">
                Attached: {file.name}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                title="Take photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={isSending || (!newMessage.trim() && !file)}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

