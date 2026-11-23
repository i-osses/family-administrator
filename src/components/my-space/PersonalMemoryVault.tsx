"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  Check,
  CheckCircle2,
  Clock,
  Crosshair,
  Edit3,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/ToastProvider";
import { COLOR_SWATCHES, resolveCategoryColor } from "@/lib/constants";
import type {
  FamilyGoal,
  MemoryTemplateType,
  PersonalMemory,
  PersonalMemoryCategory,
  PersonalMemoryComment,
  PersonalMemoryTag,
} from "@/types/database";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function nowLocalDateTimeInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowLocalDateTimeInput();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toDateOnly(isoOrDate: Date): string {
  return `${isoOrDate.getFullYear()}-${pad2(
    isoOrDate.getMonth() + 1
  )}-${pad2(isoOrDate.getDate())}`;
}

export function PersonalMemoryVault() {
  const { t, tv, formatDate, formatTime } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily, members } = useFamily();

  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<PersonalMemory[]>([]);
  const [categories, setCategories] = useState<PersonalMemoryCategory[]>([]);
  const [incomingTags, setIncomingTags] = useState<PersonalMemoryTag[]>([]);
  const [outgoingTags, setOutgoingTags] = useState<PersonalMemoryTag[]>([]);
  const [comments, setComments] = useState<PersonalMemoryComment[]>([]);
  const [familyGoals, setFamilyGoals] = useState<FamilyGoal[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Comments & sharing state
  const [expandedThreads, setExpandedThreads] = useState<
    Record<string, boolean>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [postingThreadId, setPostingThreadId] = useState<string | null>(null);
  const [confirmingTagId, setConfirmingTagId] = useState<string | null>(null);
  const [sharingMemoryId, setSharingMemoryId] = useState<string | null>(null);

  // Memory Composer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<PersonalMemory | null>(
    null
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [templateType, setTemplateType] =
    useState<MemoryTemplateType>("media");
  const [title, setTitle] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalDateTimeInput);
  const [rating, setRating] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [notes, setNotes] = useState("");
  const [taggedMemberIds, setTaggedMemberIds] = useState<string[]>([]);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Custom Categories Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatTemplate, setNewCatTemplate] =
    useState<MemoryTemplateType>("media");
  const [newCatColor, setNewCatColor] = useState<string>(COLOR_SWATCHES[0]);
  const [savingCat, setSavingCat] = useState(false);

  const seededRef = useRef(false);

  const loadVault = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const supabase = createClient();
      const [memRes, catRes, tagsRes, goalsRes] = await Promise.all([
        supabase
          .from("personal_memories")
          .select("*")
          .eq("user_id", profile.id)
          .order("occurred_at", { ascending: false }),
        supabase
          .from("personal_memory_categories")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("personal_memory_tags")
          .select("*")
          .or(`tagged_user_id.eq.${profile.id},tagged_by.eq.${profile.id}`)
          .order("created_at", { ascending: false }),
        activeFamily
          ? supabase
              .from("family_goals")
              .select("*")
              .eq("family_id", activeFamily.id)
              .eq("is_completed", false)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const loadedMemories = (memRes.data as PersonalMemory[]) ?? [];
      let loadedCategories = (catRes.data as PersonalMemoryCategory[]) ?? [];

      // Seed helpful starter categories once for first-time users
      if (!catRes.error && loadedCategories.length === 0 && !seededRef.current) {
        seededRef.current = true;
        const { data: insertedCats } = await supabase
          .from("personal_memory_categories")
          .upsert(
            tv.vault.defaultCategories.map((c) => ({
              user_id: profile.id,
              name: c.name,
              template_type: c.template_type,
              color: c.color,
            })),
            { onConflict: "user_id,name" }
          )
          .select("*");
        if (insertedCats) {
          loadedCategories = insertedCats as PersonalMemoryCategory[];
        }
      }

      const allTags = (tagsRes.data as PersonalMemoryTag[]) ?? [];
      setIncomingTags(
        allTags.filter(
          (tag) =>
            tag.tagged_user_id === profile.id && tag.status === "pending"
        )
      );
      setOutgoingTags(allTags.filter((tag) => tag.tagged_by === profile.id));
      setMemories(loadedMemories);
      setCategories(loadedCategories);
      setFamilyGoals((goalsRes.data as FamilyGoal[]) ?? []);

      const threadIds = Array.from(
        new Set(loadedMemories.map((m) => m.thread_id).filter(Boolean))
      );
      if (threadIds.length > 0) {
        const { data: commentRows } = await supabase
          .from("personal_memory_comments")
          .select("*")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: true });
        setComments((commentRows as PersonalMemoryComment[]) ?? []);
      } else {
        setComments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [profile.id, activeFamily, tv.vault.defaultCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVault();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVault]);

  const otherFamilyMembers = useMemo(
    () => members.filter((m) => m.user_id !== profile.id),
    [members, profile.id]
  );

  const memberLookup = useMemo(() => {
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

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.name.toLowerCase(), c.color);
    }
    return map;
  }, [categories]);

  const outgoingTagsByMemory = useMemo(() => {
    const map = new Map<string, PersonalMemoryTag[]>();
    for (const tag of outgoingTags) {
      if (!tag.memory_id) continue;
      const list = map.get(tag.memory_id) ?? [];
      list.push(tag);
      map.set(tag.memory_id, list);
    }
    return map;
  }, [outgoingTags]);

  const commentsByThread = useMemo(() => {
    const map = new Map<string, PersonalMemoryComment[]>();
    for (const c of comments) {
      const list = map.get(c.thread_id) ?? [];
      list.push(c);
      map.set(c.thread_id, list);
    }
    return map;
  }, [comments]);

  const filteredMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return memories.filter((memory) => {
      if (
        categoryFilter !== "all" &&
        memory.category_name.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;

      const taggedNames = (outgoingTagsByMemory.get(memory.id) ?? [])
        .map((tag) => memberLookup.get(tag.tagged_user_id)?.name ?? "")
        .join(" ")
        .toLowerCase();

      return (
        memory.title.toLowerCase().includes(q) ||
        memory.category_name.toLowerCase().includes(q) ||
        (memory.notes ?? "").toLowerCase().includes(q) ||
        (memory.location_name ?? "").toLowerCase().includes(q) ||
        (memory.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
        taggedNames.includes(q)
      );
    });
  }, [
    memories,
    searchQuery,
    categoryFilter,
    outgoingTagsByMemory,
    memberLookup,
  ]);

  const effectiveCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return tv.vault.defaultCategories.map((c, idx) => ({
      id: `default-${idx}`,
      user_id: profile.id,
      name: c.name,
      template_type: c.template_type,
      color: c.color,
      created_at: "",
    }));
  }, [categories, tv.vault.defaultCategories, profile.id]);

  const openCreateModal = () => {
    const defaultCat = effectiveCategories[0];
    setEditingMemory(null);
    setSelectedCategoryName(defaultCat?.name ?? "Movies");
    setTemplateType(defaultCat?.template_type ?? "media");
    setTitle("");
    setOccurredAt(nowLocalDateTimeInput());
    setRating(null);
    setLocationName("");
    setLatitude(null);
    setLongitude(null);
    setNotes("");
    setTaggedMemberIds([]);
    setShareToFeed(false);
    setSelectedGoalId("");
    setModalOpen(true);
  };

  const openEditModal = (memory: PersonalMemory) => {
    setEditingMemory(memory);
    setSelectedCategoryName(memory.category_name);
    setTemplateType(memory.template_type);
    setTitle(memory.title);
    setOccurredAt(toLocalDateTimeInput(memory.occurred_at));
    setRating(memory.rating);
    setLocationName(memory.location_name ?? "");
    setLatitude(memory.latitude);
    setLongitude(memory.longitude);
    setNotes(memory.notes ?? "");
    setTaggedMemberIds(
      (outgoingTagsByMemory.get(memory.id) ?? []).map(
        (tag) => tag.tagged_user_id
      )
    );
    setShareToFeed(memory.shared_to_feed);
    setSelectedGoalId(memory.family_goal_id ?? "");
    setModalOpen(true);
  };

  const handleSelectCategoryInModal = (cat: PersonalMemoryCategory) => {
    setSelectedCategoryName(cat.name);
    setTemplateType(cat.template_type);
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast(tv.vault.locationErrorToast, "error");
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Math.round(position.coords.latitude * 100000) / 100000;
        const lng = Math.round(position.coords.longitude * 100000) / 100000;
        setLatitude(lat);
        setLongitude(lng);
        if (!locationName.trim()) {
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        showToast(tv.vault.locationCapturedToast, "success");
        setLocatingGps(false);
      },
      () => {
        showToast(tv.vault.locationErrorToast, "error");
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleTaggedMember = (memberUserId: string) => {
    setTaggedMemberIds((prev) =>
      prev.includes(memberUserId)
        ? prev.filter((id) => id !== memberUserId)
        : [...prev, memberUserId]
    );
  };

  const publishMemoryToFamilyFeed = async (
    memory: {
      id: string;
      title: string;
      category_name: string;
      notes: string | null;
      location_name: string | null;
      rating: number | null;
      occurred_at: string;
      photo_url: string | null;
      family_goal_id: string | null;
    }
  ): Promise<string | null> => {
    if (!activeFamily) return null;
    const supabase = createClient();
    const parts: string[] = [];
    if (memory.location_name) parts.push(`📍 ${memory.location_name}`);
    if (memory.rating) parts.push(`${"★".repeat(memory.rating)} (${memory.rating}/5)`);
    if (memory.notes) parts.push(memory.notes);

    const { data: createdPost, error } = await supabase
      .from("family_feed_posts")
      .insert({
        family_id: activeFamily.id,
        author_id: profile.id,
        post_type: memory.photo_url ? "photo" : "memory",
        title: memory.title,
        body: parts.join("\n") || null,
        activity_date: toDateOnly(new Date(memory.occurred_at)),
        tags: [memory.category_name.toLowerCase()],
        photo_url: memory.photo_url,
        family_goal_id: memory.family_goal_id,
      })
      .select("id")
      .single();

    if (error || !createdPost) {
      throw new Error(error?.message || "Failed to share to Family Pulse");
    }
    return createdPost.id as string;
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const occurredIso = new Date(occurredAt || nowLocalDateTimeInput());
    setSaving(true);
    try {
      const supabase = createClient();
      const basePayload = {
        user_id: profile.id,
        family_id: activeFamily?.id ?? null,
        category_name: selectedCategoryName || "Family Milestone",
        template_type: templateType,
        title: title.trim(),
        occurred_at: occurredIso.toISOString(),
        rating: templateType === "media" ? rating : null,
        notes: notes.trim() || null,
        location_name:
          templateType === "location" ? locationName.trim() || null : null,
        latitude: templateType === "location" ? latitude : null,
        longitude: templateType === "location" ? longitude : null,
        family_goal_id: selectedGoalId || null,
      };

      let savedMemoryId = editingMemory?.id ?? "";
      let alreadySharedPostId = editingMemory?.shared_feed_post_id ?? null;

      if (editingMemory) {
        const { error } = await supabase
          .from("personal_memories")
          .update(basePayload)
          .eq("id", editingMemory.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("personal_memories")
          .insert({
            ...basePayload,
            shared_to_feed: false,
          })
          .select("id")
          .single();
        if (error || !inserted) throw error ?? new Error("Save failed");
        savedMemoryId = inserted.id as string;
      }

      // Share to Family Pulse if toggled on and not yet shared
      if (shareToFeed && !alreadySharedPostId && activeFamily) {
        const feedPostId = await publishMemoryToFamilyFeed({
          id: savedMemoryId,
          title: basePayload.title,
          category_name: basePayload.category_name,
          notes: basePayload.notes,
          location_name: basePayload.location_name,
          rating: basePayload.rating,
          occurred_at: basePayload.occurred_at,
          photo_url: editingMemory?.photo_url ?? null,
          family_goal_id: basePayload.family_goal_id,
        });
        if (feedPostId) {
          alreadySharedPostId = feedPostId;
          await supabase
            .from("personal_memories")
            .update({
              shared_to_feed: true,
              shared_feed_post_id: feedPostId,
            })
            .eq("id", savedMemoryId);
        }
      }

      // Insert tags for newly tagged family members (Copy-on-Confirm)
      if (activeFamily && taggedMemberIds.length > 0 && savedMemoryId) {
        const existingTaggedIds = new Set(
          (outgoingTagsByMemory.get(savedMemoryId) ?? []).map(
            (tRow) => tRow.tagged_user_id
          )
        );
        const newIds = taggedMemberIds.filter(
          (uid) => !existingTaggedIds.has(uid)
        );
        if (newIds.length > 0) {
          await supabase.from("personal_memory_tags").insert(
            newIds.map((uid) => ({
              memory_id: savedMemoryId,
              family_id: activeFamily.id,
              tagged_by: profile.id,
              tagged_user_id: uid,
              status: "pending",
              memory_title_snapshot: basePayload.title,
              memory_category_snapshot: basePayload.category_name,
              memory_occurred_at_snapshot: basePayload.occurred_at,
            }))
          );
        }
      }

      setModalOpen(false);
      showToast(
        editingMemory ? tv.vault.memoryUpdatedToast : tv.vault.memorySavedToast,
        "success"
      );
      await loadVault();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOneTapShare = async (memory: PersonalMemory) => {
    if (!activeFamily) {
      showToast(t.errors.noFamily, "error");
      return;
    }
    setSharingMemoryId(memory.id);
    try {
      const feedPostId = await publishMemoryToFamilyFeed(memory);
      const supabase = createClient();
      const { error } = await supabase
        .from("personal_memories")
        .update({
          shared_to_feed: true,
          shared_feed_post_id: feedPostId,
        })
        .eq("id", memory.id);
      if (error) throw error;
      showToast(tv.vault.sharedToFeedToast, "success");
      await loadVault();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSharingMemoryId(null);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm(tv.vault.confirmDeleteMemory)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_memories")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(tv.vault.memoryDeletedToast, "success");
    await loadVault();
  };

  const handleConfirmTag = async (tagId: string) => {
    setConfirmingTagId(tagId);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("confirm_memory_tag", {
        p_tag_id: tagId,
      });
      if (error) throw error;
      showToast(tv.vault.tagConfirmedToast, "success");
      await loadVault();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setConfirmingTagId(null);
    }
  };

  const handleDismissTag = async (tagId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_memory_tags")
      .delete()
      .eq("id", tagId);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(tv.vault.tagDismissedToast, "info");
    await loadVault();
  };

  const handleAddComment = async (
    e: React.FormEvent,
    memory: PersonalMemory
  ) => {
    e.preventDefault();
    const content = (commentDrafts[memory.thread_id] ?? "").trim();
    if (!content) return;

    setPostingThreadId(memory.thread_id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("personal_memory_comments")
        .insert({
          thread_id: memory.thread_id,
          memory_id: memory.id,
          user_id: profile.id,
          content,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setComments((prev) => [...prev, data as PersonalMemoryComment]);
      }
      setCommentDrafts((prev) => ({ ...prev, [memory.thread_id]: "" }));
      setExpandedThreads((prev) => ({ ...prev, [memory.thread_id]: true }));
      showToast(tv.vault.commentAddedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setPostingThreadId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("personal_memory_categories")
        .insert({
          user_id: profile.id,
          name: newCatName.trim(),
          template_type: newCatTemplate,
          color: newCatColor,
        });
      if (error) throw error;
      setNewCatName("");
      showToast(tv.vault.categoryAddedToast, "success");
      await loadVault();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: PersonalMemoryCategory) => {
    if (!window.confirm(tv.vault.confirmDeleteCategory)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("personal_memory_categories")
      .delete()
      .eq("id", cat.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (categoryFilter.toLowerCase() === cat.name.toLowerCase()) {
      setCategoryFilter("all");
    }
    showToast(tv.vault.categoryDeletedToast, "success");
    await loadVault();
  };

  if (loading) {
    return (
      <div className="surface-card flex h-56 items-center justify-center rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1C1917] sm:text-xl">
            {tv.vault.heading}
          </h2>
          <p className="mt-0.5 text-xs text-[#57534E] sm:text-sm">
            {tv.vault.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="manage-memory-categories-btn"
            onClick={() => setCatModalOpen(true)}
            className="btn-secondary text-xs sm:text-sm"
          >
            <Tag className="h-4 w-4 text-[#2D5A47]" />
            <span>{tv.vault.manageCategories}</span>
          </button>
          <button
            type="button"
            id="new-vault-memory-btn"
            onClick={openCreateModal}
            className="btn-primary text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{tv.vault.newMemory}</span>
          </button>
        </div>
      </div>

      {/* Pending Tag Notifications (Copy-on-Confirm) */}
      {incomingTags.length > 0 && (
        <section className="rounded-2xl border border-[#EAD9B0] bg-[#FAF4E6] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#855F1C]">
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>
              {tv.vault.pendingTagsHeading} ({incomingTags.length})
            </span>
          </div>
          <div className="space-y-2.5">
            {incomingTags.map((tag) => {
              const tagger = memberLookup.get(tag.tagged_by);
              const isConfirming = confirmingTagId === tag.id;
              return (
                <div
                  key={tag.id}
                  className="flex flex-col justify-between gap-3 rounded-xl bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-[#57534E]">
                      <strong className="text-[#1C1917]">
                        {tagger?.name || t.common.unknownMember}
                      </strong>{" "}
                      {tv.vault.taggedYouIn}{" "}
                      <strong className="text-[#1C1917]">
                        &ldquo;{tag.memory_title_snapshot}&rdquo;
                      </strong>
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#78716C]">
                      {tag.memory_category_snapshot} ·{" "}
                      {formatDate(tag.memory_occurred_at_snapshot)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={isConfirming}
                      onClick={() => void handleConfirmTag(tag.id)}
                      className="btn-primary py-1.5 text-xs"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{tv.vault.confirmingCopy}</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>{tv.vault.confirmCopyButton}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDismissTag(tag.id)}
                      className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
                      aria-label={tv.vault.dismissTag}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Instant Search Bar & Category Filter Pills */}
      <div className="surface-card space-y-3 rounded-2xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
          <input
            id="vault-instant-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tv.vault.searchPlaceholder}
            className="input-base pl-10"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              categoryFilter === "all"
                ? "bg-[#1C1917] text-white"
                : "bg-[#F4F0EA] text-[#57534E] hover:bg-[#EAE4DB]"
            }`}
          >
            {tv.vault.allCategories}
          </button>
          {effectiveCategories.map((cat) => {
            const active =
              categoryFilter.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setCategoryFilter(active ? "all" : cat.name)
                }
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  active
                    ? "border-[#1C1917] bg-[#1C1917] text-white"
                    : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory Vault Cards */}
      {memories.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center rounded-3xl p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F2EE] text-[#2D5A47]">
            <BookMarked className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[#1C1917]">
            {tv.vault.emptyTitle}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-[#57534E]">
            {tv.vault.emptySubtitle}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary mt-5"
          >
            <Plus className="h-4 w-4" />
            <span>{tv.vault.newMemory}</span>
          </button>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center">
          <p className="text-sm text-[#6B655E]">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMemories.map((memory) => {
            const catColor =
              categoryColorMap.get(memory.category_name.toLowerCase()) ??
              resolveCategoryColor(memory.category_name);
            const memoryTags = outgoingTagsByMemory.get(memory.id) ?? [];
            const threadComments = commentsByThread.get(memory.thread_id) ?? [];
            const threadOpen = Boolean(expandedThreads[memory.thread_id]);

            return (
              <article
                key={memory.id}
                className="surface-card flex flex-col justify-between rounded-2xl p-5"
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E1D8] bg-[#FAF8F5] px-2.5 py-0.5 text-[11px] font-semibold text-[#1C1917]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        {memory.category_name}
                      </span>
                      {memory.source_memory_id && (
                        <span className="rounded-full bg-[#EBF2F8] px-2 py-0.5 text-[10px] font-semibold text-[#284D72]">
                          {tv.vault.copiedBadge}
                        </span>
                      )}
                      {memory.shared_to_feed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F2EE] px-2 py-0.5 text-[10px] font-semibold text-[#234738]">
                          <Sparkles className="h-2.5 w-2.5" />
                          {tv.vault.sharedOnFeedBadge}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F0EA] px-2 py-0.5 text-[10px] font-medium text-[#78716C]">
                          <Lock className="h-2.5 w-2.5" />
                          {tv.vault.unsharedNote}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(memory)}
                        className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
                        aria-label={t.common.edit}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteMemory(memory.id)}
                        className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="mt-3 font-display text-base font-bold text-[#1C1917]">
                    {memory.title}
                  </h3>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#6B655E]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#78716C]" />
                      {formatDate(memory.occurred_at)} ·{" "}
                      {formatTime(memory.occurred_at)}
                    </span>

                    {memory.rating && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-[#B8862D]">
                        {Array.from({ length: memory.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-[#B8862D] text-[#B8862D]"
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  {memory.location_name && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#E9F2EE]/70 px-2.5 py-1 text-xs font-medium text-[#234738]">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{memory.location_name}</span>
                    </p>
                  )}

                  {memory.notes && (
                    <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-[#44403C]">
                      {memory.notes}
                    </p>
                  )}

                  {/* Tagged Family Members Status */}
                  {memoryTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-[#78716C]">
                        {tv.vault.taggedMembersPrefix}:
                      </span>
                      {memoryTags.map((tag) => {
                        const person = memberLookup.get(tag.tagged_user_id);
                        return (
                          <span
                            key={tag.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              tag.status === "confirmed"
                                ? "bg-[#E9F2EE] text-[#234738]"
                                : "bg-[#FAF4E6] text-[#855F1C]"
                            }`}
                          >
                            {tag.status === "confirmed" && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            <span>
                              {person?.name || t.common.unknownMember}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 border-t border-[#EFEAE2] pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedThreads((prev) => ({
                          ...prev,
                          [memory.thread_id]: !prev[memory.thread_id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#57534E] transition hover:bg-[#F4F0EA] cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>
                        {threadComments.length} {tv.vault.commentsLabel}
                      </span>
                    </button>

                    {!memory.shared_to_feed && activeFamily && (
                      <button
                        type="button"
                        disabled={sharingMemoryId === memory.id}
                        onClick={() => void handleOneTapShare(memory)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#E9F2EE] px-3 py-1.5 text-xs font-semibold text-[#234738] transition hover:bg-[#D8EAE2] cursor-pointer disabled:opacity-60"
                      >
                        {sharingMemoryId === memory.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                        <span>{tv.vault.shareNowButton}</span>
                      </button>
                    )}
                  </div>

                  {/* Connected Comments Thread */}
                  {threadOpen && (
                    <div className="mt-3 space-y-2.5 border-t border-[#EFEAE2] pt-3">
                      {threadComments.length === 0 ? (
                        <p className="text-xs text-[#78716C]">
                          {tv.vault.noCommentsYet}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {threadComments.map((c) => {
                            const author = memberLookup.get(c.user_id);
                            return (
                              <li
                                key={c.id}
                                className="flex items-start gap-2 rounded-xl bg-[#FAF8F5] p-2.5"
                              >
                                <Avatar
                                  src={author?.avatar}
                                  name={
                                    author?.name ||
                                    profile.full_name ||
                                    profile.email
                                  }
                                  size="xs"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold text-[#1C1917]">
                                    {author?.name ||
                                      profile.full_name ||
                                      t.common.you}
                                  </p>
                                  <p className="mt-0.5 text-xs text-[#44403C]">
                                    {c.content}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <form
                        onSubmit={(e) => void handleAddComment(e, memory)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentDrafts[memory.thread_id] ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [memory.thread_id]: e.target.value,
                            }))
                          }
                          placeholder={tv.vault.addCommentPlaceholder}
                          className="input-base flex-1 py-1.5"
                        />
                        <button
                          type="submit"
                          disabled={
                            postingThreadId === memory.thread_id ||
                            !(commentDrafts[memory.thread_id] ?? "").trim()
                          }
                          className="btn-primary shrink-0 px-3 py-1.5"
                          aria-label={t.feed.postComment}
                        >
                          {postingThreadId === memory.thread_id ? (
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

      {/* Zero-Scroll Smart Template Memory Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMemory ? tv.vault.editMemory : tv.vault.newMemory}
      >
        <form
          onSubmit={handleSaveMemory}
          className="box-border w-full max-w-full min-w-0 space-y-2.5"
        >
          {/* Horizontal Category Pill Selector (auto-adapts template) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {effectiveCategories.map((cat) => {
              const selected =
                selectedCategoryName.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategoryInModal(cat)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    selected
                      ? "border-[#1C1917] bg-[#1C1917] text-white"
                      : "border-[#E7E1D8] bg-[#FAF8F5] text-[#57534E]"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Title / Reference */}
          <div className="min-w-0">
            <input
              id="vault-memory-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                templateType === "media"
                  ? tv.vault.titlePlaceholderMedia
                  : templateType === "location"
                    ? tv.vault.titlePlaceholderLocation
                    : tv.vault.titlePlaceholderGeneral
              }
              aria-label={
                templateType === "media"
                  ? tv.vault.titleLabelMedia
                  : templateType === "location"
                    ? tv.vault.titleLabelLocation
                    : tv.vault.titleLabelGeneral
              }
              className="input-base py-2"
            />
          </div>

          {/* Hike / Trip GPS Place Row */}
          {templateType === "location" && (
            <div className="flex items-center gap-2">
              <input
                id="vault-location-input"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={tv.vault.placeNamePlaceholder}
                aria-label={tv.vault.placeNameLabel}
                className="input-base flex-1 py-2"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingGps}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#C9DED5] bg-[#E9F2EE] px-2.5 py-2 text-xs font-semibold text-[#234738] transition hover:bg-[#D8EAE2] cursor-pointer disabled:opacity-60"
                title={tv.vault.useCurrentLocation}
              >
                {locatingGps ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {locatingGps
                    ? tv.vault.locating
                    : tv.vault.useCurrentLocation}
                </span>
              </button>
            </div>
          )}

          {/* Date/Time + Media 1-5 Rating */}
          <div
            className={`grid w-full max-w-full gap-2 ${
              templateType === "media" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div className="min-w-0">
              <label
                htmlFor="vault-occurred-at"
                className="mb-0.5 block text-[11px] font-semibold text-[#57534E]"
              >
                {tv.vault.dateTimeLabel}
              </label>
              <input
                id="vault-occurred-at"
                type="datetime-local"
                required
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="input-base w-full min-w-0 max-w-full box-border py-1.5"
              />
            </div>

            {templateType === "media" && (
              <div className="min-w-0">
                <span className="mb-0.5 block text-[11px] font-semibold text-[#57534E]">
                  {tv.vault.ratingLabel}
                </span>
                <div className="flex h-[38px] items-center gap-1 rounded-xl border border-[#D5CDC1] bg-white px-2.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = rating !== null && star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setRating(rating === star ? null : star)
                        }
                        aria-label={`${star} stars`}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 transition ${
                            active
                              ? "fill-[#B8862D] text-[#B8862D]"
                              : "text-[#D5CDC1]"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="min-w-0">
            <textarea
              id="vault-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tv.vault.notesPlaceholder}
              aria-label={tv.vault.notesLabel}
              className="input-base resize-none py-2"
            />
          </div>

          {/* Tag Family Members Chips */}
          {otherFamilyMembers.length > 0 && (
            <div className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-[#57534E]">
                {tv.vault.tagMembersLabel}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {otherFamilyMembers.map((m) => {
                  const selected = taggedMemberIds.includes(m.user_id);
                  const displayName =
                    m.profile?.full_name?.split(" ")[0] ||
                    m.profile?.email ||
                    t.common.unknownMember;
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => toggleTaggedMember(m.user_id)}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        selected
                          ? "border-[#2D5A47] bg-[#E9F2EE] font-semibold text-[#234738]"
                          : "border-[#E7E1D8] bg-white text-[#57534E]"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      <span>{displayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Link to Shared Family Goal & Share to Family Pulse */}
          {activeFamily && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 rounded-xl bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareToFeed}
                  onChange={(e) => setShareToFeed(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-[#D5CDC1] accent-[#2D5A47]"
                />
                <span>{tv.vault.shareToFeedLabel}</span>
              </label>

              {familyGoals.length > 0 && (
                <select
                  aria-label={tv.vault.linkGoalLabel}
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="input-base py-1.5 sm:w-48"
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
              )}
            </div>
          )}

          {/* Action Row */}
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
              disabled={saving}
              className="btn-primary w-full py-2 sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.common.saving}</span>
                </>
              ) : (
                <span>
                  {editingMemory ? t.common.save : t.common.save}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Custom Memory Categories Manager Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={tv.vault.manageCategories}
      >
        <div className="space-y-3">
          <form onSubmit={handleCreateCategory} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={tv.vault.newCategoryPlaceholder}
                className="input-base flex-1 py-2"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="btn-primary shrink-0 py-2"
              >
                {savingCat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  tv.calendarExt.addCategory
                )}
              </button>
            </div>

            <select
              aria-label={tv.vault.templateLabel}
              value={newCatTemplate}
              onChange={(e) =>
                setNewCatTemplate(e.target.value as MemoryTemplateType)
              }
              className="input-base py-1.5"
            >
              {(["media", "location", "general"] as MemoryTemplateType[]).map(
                (tpl) => (
                  <option key={tpl} value={tpl}>
                    {tv.vault.templates[tpl]}
                  </option>
                )
              )}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewCatColor(hex)}
                  aria-label={`Color ${hex}`}
                  className={`h-6 w-6 rounded-full transition cursor-pointer ${
                    newCatColor === hex
                      ? "ring-2 ring-[#1C1917] ring-offset-2"
                      : ""
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </form>

          <div className="max-h-56 divide-y divide-[#EFEAE2] overflow-y-auto rounded-xl border border-[#EFEAE2] bg-[#FAF8F5] px-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917]">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <p className="pl-5 text-[11px] text-[#78716C]">
                    {tv.vault.templates[cat.template_type]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteCategory(cat)}
                  className="rounded-lg p-1 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                  aria-label={t.common.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
