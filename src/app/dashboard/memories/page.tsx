"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  Edit3,
  Heart,
  Loader2,
  MessageCircle,
  PartyPopper,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  X,
  PlayCircle,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/ToastProvider";
import {
  buildYouTubeNoCookieEmbedUrl,
  extractYouTubeVideoId,
} from "@/lib/youtube";
import { FamilyGoalsSection } from "@/components/feed/FamilyGoalsSection";
import type {
  FamilyFeedComment,
  FamilyFeedPost,
  FamilyFeedReaction,
  FamilyGoal,
  FeedPostType,
  FeedReactionType,
} from "@/types/database";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function todayDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function FamilyPulseFeedPage() {
  const { t, tv, formatDate } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily, members, loadingFamilies } = useFamily();

  const [posts, setPosts] = useState<FamilyFeedPost[]>([]);
  const [reactions, setReactions] = useState<FamilyFeedReaction[]>([]);
  const [comments, setComments] = useState<FamilyFeedComment[]>([]);
  const [familyGoals, setFamilyGoals] = useState<FamilyGoal[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FeedPostType>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Comments UI
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [postingCommentId, setPostingCommentId] = useState<string | null>(null);

  // Composer Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"memory" | "youtube">(
    "memory"
  );
  const [editingPost, setEditingPost] = useState<FamilyFeedPost | null>(null);
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(todayDateInput);
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadFeed = useCallback(async () => {
    await Promise.resolve();
    if (!activeFamily) {
      setPosts([]);
      setReactions([]);
      setComments([]);
      setFamilyGoals([]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const [postsRes, reactionsRes, commentsRes, goalsRes] = await Promise.all([
        supabase
          .from("family_feed_posts")
          .select("*")
          .eq("family_id", activeFamily.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("family_feed_reactions")
          .select("*")
          .eq("family_id", activeFamily.id),
        supabase
          .from("family_feed_comments")
          .select("*")
          .eq("family_id", activeFamily.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("family_goals")
          .select("*")
          .eq("family_id", activeFamily.id)
          .order("created_at", { ascending: false }),
      ]);

      if (postsRes.error) {
        console.error("Failed to fetch family feed:", postsRes.error.message);
        return;
      }

      setPosts((postsRes.data as FamilyFeedPost[]) ?? []);
      setReactions((reactionsRes.data as FamilyFeedReaction[]) ?? []);
      setComments((commentsRes.data as FamilyFeedComment[]) ?? []);
      setFamilyGoals((goalsRes.data as FamilyGoal[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [activeFamily]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeed();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFeed]);

  const memberMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string | null }>();
    for (const m of members) {
      map.set(m.user_id, {
        name:
          m.profile?.full_name || m.profile?.email || t.common.unknownMember,
        avatar: m.profile?.avatar_url ?? null,
      });
    }
    return map;
  }, [members, t.common.unknownMember]);

  const reactionsByPost = useMemo(() => {
    const map = new Map<string, FamilyFeedReaction[]>();
    for (const r of reactions) {
      const list = map.get(r.post_id) ?? [];
      list.push(r);
      map.set(r.post_id, list);
    }
    return map;
  }, [reactions]);

  const commentsByPost = useMemo(() => {
    const map = new Map<string, FamilyFeedComment[]>();
    for (const c of comments) {
      const list = map.get(c.post_id) ?? [];
      list.push(c);
      map.set(c.post_id, list);
    }
    return map;
  }, [comments]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags ?? []) {
        if (tag.trim()) tagSet.add(tag.trim().toLowerCase());
      }
    }
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      if (typeFilter !== "all" && post.post_type !== typeFilter) {
        return false;
      }
      if (
        selectedTag !== "all" &&
        !(post.tags ?? []).some((tag) => tag.toLowerCase() === selectedTag)
      ) {
        return false;
      }
      if (!q) return true;
      const inTitle = post.title.toLowerCase().includes(q);
      const inBody = (post.body ?? "").toLowerCase().includes(q);
      const inTags = (post.tags ?? []).some((tag) =>
        tag.toLowerCase().includes(q)
      );
      return inTitle || inBody || inTags;
    });
  }, [posts, searchQuery, typeFilter, selectedTag]);

  const parsedPreviewVideoId = useMemo(
    () => extractYouTubeVideoId(youtubeUrl),
    [youtubeUrl]
  );

  const openCreateModal = (mode: "memory" | "youtube" = "memory") => {
    setEditingPost(null);
    setComposerMode(mode);
    setTitle("");
    setActivityDate(todayDateInput());
    setBody("");
    setTagsInput("");
    setPhotoUrl(null);
    setYoutubeUrl("");
    setSelectedGoalId("");
    setModalOpen(true);
  };

  const openEditModal = (post: FamilyFeedPost) => {
    setEditingPost(post);
    setComposerMode(post.post_type === "youtube" ? "youtube" : "memory");
    setTitle(post.title);
    setActivityDate(post.activity_date);
    setBody(post.body ?? "");
    setTagsInput((post.tags ?? []).join(", "));
    setPhotoUrl(post.photo_url);
    setYoutubeUrl(post.youtube_url ?? "");
    setSelectedGoalId(post.family_goal_id ?? "");
    setModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFamily) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast(t.family.invalidImageError, "error");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      showToast(t.family.imageTooLargeError, "error");
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
      const filePath = `${activeFamily.id}/feed-${Date.now()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("spotlight-banners")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("spotlight-banners")
        .getPublicUrl(filePath);

      setPhotoUrl(urlData.publicUrl);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !title.trim() || !activityDate) return;

    let videoId: string | null = null;
    if (composerMode === "youtube") {
      videoId = extractYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        showToast(t.feed.youtubeInvalidError, "error");
        return;
      }
    }

    const parsedTags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
      )
    );

    const postType: FeedPostType =
      composerMode === "youtube"
        ? "youtube"
        : editingPost?.post_type === "milestone" ||
            editingPost?.post_type === "event"
          ? editingPost.post_type
          : photoUrl
            ? "photo"
            : "memory";

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        family_id: activeFamily.id,
        post_type: postType,
        title: title.trim(),
        body: body.trim() || null,
        activity_date: activityDate,
        tags: parsedTags,
        photo_url: composerMode === "youtube" ? null : photoUrl,
        youtube_url: composerMode === "youtube" ? youtubeUrl.trim() : null,
        youtube_video_id: composerMode === "youtube" ? videoId : null,
        family_goal_id: selectedGoalId || null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("family_feed_posts")
          .update(payload)
          .eq("id", editingPost.id);
        if (error) throw error;
        showToast(t.feed.postUpdatedToast, "success");
      } else {
        const { error } = await supabase.from("family_feed_posts").insert({
          ...payload,
          author_id: profile.id,
        });
        if (error) throw error;
        showToast(t.feed.postCreatedToast, "success");
      }

      setModalOpen(false);
      await loadFeed();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t.feed.confirmDeletePost)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("family_feed_posts")
      .delete()
      .eq("id", postId);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.feed.postDeletedToast, "success");
    await loadFeed();
  };

  const handleToggleReaction = async (
    postId: string,
    reactionType: FeedReactionType
  ) => {
    if (!activeFamily) return;
    const postReactions = reactionsByPost.get(postId) ?? [];
    const existing = postReactions.find(
      (r) => r.user_id === profile.id && r.reaction_type === reactionType
    );

    const supabase = createClient();
    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      const { error } = await supabase
        .from("family_feed_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) {
        showToast(error.message, "error");
        await loadFeed();
      }
    } else {
      const { data, error } = await supabase
        .from("family_feed_reactions")
        .insert({
          post_id: postId,
          family_id: activeFamily.id,
          user_id: profile.id,
          reaction_type: reactionType,
        })
        .select()
        .single();
      if (error) {
        showToast(error.message, "error");
        return;
      }
      if (data) {
        setReactions((prev) => [...prev, data as FamilyFeedReaction]);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const content = (commentDrafts[postId] ?? "").trim();
    if (!activeFamily || !content) return;

    setPostingCommentId(postId);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("family_feed_comments")
        .insert({
          post_id: postId,
          family_id: activeFamily.id,
          user_id: profile.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setComments((prev) => [...prev, data as FamilyFeedComment]);
      }
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      showToast(t.feed.commentAddedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setPostingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_feed_comments")
      .delete()
      .eq("id", commentId);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loadingFamilies) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
      </div>
    );
  }

  if (!activeFamily) {
    return <NoFamilyState />;
  }

  const isFamilyAdmin = activeFamily.role === "admin";
  const postTypeFilterOptions: ("all" | FeedPostType)[] = [
    "all",
    "photo",
    "memory",
    "youtube",
    "milestone",
    "event",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F2EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#234738]">
            <Sparkles className="h-3 w-3" />
            <span>{t.common.sharedBadge}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
            {t.feed.title}
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">{t.feed.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="share-youtube-btn"
            onClick={() => openCreateModal("youtube")}
            className="btn-secondary"
          >
            <PlayCircle className="h-4 w-4 text-[#C86D51]" />
            <span>{t.feed.shareVideoButton}</span>
          </button>
          <button
            type="button"
            id="new-feed-post-btn"
            onClick={() => openCreateModal("memory")}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>{t.feed.newPostButton}</span>
          </button>
        </div>
      </div>

      {/* Shared Family Goals */}
      <FamilyGoalsSection
        goals={familyGoals}
        posts={posts}
        onChanged={loadFeed}
      />

      {/* Search & Filter Controls */}
      <div className="surface-card space-y-3 rounded-2xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
          <input
            id="feed-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.memories.searchPlaceholder}
            className="input-base pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {postTypeFilterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTypeFilter(option)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                typeFilter === option
                  ? "bg-[#1C1917] text-white"
                  : "bg-[#F4F0EA] text-[#57534E] hover:bg-[#EAE4DB]"
              }`}
            >
              {option === "all" ? t.feed.filterAll : t.feed.postTypes[option]}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#EFEAE2] pt-2.5">
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedTag === "all"
                  ? "bg-[#2D5A47] text-white"
                  : "bg-[#F4F0EA] text-[#57534E] hover:bg-[#EAE4DB]"
              }`}
            >
              {t.memories.allTags}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTag(selectedTag === tag ? "all" : tag)
                }
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                  selectedTag === tag
                    ? "border-[#2D5A47] bg-[#E9F2EE] font-semibold text-[#234738]"
                    : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                }`}
              >
                <Tag className="h-2.5 w-2.5" />
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Social Feed */}
      {loading ? (
        <div className="surface-card flex h-64 items-center justify-center rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center rounded-3xl p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F2EE] text-[#2D5A47]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-[#1C1917]">
            {t.feed.emptyTitle}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-[#57534E]">
            {t.feed.emptySubtitle}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => openCreateModal("memory")}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              <span>{t.feed.newPostButton}</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateModal("youtube")}
              className="btn-secondary"
            >
              <PlayCircle className="h-4 w-4 text-[#C86D51]" />
              <span>{t.feed.shareVideoButton}</span>
            </button>
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <p className="text-sm text-[#6B655E]">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-5">
          {filteredPosts.map((post) => {
            const author = post.author_id
              ? memberMap.get(post.author_id)
              : null;
            const authorName = author?.name || t.common.unknownMember;
            const canModify =
              post.author_id === profile.id || isFamilyAdmin;

            const postReactions = reactionsByPost.get(post.id) ?? [];
            const heartCount = postReactions.filter(
              (r) => r.reaction_type === "heart"
            ).length;
            const celebrateCount = postReactions.filter(
              (r) => r.reaction_type === "celebrate"
            ).length;
            const hasHearted = postReactions.some(
              (r) => r.user_id === profile.id && r.reaction_type === "heart"
            );
            const hasCelebrated = postReactions.some(
              (r) =>
                r.user_id === profile.id && r.reaction_type === "celebrate"
            );

            const postComments = commentsByPost.get(post.id) ?? [];
            const commentsOpen = Boolean(expandedComments[post.id]);
            const embedUrl = post.youtube_video_id
              ? buildYouTubeNoCookieEmbedUrl(post.youtube_video_id)
              : null;

            return (
              <article
                key={post.id}
                className="surface-card overflow-hidden rounded-3xl"
              >
                {/* Author Header */}
                <div className="flex items-start justify-between gap-3 p-4 pb-3 sm:px-6 sm:pt-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      src={author?.avatar}
                      name={authorName}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1C1917]">
                        {authorName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.activity_date)}
                        </span>
                        <span className="rounded-full bg-[#F4F0EA] px-2 py-0.5 text-[10px] font-semibold text-[#57534E]">
                          {t.feed.postTypes[post.post_type]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canModify && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(post)}
                        className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
                        aria-label={t.common.edit}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeletePost(post.id)}
                        className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Milestone Banner */}
                {post.post_type === "milestone" && (
                  <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-2xl border border-[#EAD9B0] bg-[#FAF4E6] px-4 py-2.5 text-xs font-semibold text-[#855F1C] sm:mx-6">
                    <Trophy className="h-4 w-4 shrink-0 text-[#B8862D]" />
                    <span>
                      {post.milestone_label || t.feed.sharedMilestonePrefix}
                    </span>
                  </div>
                )}

                {/* Title & Reflection */}
                <div className="px-4 pb-3 sm:px-6">
                  <h2 className="font-display text-lg font-bold tracking-tight text-[#1C1917]">
                    {post.title}
                  </h2>
                  {post.body && (
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#44403C]">
                      {post.body}
                    </p>
                  )}
                </div>

                {/* Photo Media */}
                {post.photo_url && (
                  <div className="w-full overflow-hidden bg-[#EAE4DB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.photo_url}
                      alt={post.title}
                      className="max-h-[480px] w-full object-cover"
                    />
                  </div>
                )}

                {/* Privacy-Enhanced Embedded YouTube Player */}
                {embedUrl && (
                  <div className="px-4 pb-3 sm:px-6">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#E7E1D8] bg-[#1C1917]">
                      <iframe
                        src={embedUrl}
                        title={post.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    </div>
                    {post.youtube_url && (
                      <div className="mt-2 flex justify-end">
                        <a
                          href={post.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#78716C] transition hover:text-[#2D5A47]"
                        >
                          <span>{t.feed.watchOnYoutube}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-4 pt-2 sm:px-6">
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag.toLowerCase())}
                        className="rounded-full bg-[#FAF8F5] px-2.5 py-0.5 text-[11px] font-medium text-[#57534E] ring-1 ring-[#E7E1D8] transition hover:bg-[#E9F2EE] hover:text-[#234738] cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reactions & Comments Footer */}
                <div className="mt-3 border-t border-[#EFEAE2] px-4 py-3 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleToggleReaction(post.id, "heart")
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          hasHearted
                            ? "border-[#F0CFC4] bg-[#FBF0EC] text-[#C86D51]"
                            : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            hasHearted ? "fill-current" : ""
                          }`}
                        />
                        <span>{t.feed.heartAction}</span>
                        {heartCount > 0 && (
                          <span className="tabular-nums">{heartCount}</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleToggleReaction(post.id, "celebrate")
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          hasCelebrated
                            ? "border-[#EAD9B0] bg-[#FAF4E6] text-[#9E7022]"
                            : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <PartyPopper className="h-3.5 w-3.5" />
                        <span>{t.feed.celebrateAction}</span>
                        {celebrateCount > 0 && (
                          <span className="tabular-nums">{celebrateCount}</span>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#57534E] transition hover:bg-[#F4F0EA] cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>
                        {postComments.length} {t.feed.commentsLabel}
                      </span>
                    </button>
                  </div>

                  {/* Expandable Comments Thread */}
                  {commentsOpen && (
                    <div className="mt-3 space-y-3 border-t border-[#EFEAE2] pt-3">
                      {postComments.length === 0 ? (
                        <p className="text-xs text-[#78716C]">
                          {t.feed.noCommentsYet}
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {postComments.map((comment) => {
                            const cAuthor = memberMap.get(comment.user_id);
                            const canDeleteComment =
                              comment.user_id === profile.id || isFamilyAdmin;
                            return (
                              <li
                                key={comment.id}
                                className="flex items-start gap-2.5 rounded-xl bg-[#FAF8F5] p-2.5"
                              >
                                <Avatar
                                  src={cAuthor?.avatar}
                                  name={
                                    cAuthor?.name || t.common.unknownMember
                                  }
                                  size="xs"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-semibold text-[#1C1917]">
                                      {cAuthor?.name || t.common.unknownMember}
                                    </p>
                                    {canDeleteComment && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleDeleteComment(comment.id)
                                        }
                                        className="text-[#A8A29E] transition hover:text-[#C86D51] cursor-pointer"
                                        aria-label={t.common.delete}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs leading-relaxed text-[#44403C]">
                                    {comment.content}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <form
                        onSubmit={(e) => void handleAddComment(e, post.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder={t.feed.addCommentPlaceholder}
                          className="input-base flex-1 py-2"
                        />
                        <button
                          type="submit"
                          disabled={
                            postingCommentId === post.id ||
                            !(commentDrafts[post.id] ?? "").trim()
                          }
                          className="btn-primary shrink-0 px-3 py-2"
                          aria-label={t.feed.postComment}
                        >
                          {postingCommentId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Composer Modal (Photo/Memory or YouTube Video) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPost ? t.memories.editMemory : t.feed.newPostButton}
      >
        <form
          onSubmit={handleSavePost}
          className="box-border w-full max-w-full min-w-0 space-y-2.5"
        >
          {/* Mode Switcher */}
          {(!editingPost ||
            editingPost.post_type === "memory" ||
            editingPost.post_type === "photo" ||
            editingPost.post_type === "youtube") && (
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4F0EA] p-1">
              <button
                type="button"
                onClick={() => setComposerMode("memory")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  composerMode === "memory"
                    ? "bg-white text-[#1C1917] shadow-xs"
                    : "text-[#6B655E]"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{t.feed.composerMemoryTab}</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerMode("youtube")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  composerMode === "youtube"
                    ? "bg-white text-[#C86D51] shadow-xs"
                    : "text-[#6B655E]"
                }`}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>{t.feed.composerVideoTab}</span>
              </button>
            </div>
          )}

          {composerMode === "youtube" && (
            <div className="min-w-0">
              <input
                id="feed-youtube-url"
                type="url"
                required
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder={t.feed.youtubeUrlPlaceholder}
                aria-label={t.feed.youtubeUrlLabel}
                className="input-base py-2"
              />
              {parsedPreviewVideoId && (
                <div className="relative mt-2 aspect-video max-h-40 w-full overflow-hidden rounded-xl border border-[#E7E1D8] bg-[#1C1917]">
                  <iframe
                    src={
                      buildYouTubeNoCookieEmbedUrl(parsedPreviewVideoId) ?? ""
                    }
                    title={t.feed.youtubePreviewLabel}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
              )}
            </div>
          )}

          <div className="min-w-0">
            <input
              id="feed-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                composerMode === "youtube"
                  ? t.feed.postTitlePlaceholderVideo
                  : t.memories.titlePlaceholder
              }
              aria-label={t.memories.titleLabel}
              className="input-base py-2"
            />
          </div>

          <div className="grid w-full max-w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="min-w-0">
              <input
                id="feed-date-input"
                type="date"
                required
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                aria-label={t.memories.dateLabel}
                className="input-base w-full min-w-0 max-w-full box-border py-1.5"
              />
            </div>
            <div className="min-w-0">
              <input
                id="feed-tags-input"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t.memories.tagsPlaceholder}
                aria-label={t.memories.tagsLabel}
                className="input-base py-1.5"
              />
            </div>
          </div>

          <div className="min-w-0">
            <textarea
              id="feed-body-input"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                composerMode === "youtube"
                  ? t.feed.reflectionPlaceholder
                  : t.memories.notesPlaceholder
              }
              aria-label={
                composerMode === "youtube"
                  ? t.feed.reflectionLabel
                  : t.memories.notesLabel
              }
              className="input-base resize-none py-2"
            />
          </div>

          {familyGoals.length > 0 && (
            <div className="min-w-0">
              <select
                aria-label={tv.vault.linkGoalLabel}
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="input-base py-1.5"
              >
                <option value="">
                  {tv.vault.linkGoalLabel}: {tv.vault.noGoalOption}
                </option>
                {familyGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Compact Photo Upload (for photo/memory mode) */}
          {composerMode === "memory" && (
            <div className="min-w-0">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photoUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-[#E7E1D8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt={title || "Photo preview"}
                    className="h-28 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-lg bg-[#1C1917]/75 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-xs hover:bg-[#1C1917] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    <span>{t.memories.removePhoto}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D5CDC1] bg-[#FAF8F5] py-2.5 text-xs font-semibold text-[#57534E] transition hover:border-[#2D5A47] hover:text-[#2D5A47] cursor-pointer disabled:opacity-60"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t.memories.uploadingPhoto}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      <span>{t.memories.uploadPhoto}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="grid w-full max-w-full grid-cols-2 gap-2.5 pt-1 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary w-full py-2 sm:w-auto"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="btn-primary w-full py-2 sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.common.saving}</span>
                </>
              ) : (
                <span>
                  {editingPost ? t.common.save : t.common.create}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
