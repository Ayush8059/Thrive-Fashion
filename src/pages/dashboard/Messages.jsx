import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  FlipHorizontal2,
  Loader2,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Plus,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { getMessages, getUserConversations, sendMessage } from "../../services/chat";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

const CONVERSATIONS_PAGE_SIZE = 10;
const MESSAGES_PAGE_SIZE = 20;
const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "😭", "👍", "👏", "🔥", "💙", "❤️", "🎉", "🤝", "👗", "👕", "🛍️"];
const HIDDEN_CONVERSATIONS_KEY = "thrive-hidden-conversations";

export default function Messages() {
  const { user } = useAuth();
  const isMobileDevice =
    typeof navigator !== "undefined"
      ? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "")
      : false;
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
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [hiddenConversationIds, setHiddenConversationIds] = useState([]);
  const attachmentMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const conversationMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const hiddenConversationIdsRef = useRef([]);

  useEffect(() => {
    if (!user?.id) {
      hiddenConversationIdsRef.current = [];
      setHiddenConversationIds([]);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(`${HIDDEN_CONVERSATIONS_KEY}-${user.id}`) || "[]");
      const nextIds = Array.isArray(stored) ? stored : [];
      hiddenConversationIdsRef.current = nextIds;
      setHiddenConversationIds(nextIds);
    } catch {
      hiddenConversationIdsRef.current = [];
      setHiddenConversationIds([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadConversations();
  }, [conversationPage]);

  useEffect(() => {
    if (activeConversationId) {
      void loadMessages(activeConversationId, 1);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!user?.id) return undefined;

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
        () => void loadConversations(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `seller_id=eq.${user.id}`,
        },
        () => void loadConversations(),
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [user?.id, conversationPage]);

  useEffect(() => {
    if (!activeConversationId) return undefined;

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
        },
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
      if (conversationMenuRef.current && !conversationMenuRef.current.contains(event.target)) {
        setShowConversationMenu(false);
      }
    };

    if (showAttachmentMenu || showEmojiMenu || showConversationMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachmentMenu, showEmojiMenu, showConversationMenu]);

  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [attachmentPreview]);

  useEffect(() => {
    if (!showCameraModal) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      return undefined;
    }

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setShowCameraModal(false);
        cameraInputRef.current?.click();
        return;
      }

      setCameraLoading(true);

      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        let stream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: cameraFacingMode },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        cameraStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setShowCameraModal(false);
        cameraInputRef.current?.click();
      } finally {
        setCameraLoading(false);
      }
    };

    void startCamera();

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [showCameraModal, cameraFacingMode]);

  const visibleConversations = useMemo(
    () => conversations.filter((conversation) => !hiddenConversationIds.includes(conversation.id)),
    [conversations, hiddenConversationIds],
  );

  useEffect(() => {
    if (visibleConversations.length === 0) {
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    if (!activeConversationId || hiddenConversationIds.includes(activeConversationId)) {
      setActiveConversationId(visibleConversations[0].id);
    }
  }, [visibleConversations, activeConversationId, hiddenConversationIds]);

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
    [conversations, activeConversationId],
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

  const persistHiddenConversations = (nextIds) => {
    hiddenConversationIdsRef.current = nextIds;
    setHiddenConversationIds(nextIds);
    if (user?.id) {
      localStorage.setItem(`${HIDDEN_CONVERSATIONS_KEY}-${user.id}`, JSON.stringify(nextIds));
    }
  };

  const clearAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleDeleteChat = () => {
    if (!activeConversationId) return;

    const nextIds = [...new Set([...hiddenConversationIdsRef.current, activeConversationId])];
    persistHiddenConversations(nextIds);
    setShowConversationMenu(false);
    setDraft("");
    clearAttachment();
  };

  const handleOpenCamera = () => {
    setShowAttachmentMenu(false);
    setCameraFacingMode(isMobileDevice ? "environment" : "user");
    setShowCameraModal(true);
  };

  const handleCloseCameraModal = () => {
    setShowCameraModal(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      setAttachmentFile(file);
      setShowCameraModal(false);
    }, "image/jpeg", 0.92);
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

      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#091126] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
              <div>
                <h3 className="text-base font-semibold">Camera</h3>
                <p className="text-xs text-white/60">Laptop par webcam, phone par front/back switch available hai.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full bg-black object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() =>
                  setCameraFacingMode((current) => (current === "environment" ? "user" : "environment"))
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <FlipHorizontal2 className="h-4 w-4" />
                Switch camera
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseCameraModal}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={cameraLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-dark transition hover:brightness-105 disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" />
                  Capture photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visibleConversations.length === 0 ? (
        <div className="card py-16 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-xl font-bold">No conversations available</h2>
          <p className="text-gray-500">Start a chat from an item details page, or keep only the chats you want in your inbox.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className={`card max-h-[70vh] overflow-y-auto p-2 ${showConversationList ? "block" : "hidden lg:block"}`}>
            {visibleConversations.map((conversation) => {
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
              <div className="mb-2 flex items-center justify-between gap-3 lg:mb-0">
                <div className="flex items-center gap-3">
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

                {activeConversationId && (
                  <div ref={conversationMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowConversationMenu((current) => !current)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                      title="Conversation options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {showConversationMenu && (
                      <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={handleDeleteChat}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete chat
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{attachment.name}</p>
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
                        setShowConversationMenu(false);
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
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,.txt"
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
                        setShowConversationMenu(false);
                        setShowAttachmentMenu((current) => !current);
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 sm:h-12 sm:w-12"
                      title="Add attachment"
                    >
                      <Plus className="h-5 w-5" />
                    </button>

                    {showAttachmentMenu && (
                      <div className="absolute bottom-14 left-0 z-20 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            imageInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                        >
                          <Paperclip className="h-4 w-4" />
                          Upload image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            fileInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-slate-800"
                        >
                          <Paperclip className="h-4 w-4" />
                          Upload file
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenCamera();
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
