"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookHeart,
  Calendar,
  Camera,
  Edit3,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { NoFamilyState } from "@/components/dashboard/NoFamilyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import type { ActivityMemory } from "@/types/database";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function todayDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function MemoriesPage() {
  const { t, formatDate } = useLanguage();
  const { showToast } = useToast();
  const { profile, activeFamily, members, loadingFamilies } = useFamily();

  const [memories, setMemories] = useState<ActivityMemory[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<ActivityMemory | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(todayDateInput);
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadMemories = useCallback(async () => {
    if (!activeFamily) {
      setMemories([]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("activity_memories")
        .select("*")
        .eq("family_id", activeFamily.id)
        .order("activity_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch memories:", error.message);
        return;
      }

      setMemories((data as ActivityMemory[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [activeFamily]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMemories();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMemories]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const memory of memories) {
      for (const tag of memory.tags ?? []) {
        if (tag.trim()) tagSet.add(tag.trim().toLowerCase());
      }
    }
    return Array.from(tagSet).sort();
  }, [memories]);

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      map.set(
        m.user_id,
        m.profile?.full_name || m.profile?.email || t.common.unknownMember
      );
    }
    return map;
  }, [members, t.common.unknownMember]);

  const filteredMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = memories.filter((memory) => {
      if (
        selectedTag !== "all" &&
        !(memory.tags ?? []).some((tag) => tag.toLowerCase() === selectedTag)
      ) {
        return false;
      }
      if (!q) return true;
      const inTitle = memory.title.toLowerCase().includes(q);
      const inNotes = (memory.notes ?? "").toLowerCase().includes(q);
      const inTags = (memory.tags ?? []).some((tag) =>
        tag.toLowerCase().includes(q)
      );
      return inTitle || inNotes || inTags;
    });

    return [...list].sort((a, b) => {
      const cmp = a.activity_date.localeCompare(b.activity_date);
      return sortOrder === "newest" ? -cmp : cmp;
    });
  }, [memories, searchQuery, selectedTag, sortOrder]);

  const openCreateModal = () => {
    setEditingMemory(null);
    setTitle("");
    setActivityDate(todayDateInput());
    setNotes("");
    setTagsInput("");
    setPhotoUrl(null);
    setModalOpen(true);
  };

  const openEditModal = (memory: ActivityMemory) => {
    setEditingMemory(memory);
    setTitle(memory.title);
    setActivityDate(memory.activity_date);
    setNotes(memory.notes ?? "");
    setTagsInput((memory.tags ?? []).join(", "));
    setPhotoUrl(memory.photo_url);
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
      const filePath = `${activeFamily.id}/memory-${Date.now()}.${safeExt}`;

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

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !title.trim() || !activityDate) return;

    const parsedTags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
      )
    );

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        family_id: activeFamily.id,
        title: title.trim(),
        notes: notes.trim() || null,
        activity_date: activityDate,
        tags: parsedTags,
        photo_url: photoUrl,
      };

      if (editingMemory) {
        const { error } = await supabase
          .from("activity_memories")
          .update(payload)
          .eq("id", editingMemory.id);
        if (error) throw error;
        showToast(t.memories.memoryUpdatedToast, "success");
      } else {
        const { error } = await supabase.from("activity_memories").insert({
          ...payload,
          created_by: profile.id,
        });
        if (error) throw error;
        showToast(t.memories.memoryCreatedToast, "success");
      }

      setModalOpen(false);
      await loadMemories();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm(t.memories.confirmDeleteMemory)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("activity_memories")
      .delete()
      .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }
    showToast(t.memories.memoryDeletedToast, "success");
    await loadMemories();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
            {t.memories.title}
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">{t.memories.subtitle}</p>
        </div>

        <button
          type="button"
          id="new-memory-button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t.memories.newMemory}</span>
        </button>
      </div>

      {/* Search & Tag Filters */}
      <div className="surface-card space-y-3 rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
            <input
              id="memories-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.memories.searchPlaceholder}
              className="input-base pl-10"
            />
          </div>

          <select
            aria-label="Sort memories"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "newest" | "oldest")
            }
            className="input-base sm:w-44"
          >
            <option value="newest">{t.memories.sortNewest}</option>
            <option value="oldest">{t.memories.sortOldest}</option>
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
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
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  selectedTag === tag
                    ? "border-[#2D5A47] bg-[#E9F2EE] font-semibold text-[#234738]"
                    : "border-[#E7E1D8] bg-white text-[#57534E] hover:bg-[#FAF8F5]"
                }`}
              >
                <Tag className="h-3 w-3" />
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Memories Feed */}
      {loading ? (
        <div className="surface-card flex h-64 items-center justify-center rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
        </div>
      ) : memories.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center rounded-3xl p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF0EC] text-[#C86D51]">
            <BookHeart className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-[#1C1917]">
            {t.memories.emptyTitle}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-[#57534E]">
            {t.memories.emptySubtitle}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary mt-5"
          >
            <Plus className="h-4 w-4" />
            <span>{t.memories.newMemory}</span>
          </button>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <p className="text-sm text-[#6B655E]">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => {
            const authorName = memory.created_by
              ? memberNameMap.get(memory.created_by)
              : null;

            return (
              <article
                key={memory.id}
                className="surface-card flex flex-col overflow-hidden rounded-2xl transition hover:border-[#D5CDC1]"
              >
                {memory.photo_url && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#EAE4DB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={memory.photo_url}
                      alt={memory.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78716C]">
                      <Calendar className="h-3.5 w-3.5 text-[#C86D51]" />
                      <span>{formatDate(memory.activity_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
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

                  <h2 className="mt-2 font-display text-base font-bold text-[#1C1917]">
                    {memory.title}
                  </h2>

                  {memory.notes && (
                    <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-[#57534E]">
                      {memory.notes}
                    </p>
                  )}

                  {memory.tags && memory.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {memory.tags.map((tag) => (
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

                  {authorName && (
                    <p className="mt-4 border-t border-[#EFEAE2] pt-3 text-[11px] text-[#78716C]">
                      {t.memories.loggedBy} {authorName}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Memory Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMemory ? t.memories.editMemory : t.memories.newMemory}
      >
        <form onSubmit={handleSaveMemory} className="space-y-4">
          <div>
            <label
              htmlFor="memory-title-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.memories.titleLabel}
            </label>
            <input
              id="memory-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.memories.titlePlaceholder}
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="memory-date-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.memories.dateLabel}
            </label>
            <input
              id="memory-date-input"
              type="date"
              required
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="input-base"
            />
          </div>

          <div>
            <label
              htmlFor="memory-notes-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.memories.notesLabel}
            </label>
            <textarea
              id="memory-notes-input"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.memories.notesPlaceholder}
              className="input-base resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="memory-tags-input"
              className="mb-1 block text-xs font-semibold text-[#57534E]"
            >
              {t.memories.tagsLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </label>
            <input
              id="memory-tags-input"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={t.memories.tagsPlaceholder}
              className="input-base"
            />
            <p className="mt-1 text-[11px] text-[#78716C]">
              {t.memories.tagsHint}
            </p>
          </div>

          {/* Optional Photo Upload */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-[#57534E]">
              {t.memories.photoLabel}{" "}
              <span className="font-normal text-[#A8A29E]">
                ({t.common.optional})
              </span>
            </span>

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
                  alt={title || "Memory preview"}
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-[#1C1917]/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs hover:bg-[#1C1917] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{t.memories.removePhoto}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D5CDC1] bg-[#FAF8F5] py-4 text-xs font-semibold text-[#57534E] transition hover:border-[#2D5A47] hover:text-[#2D5A47] cursor-pointer disabled:opacity-60"
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

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.common.saving}</span>
                </>
              ) : (
                <span>
                  {editingMemory ? t.common.save : t.common.create}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
