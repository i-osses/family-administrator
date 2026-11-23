"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  Loader2,
  Mail,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  Users,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { DEFAULT_BANNER_URL } from "@/lib/constants";
import type { FamilyInvitation, FamilyRole } from "@/types/database";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function FamilyManagementPage() {
  const { language, t, formatDate } = useLanguage();
  const { showToast } = useToast();
  const {
    profile,
    activeFamily,
    members,
    loadingFamilies,
    refreshFamilies,
    refreshMembers,
    createFamily,
  } = useFamily();

  // Rename active family (draft tracks edits for the active family without effect sync)
  const [draftFamilyName, setDraftFamilyName] = useState<{
    familyId: string;
    value: string;
  } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const familyNameInput =
    draftFamilyName && draftFamilyName.familyId === activeFamily?.id
      ? draftFamilyName.value
      : (activeFamily?.name ?? "");

  // Banner upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Create new family group
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creatingFamily, setCreatingFamily] = useState(false);

  // Invitations
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FamilyRole>("member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Member actions
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    await Promise.resolve();
    if (!activeFamily) {
      setInvitations([]);
      return;
    }
    setLoadingInvites(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("family_invitations")
        .select("*")
        .eq("family_id", activeFamily.id)
        .order("created_at", { ascending: false });
      setInvitations((data as FamilyInvitation[]) ?? []);
    } finally {
      setLoadingInvites(false);
    }
  }, [activeFamily]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvitations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadInvitations]);

  const isCurrentUserAdmin = activeFamily?.role === "admin";

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    setCreatingFamily(true);
    try {
      await createFamily(newFamilyName);
      setNewFamilyName("");
      showToast(t.family.familyCreatedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleRenameFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !familyNameInput.trim()) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("families")
        .update({ name: familyNameInput.trim() })
        .eq("id", activeFamily.id);

      if (error) throw error;
      setDraftFamilyName(null);
      await refreshFamilies(activeFamily.id);
      showToast(t.family.renameSuccessToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleBannerFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeFamily) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast(t.family.invalidImageError, "error");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      showToast(t.family.imageTooLargeError, "error");
      e.target.value = "";
      return;
    }

    setUploadingBanner(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
      const filePath = `${activeFamily.id}/spotlight-${Date.now()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("spotlight-banners")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("spotlight-banners")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("families")
        .update({ spotlight_banner_url: publicUrlData.publicUrl })
        .eq("id", activeFamily.id);

      if (updateError) throw updateError;

      await refreshFamilies(activeFamily.id);
      showToast(t.family.bannerUpdatedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.errors.generic,
        "error"
      );
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !inviteEmail.trim()) return;

    setSendingInvite(true);
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: activeFamily.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          language,
        }),
      });

      const payload = (await response.json()) as {
        invitation?: FamilyInvitation;
        inviteUrl?: string;
        emailSent?: boolean;
        emailError?: string | null;
        error?: string;
      };

      if (!response.ok) {
        showToast(payload.error || t.errors.generic, "error");
        return;
      }

      setInviteEmail("");
      setInviteRole("member");
      await loadInvitations();

      if (payload.emailSent) {
        showToast(t.family.inviteSentToast, "success");
      } else if (payload.emailError) {
        showToast(
          `${t.family.inviteCreatedNoEmailToast} (${payload.emailError})`,
          "info"
        );
      } else {
        showToast(t.family.inviteCreatedNoEmailToast, "info");
      }
    } catch {
      showToast(t.errors.network, "error");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyInviteLink = async (invite: FamilyInvitation) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      window.location.origin;
    const url = `${baseUrl}/invite/${invite.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      showToast(t.common.copied, "success");
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast(url, "info");
    }
  };

  const handleExpireInvite = async (inviteId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_invitations")
      .update({ status: "expired" })
      .eq("id", inviteId);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    await loadInvitations();
    showToast(t.family.inviteRevokedToast, "success");
  };

  const handleToggleMemberRole = async (
    memberId: string,
    nextRole: FamilyRole
  ) => {
    setBusyMemberId(memberId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("family_members")
        .update({ role: nextRole })
        .eq("id", memberId);

      if (error) throw error;
      await refreshMembers();
      showToast(t.family.roleUpdatedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.family.deleteFamilyError,
        "error"
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, isSelf: boolean) => {
    const confirmed = window.confirm(
      isSelf ? t.family.confirmLeaveFamily : t.family.confirmRemoveMember
    );
    if (!confirmed) return;

    setBusyMemberId(memberId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      if (isSelf) {
        await refreshFamilies();
      } else {
        await refreshMembers();
      }
      showToast(t.family.memberRemovedToast, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.family.deleteFamilyError,
        "error"
      );
    } finally {
      setBusyMemberId(null);
    }
  };

  if (loadingFamilies) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5A47]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1C1917] sm:text-3xl">
          {t.family.title}
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">{t.family.subtitle}</p>
      </header>

      {activeFamily && (
        <>
          {/* Spotlight Banner & Family Details */}
          <section className="surface-card overflow-hidden rounded-3xl">
            <div className="relative h-52 w-full bg-[#EAE4DB] sm:h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeFamily.spotlight_banner_url || DEFAULT_BANNER_URL}
                alt={activeFamily.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/75 via-[#1C1917]/20 to-transparent" />
              <div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-end justify-between gap-3 sm:right-7 sm:bottom-6 sm:left-7">
                <div className="text-white">
                  <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">
                    {t.family.spotlightSectionTitle}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold">
                    {activeFamily.name}
                  </h2>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleBannerFileChange}
                    className="hidden"
                    id="spotlight-banner-file-input"
                  />
                  <button
                    type="button"
                    id="upload-spotlight-banner-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-xs font-semibold text-[#1C1917] shadow-md backdrop-blur-sm transition hover:bg-white cursor-pointer disabled:opacity-60"
                  >
                    {uploadingBanner ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#2D5A47]" />
                        <span>{t.family.uploadingBanner}</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 text-[#2D5A47]" />
                        <span>
                          {activeFamily.spotlight_banner_url
                            ? t.family.changeBanner
                            : t.family.uploadBanner}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs text-[#78716C]">{t.family.bannerHint}</p>
              <form
                onSubmit={handleRenameFamily}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label
                    htmlFor="edit-family-name"
                    className="mb-1.5 block text-xs font-semibold text-[#57534E]"
                  >
                    {t.family.familyNameLabel}
                  </label>
                  <input
                    id="edit-family-name"
                    type="text"
                    required
                    value={familyNameInput}
                    onChange={(e) =>
                      setDraftFamilyName({
                        familyId: activeFamily.id,
                        value: e.target.value,
                      })
                    }
                    className="input-base"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    savingName ||
                    !familyNameInput.trim() ||
                    familyNameInput.trim() === activeFamily.name
                  }
                  className="btn-primary sm:shrink-0"
                >
                  {savingName ? t.common.saving : t.family.saveNameButton}
                </button>
              </form>
            </div>
          </section>

          {/* Members & Invitations Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Members Roster */}
            <section className="surface-card rounded-2xl p-5 sm:p-6 lg:col-span-7">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#2D5A47]" />
                <div>
                  <h2 className="font-display text-base font-bold text-[#1C1917]">
                    {t.family.membersTitle} ({members.length})
                  </h2>
                  <p className="text-xs text-[#6B655E]">
                    {t.family.membersSubtitle}
                  </p>
                </div>
              </div>

              <ul className="mt-5 divide-y divide-[#EFEAE2]">
                {members.map((member) => {
                  const isSelf = member.user_id === profile.id;
                  const displayName =
                    member.profile?.full_name ||
                    member.profile?.email ||
                    t.common.unknownMember;
                  const isBusy = busyMemberId === member.id;

                  return (
                    <li
                      key={member.id}
                      className="flex flex-col justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          src={member.profile?.avatar_url}
                          name={displayName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[#1C1917]">
                              {displayName}
                            </p>
                            {isSelf && (
                              <span className="rounded-full bg-[#F3EFE9] px-2 py-0.5 text-[10px] font-semibold text-[#57534E]">
                                {t.common.you}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-[#6B655E]">
                            {member.profile?.email} · {t.family.joinedOn}{" "}
                            {formatDate(member.joined_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            member.role === "admin"
                              ? "bg-[#E9F2EE] text-[#234738]"
                              : "bg-[#F3EFE9] text-[#57534E]"
                          }`}
                        >
                          {member.role === "admin" && (
                            <Shield className="h-3 w-3" />
                          )}
                          {member.role === "admin"
                            ? t.common.admin
                            : t.common.member}
                        </span>

                        {isCurrentUserAdmin && !isSelf && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleToggleMemberRole(
                                member.id,
                                member.role === "admin" ? "member" : "admin"
                              )
                            }
                            className="rounded-lg border border-[#DFD8CE] bg-white px-2.5 py-1 text-xs font-medium text-[#57534E] transition hover:bg-[#F5F2EC] hover:text-[#1C1917] cursor-pointer disabled:opacity-50"
                          >
                            {member.role === "admin"
                              ? t.family.makeMember
                              : t.family.makeAdmin}
                          </button>
                        )}

                        {(isCurrentUserAdmin && !isSelf) ||
                        (isSelf && members.length > 1) ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleRemoveMember(member.id, isSelf)
                            }
                            title={
                              isSelf
                                ? t.family.leaveFamily
                                : t.family.removeMember
                            }
                            className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer disabled:opacity-50"
                          >
                            {isSelf ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Email Invitation Form & History */}
            <section className="surface-card rounded-2xl p-5 sm:p-6 lg:col-span-5">
              <div className="flex items-center gap-2.5">
                <Mail className="h-5 w-5 text-[#2D5A47]" />
                <div>
                  <h2 className="font-display text-base font-bold text-[#1C1917]">
                    {t.family.inviteTitle}
                  </h2>
                  <p className="text-xs text-[#6B655E]">
                    {t.family.inviteSubtitle}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendInvite} className="mt-5 space-y-3">
                <div>
                  <label
                    htmlFor="invite-email-input"
                    className="mb-1 block text-xs font-semibold text-[#57534E]"
                  >
                    {t.family.emailLabel}
                  </label>
                  <input
                    id="invite-email-input"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t.family.emailPlaceholder}
                    className="input-base"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invite-role-select"
                    className="mb-1 block text-xs font-semibold text-[#57534E]"
                  >
                    {t.family.roleLabel}
                  </label>
                  <select
                    id="invite-role-select"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as FamilyRole)
                    }
                    className="input-base"
                  >
                    <option value="member">{t.common.member}</option>
                    <option value="admin">{t.common.admin}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  id="send-invite-button"
                  disabled={sendingInvite || !inviteEmail.trim()}
                  className="btn-primary w-full"
                >
                  {sendingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t.family.sendingInvite}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>{t.family.sendInviteButton}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Invitations History */}
              <div className="mt-6 border-t border-[#EFEAE2] pt-5">
                <h3 className="text-xs font-semibold tracking-wider text-[#6B655E] uppercase">
                  {t.family.invitationsHistoryTitle}
                </h3>

                {loadingInvites ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-[#78716C]" />
                  </div>
                ) : invitations.length === 0 ? (
                  <p className="mt-3 text-xs text-[#78716C]">
                    {t.family.noInvitations}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {invitations.map((invite) => {
                      const statusStyle =
                        invite.status === "accepted"
                          ? "bg-[#E9F2EE] text-[#234738]"
                          : invite.status === "expired"
                            ? "bg-[#F3EFE9] text-[#78716C]"
                            : "bg-[#FAF4E6] text-[#855F1C]";

                      const statusLabel =
                        invite.status === "accepted"
                          ? t.family.statusAccepted
                          : invite.status === "expired"
                            ? t.family.statusExpired
                            : t.family.statusPending;

                      return (
                        <li
                          key={invite.id}
                          className="rounded-xl border border-[#EFEAE2] bg-[#FAF8F5]/70 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[#1C1917]">
                                {invite.invited_email}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#78716C]">
                                {invite.role === "admin"
                                  ? t.common.admin
                                  : t.common.member}{" "}
                                · {formatDate(invite.created_at)}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          {invite.status === "pending" && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleCopyInviteLink(invite)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#DFD8CE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1C1917] transition hover:bg-[#F3EFE9] cursor-pointer"
                              >
                                {copiedId === invite.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-[#2D5A47]" />
                                    <span>{t.common.copied}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-[#78716C]" />
                                    <span>{t.common.copyLink}</span>
                                  </>
                                )}
                              </button>

                              {(isCurrentUserAdmin ||
                                invite.invited_by === profile.id) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleExpireInvite(invite.id)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#78716C] transition hover:bg-[#FDF5F3] hover:text-[#C86D51] cursor-pointer"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>{t.family.revokeInvite}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* Create New Family Group */}
      <section
        id="create-family"
        className="surface-card rounded-2xl p-5 sm:p-6"
      >
        <h2 className="font-display text-base font-bold text-[#1C1917]">
          {t.family.createNewTitle}
        </h2>
        <p className="mt-1 text-xs text-[#6B655E]">
          {t.family.createNewSubtitle}
        </p>

        <form
          onSubmit={handleCreateFamily}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="new-family-name-input"
              className="mb-1.5 block text-xs font-semibold text-[#57534E]"
            >
              {t.family.familyNameLabel}
            </label>
            <input
              id="new-family-name-input"
              type="text"
              required
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              placeholder={t.family.familyNamePlaceholder}
              className="input-base"
            />
          </div>
          <button
            type="submit"
            id="create-family-button"
            disabled={creatingFamily || !newFamilyName.trim()}
            className="btn-primary sm:shrink-0"
          >
            {creatingFamily ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.common.creating}</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>{t.family.createFamilyButton}</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
