import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Smile,
  X,
} from "lucide-react";
import { sendMessage, getMessages, getUserConversations } from "../../services/chat";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

const CONVERSATIONS_PAGE_SIZE = 10;
const MESSAGES_PAGE_SIZE = 20;
const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "😭", "👍", "👏", "🔥", "💙", "❤️", "🎉", "🤝", "👗", "👕", "🛍️"];

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [conversationCount, setConversationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);

  useEffect(() => {
    void loadConversations();
  }, [conversationPage]);

  useEffect(() => {
    if (activeConversationId) {
      void loadMessages(activeConversationId, 1);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`conversations-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `buyer_id=eq.${user.id}`,
        },
        () => void loadConversations()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `seller_id=eq.${user.id}`,
        },
        () => void loadConversations()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [user?.id, conversationPage]);

  useEffect(() => {
    if (!activeConversationId) return;

    const channel = supabase
      .channel(`messages-live-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async () => {
          await loadMessages(activeConversationId, 1);
          await loadConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(event.target)) {
        setShowEmojiMenu(false);
      }
    };

    if (showAttachmentMenu || showEmojiMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachmentMenu, showEmojiMenu]);

  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);

  const loadConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const { conversations: nextConversations, count } = await getUserConversations({
        page: conversationPage,
        pageSize: CONVERSATIONS_PAGE_SIZE,
      });

      setConversations(nextConversations);
      setConversationCount(count);
      if (nextConversations[0]?.id) {
        setActiveConversationId((current) =>
          nextConversations.some((conversation) => conversation.id === current)
            ? current
            : nextConversations[0].id
        );
      } else {
        setActiveConversationId(null);
      }
    } catch (err) {
      setError(err.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, nextPage = messagePage) => {
    try {
      const { messages: nextMessages, count } = await getMessages(conversationId, {
        page: nextPage,
        pageSize: MESSAGES_PAGE_SIZE,
      });
      setMessages((prev) => (nextPage > 1 ? [...nextMessages, ...prev] : nextMessages));
      setMessageCount(count);
      setMessagePage(nextPage);
    } catch (err) {
      setError(err.message || "Unable to load conversation.");
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const recipientId = activeConversation
    ? activeConversation.buyer_id === user?.id
      ? activeConversation.seller_id
      : activeConversation.buyer_id
    : null;

  const participantName = activeConversation
    ? activeConversation.buyer_id === user?.id
      ? activeConversation.seller?.full_name || "Seller"
      : activeConversation.buyer?.full_name || "Buyer"
    : "Select a conversation";

  const totalConversationPages = Math.max(1, Math.ceil(conversationCount / CONVERSATIONS_PAGE_SIZE));
  const totalMessagePages = Math.max(1, Math.ceil(messageCount / MESSAGES_PAGE_SIZE));
  const showConversationList = !activeConversationId;

  const clearAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview("");
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const setAttachmentFile = (file) => {
    if (!file) return;

    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }

    setAttachment(file);
    if ((file.type || "").startsWith("image/")) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview("");
    }
  };

  const handleSend = async () => {
    if (!activeConversationId || (!draft.trim() && !attachment)) return;

    setSending(true);
    setError("");
    try {
      const message = await sendMessage({
        conversationId: activeConversationId,
        recipientId,
        message: draft,
        attachment,
      });
      setMessages((prev) => [...prev, message]);
      setMessageCount((prev) => prev + 1);
      setDraft("");
      clearAttachment();
      await loadConversations();
    } catch (err) {
      setError(err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const renderAttachment = (message) => {
    const attachmentHref = message.attachment_signed_url || message.attachment_url;
    if (!attachmentHref) return null;

    const isImage = (message.attachment_type || "").startsWith("image/");
    if (isImage) {
      return (
        <a
          href={attachmentHref}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block overflow-hidden rounded-2xl border border-white/10"
        >
          <img
            src={attachmentHref}
            alt={message.attachment_name || "Attachment"}
            className="max-h-72 w-full object-cover"
          />
        </a>
      );
    }

    return (
      <a
        href={attachmentHref}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs font-semibold hover:bg-black/20"
      >
        <Paperclip className="h-3.5 w-3.5" />
        {message.attachment_name || "Open attachment"}
      </a>
    );
  };

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Messages</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Talk with buyers and sellers without leaving the platform.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="card py-16 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-xl font-bold">No conversations yet</h2>
          <p className="text-gray-500">Start a chat from an item details page.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className={`card max-h-[70vh] overflow-y-auto p-2 ${showConversationList ? "block" : "hidden lg:block"}`}>
            {conversations.map((conversation) => {
              const isBuyer = conversation.buyer_id === user?.id;
              const name = isBuyer
                ? conversation.seller?.full_name || "Seller"
                : conversation.buyer?.full_name || "Buyer";

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`mb-2 w-full rounded-2xl px-4 py-3 text-left transition-colors ${
                    conversation.id === activeConversationId
                      ? "bg-primary/10 text-gray-900 dark:text-white"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <p className="font-semibold">{name}</p>
                  <p className="truncate text-sm text-gray-500">{conversation.item?.title}</p>
                </button>
              );
            })}

            {conversationCount > CONVERSATIONS_PAGE_SIZE && (
              <div className="mt-3 flex items-center justify-between gap-2 px-2 pb-2 text-xs text-gray-500">
                <button
                  onClick={() => setConversationPage((current) => Math.max(1, current - 1))}
                  disabled={conversationPage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-50 dark:border-gray-700"
                >
                  Prev
                </button>
                <span>
                  {conversationPage}/{totalConversationPages}
                </span>
                <button
                  onClick={() => setConversationPage((current) => Math.min(totalConversationPages, current + 1))}
                  disabled={conversationPage >= totalConversationPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 font-semibold disabled:opacity-50 dark:border-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className={`card flex min-h-[70vh] flex-col ${showConversationList ? "hidden lg:flex" : "flex"}`}>
            <div className="border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="mb-2 flex items-center gap-3 lg:mb-0">
                <button
                  type="button"
                  onClick={() => setActiveConversationId(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold">{participantName}</h2>
                  <p className="text-sm text-gray-500">{activeConversation?.item?.title}</p>
                </div>
              </div>
            </div>

            <div className="min-h-[40vh] flex-1 space-y-3 overflow-y-auto py-4">
              {messageCount > MESSAGES_PAGE_SIZE && messagePage < totalMessagePages && (
                <div className="flex justify-center">
                  <button
                    onClick={() => loadMessages(activeConversationId, messagePage + 1)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    Load older messages
                  </button>
                </div>
              )}

              {messages.map((message) => {
                const own = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm sm:max-w-[75%] ${
                        own
                          ? "bg-primary text-dark"
                          : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-200"
                      }`}
                    >
                      <p>{message.message}</p>
                      {renderAttachment(message)}
                      <p className={`mt-1 text-xs ${own ? "text-dark/70" : "text-gray-400"}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              {attachment && (
                <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {attachmentPreview && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                      <img
                        src={attachmentPreview}
                        alt="Attachment preview"
                        className="max-h-56 w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-2 sm:gap-3">
                  <div ref={emojiMenuRef} className="relative flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttachmentMenu(false);
                        setShowEmojiMenu((current) => !current);
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 sm:h-12 sm:w-12"
                      title="Add emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </button>

                    {showEmojiMenu && (
                      <div className="absolute bottom-14 left-0 z-20 grid w-56 grid-cols-4 gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-slate-900">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setDraft((current) => `${current}${emoji}`);
                              setShowEmojiMenu(false);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={attachmentMenuRef} className="relative flex items-end">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiMenu(false);
                        setShowAttachmentMenu((current) => !current);
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 sm:h-12 sm:w-12"
                      title="Add attachment"
                    >
                      <Plus className="h-5 w-5" />
                    </button>

                    {showAttachmentMenu && (
                      <div className="absolute bottom-14 left-0 z-20 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-slate-900 sm:w-48">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            galleryInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Upload from gallery
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            cameraInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-slate-800"
                        >
                          <Camera className="h-4 w-4" />
                          Open camera
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type your message..."
                    className="input-field min-h-[52px] flex-1 resize-none sm:min-h-[56px]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSend}
                    disabled={sending || (!draft.trim() && !attachment)}
                    className="btn-primary inline-flex min-w-[120px] items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
