import type {
  FeedPostType,
  HabitCadence,
  HabitCategory,
  Language,
  PersonalBucket,
  RecurringFrequency,
} from "@/types/database";

export interface Dictionary {
  appName: string;
  tagline: string;
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    deleting: string;
    edit: string;
    create: string;
    creating: string;
    close: string;
    confirm: string;
    search: string;
    filter: string;
    all: string;
    today: string;
    viewAll: string;
    signOut: string;
    signIn: string;
    continueWithGoogle: string;
    backToHome: string;
    copyLink: string;
    copied: string;
    noResults: string;
    optional: string;
    required: string;
    unknownMember: string;
    everyone: string;
    languageLabel: string;
    english: string;
    spanish: string;
    admin: string;
    member: string;
    you: string;
    privateBadge: string;
    sharedBadge: string;
  };
  nav: {
    familyHubSection: string;
    mySpaceSection: string;
    overview: string;
    family: string;
    calendar: string;
    memories: string;
    familyFeed: string;
    mySpace: string;
    budget: string;
    familyBudget: string;
    switchFamily: string;
    newFamily: string;
    noFamilySelected: string;
  };
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustNote: string;
    pillarsHeading: string;
    pillarsSubheading: string;
    pillars: {
      familyTitle: string;
      familyDesc: string;
      calendarTitle: string;
      calendarDesc: string;
      memoriesTitle: string;
      memoriesDesc: string;
      budgetTitle: string;
      budgetDesc: string;
    };
    previewCard: {
      spotlightLabel: string;
      familyName: string;
      upcomingTitle: string;
      upcomingEvent: string;
      budgetTitle: string;
      budgetValue: string;
      memoryTitle: string;
      memoryNote: string;
    };
    footerCopy: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    inviteNotice: string;
    googleButton: string;
    redirecting: string;
    privacyNote: string;
    errorCallback: string;
    errorOAuth: string;
    setupMissingTitle: string;
    setupMissingBody: string;
  };
  invite: {
    pageTitle: string;
    invitedBy: string;
    roleAssigned: string;
    invitedEmailLabel: string;
    acceptButton: string;
    accepting: string;
    signInToAccept: string;
    acceptedSuccess: string;
    alreadyAcceptedTitle: string;
    alreadyAcceptedDesc: string;
    expiredTitle: string;
    expiredDesc: string;
    notFoundTitle: string;
    notFoundDesc: string;
    goToDashboard: string;
    errorAccepting: string;
  };
  overview: {
    welcomeBack: string;
    membersCount: string;
    memberSingular: string;
    noFamilyTitle: string;
    noFamilySubtitle: string;
    createFirstFamily: string;
    familyNamePlaceholder: string;
    quickActions: string;
    addEvent: string;
    logMemory: string;
    openMySpace: string;
    addTransaction: string;
    manageFamily: string;
    upcomingEvents: string;
    noUpcomingEvents: string;
    monthlyBudget: string;
    totalIncome: string;
    totalExpenses: string;
    netBalance: string;
    recentMemories: string;
    familyPulseHeading: string;
    noRecentMemories: string;
    mySpaceCalloutTitle: string;
    mySpaceCalloutDesc: string;
    mySpaceCalloutButton: string;
  };
  family: {
    title: string;
    subtitle: string;
    createNewTitle: string;
    createNewSubtitle: string;
    familyNameLabel: string;
    familyNamePlaceholder: string;
    createFamilyButton: string;
    familyCreatedToast: string;
    spotlightSectionTitle: string;
    spotlightSectionSubtitle: string;
    uploadBanner: string;
    uploadingBanner: string;
    changeBanner: string;
    bannerHint: string;
    bannerUpdatedToast: string;
    renameSuccessToast: string;
    saveNameButton: string;
    membersTitle: string;
    membersSubtitle: string;
    joinedOn: string;
    makeAdmin: string;
    makeMember: string;
    removeMember: string;
    leaveFamily: string;
    memberRemovedToast: string;
    roleUpdatedToast: string;
    inviteTitle: string;
    inviteSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    roleLabel: string;
    sendInviteButton: string;
    sendingInvite: string;
    inviteSentToast: string;
    inviteCreatedNoEmailToast: string;
    invitationsHistoryTitle: string;
    noInvitations: string;
    statusPending: string;
    statusAccepted: string;
    statusExpired: string;
    revokeInvite: string;
    inviteRevokedToast: string;
    deleteFamilyError: string;
    invalidImageError: string;
    imageTooLargeError: string;
    confirmRemoveMember: string;
    confirmLeaveFamily: string;
    modules: {
      title: string;
      subtitle: string;
      adminOnlyBadge: string;
      showCalendarTitle: string;
      showCalendarDesc: string;
      showFeedTitle: string;
      showFeedDesc: string;
      showBudgetTitle: string;
      showBudgetDesc: string;
      showQuickActionsTitle: string;
      showQuickActionsDesc: string;
      savedToast: string;
    };
  };
  calendar: {
    title: string;
    subtitle: string;
    monthView: string;
    agendaView: string;
    newEvent: string;
    editEvent: string;
    eventTitleLabel: string;
    eventTitlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    startTimeLabel: string;
    endTimeLabel: string;
    categoryLabel: string;
    assignedToLabel: string;
    shareToFeedLabel: string;
    shareToFeedHint: string;
    allCategories: string;
    allMembers: string;
    noEventsThisMonth: string;
    noEventsSelectedDay: string;
    eventsForDay: string;
    addForDay: string;
    eventCreatedToast: string;
    eventUpdatedToast: string;
    eventDeletedToast: string;
    endBeforeStartError: string;
    confirmDeleteEvent: string;
    weekdaysShort: [string, string, string, string, string, string, string];
    categories: Record<string, string>;
  };
  memories: {
    title: string;
    subtitle: string;
    newMemory: string;
    editMemory: string;
    searchPlaceholder: string;
    allTags: string;
    sortNewest: string;
    sortOldest: string;
    titleLabel: string;
    titlePlaceholder: string;
    dateLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    tagsHint: string;
    photoLabel: string;
    uploadPhoto: string;
    uploadingPhoto: string;
    removePhoto: string;
    emptyTitle: string;
    emptySubtitle: string;
    memoryCreatedToast: string;
    memoryUpdatedToast: string;
    memoryDeletedToast: string;
    confirmDeleteMemory: string;
    loggedBy: string;
  };
  feed: {
    title: string;
    subtitle: string;
    newPostButton: string;
    shareVideoButton: string;
    composerMemoryTab: string;
    composerVideoTab: string;
    youtubeUrlLabel: string;
    youtubeUrlPlaceholder: string;
    youtubeUrlHint: string;
    youtubeInvalidError: string;
    youtubePreviewLabel: string;
    postTitlePlaceholderVideo: string;
    reflectionLabel: string;
    reflectionPlaceholder: string;
    filterAll: string;
    postTypes: Record<FeedPostType, string>;
    heartAction: string;
    celebrateAction: string;
    commentsLabel: string;
    addCommentPlaceholder: string;
    postComment: string;
    noCommentsYet: string;
    commentAddedToast: string;
    postCreatedToast: string;
    postUpdatedToast: string;
    postDeletedToast: string;
    confirmDeletePost: string;
    emptyTitle: string;
    emptySubtitle: string;
    sharedMilestonePrefix: string;
    watchOnYoutube: string;
  };
  mySpace: {
    title: string;
    subtitle: string;
    privacyBanner: string;
    budgetTab: string;
    habitsTab: string;
    budget: {
      heading: string;
      subheading: string;
      recordIncome: string;
      recordDisbursement: string;
      configureSplits: string;
      splitsModalTitle: string;
      splitsModalSubtitle: string;
      minTenPercentRule: string;
      totalExceedsHundredError: string;
      splitsSavedToast: string;
      buckets: Record<PersonalBucket, string>;
      bucketDescriptions: Record<PersonalBucket, string>;
      freeToSpendSummaryTitle: string;
      currentFreeToSpend: string;
      upcomingRecurringTotal: string;
      netAfterRecurring: string;
      incomeModalTitle: string;
      incomeSourceLabel: string;
      incomeSourcePlaceholder: string;
      incomeAmountLabel: string;
      splitPreviewTitle: string;
      incomeSavedToast: string;
      incomeDeletedToast: string;
      disbursementModalTitle: string;
      disbursementBucketLabel: string;
      disbursementTitleLabel: string;
      disbursementTitlePlaceholder: string;
      disbursementSavedToast: string;
      disbursementDeletedToast: string;
      quickPayTithing: string;
      quickInvest: string;
      quickSpend: string;
      recurringTitle: string;
      recurringSubtitle: string;
      addRecurring: string;
      editRecurring: string;
      recurringNameLabel: string;
      recurringNamePlaceholder: string;
      frequencyLabel: string;
      billingDayLabel: string;
      autoApplyLabel: string;
      autoApplyHint: string;
      applyDueAutoBills: string;
      appliedAutoBillsToast: string;
      markPaid: string;
      paidThisMonth: string;
      dueDayPrefix: string;
      recurringSavedToast: string;
      recurringDeletedToast: string;
      recurringPaidToast: string;
      noRecurringYet: string;
      recentActivityTitle: string;
      incomeHistoryTab: string;
      disbursementsTab: string;
      noIncomeYet: string;
      noDisbursementsYet: string;
      confirmDeleteIncome: string;
      confirmDeleteTx: string;
      confirmDeleteRecurring: string;
      frequencies: Record<RecurringFrequency, string>;
    };
    habits: {
      heading: string;
      subheading: string;
      newItem: string;
      editItem: string;
      filterAll: string;
      filterHabits: string;
      filterTasks: string;
      kindLabel: string;
      kindHabit: string;
      kindTask: string;
      titleLabel: string;
      titlePlaceholderHabit: string;
      titlePlaceholderTask: string;
      cadenceLabel: string;
      categoryLabel: string;
      reminderTimeLabel: string;
      dueDateLabel: string;
      privateNotesLabel: string;
      privateNotesPlaceholder: string;
      privateNotesHint: string;
      allowShareLabel: string;
      allowShareHint: string;
      checkInToday: string;
      checkedInToday: string;
      markDone: string;
      completedLabel: string;
      streakLabel: string;
      bestStreakLabel: string;
      daysUnit: string;
      weeksUnit: string;
      shareMilestoneButton: string;
      sharingMilestone: string;
      milestoneSharedToast: string;
      needFamilyToShareError: string;
      habitSavedToast: string;
      habitUpdatedToast: string;
      habitDeletedToast: string;
      confirmDeleteHabit: string;
      emptyTitle: string;
      emptySubtitle: string;
      todayProgress: string;
      cadences: Record<HabitCadence, string>;
      categories: Record<HabitCategory, string>;
    };
  };
  budget: {
    title: string;
    subtitle: string;
    newEntry: string;
    editEntry: string;
    allMonths: string;
    totalIncome: string;
    totalExpenses: string;
    netBalance: string;
    savingsRate: string;
    income: string;
    expense: string;
    typeLabel: string;
    categoryLabel: string;
    customCategoryPlaceholder: string;
    amountLabel: string;
    dateLabel: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    breakdownTitle: string;
    expenseBreakdown: string;
    incomeBreakdown: string;
    transactionsTitle: string;
    noEntriesTitle: string;
    noEntriesSubtitle: string;
    entryCreatedToast: string;
    entryUpdatedToast: string;
    entryDeletedToast: string;
    invalidAmountError: string;
    confirmDeleteEntry: string;
    allTypes: string;
    allCategories: string;
    entriesCount: string;
    categories: Record<string, string>;
  };
  errors: {
    generic: string;
    network: string;
    unauthorized: string;
    noFamily: string;
  };
}

export const dictionaries: Record<Language, Dictionary> = {
  en: {
    appName: "Family Administrator",
    tagline: "One calm place for your household.",
    common: {
      loading: "Loading...",
      save: "Save changes",
      saving: "Saving...",
      cancel: "Cancel",
      delete: "Delete",
      deleting: "Deleting...",
      edit: "Edit",
      create: "Create",
      creating: "Creating...",
      close: "Close",
      confirm: "Confirm",
      search: "Search",
      filter: "Filter",
      all: "All",
      today: "Today",
      viewAll: "View all",
      signOut: "Sign out",
      signIn: "Sign in",
      continueWithGoogle: "Continue with Google",
      backToHome: "Back to home",
      copyLink: "Copy link",
      copied: "Copied",
      noResults: "No matching items found.",
      optional: "Optional",
      required: "Required",
      unknownMember: "Family member",
      everyone: "Whole family",
      languageLabel: "Language",
      english: "English",
      spanish: "Español",
      admin: "Admin",
      member: "Member",
      you: "You",
      privateBadge: "Private to you",
      sharedBadge: "Shared with family",
    },
    nav: {
      familyHubSection: "Family Hub",
      mySpaceSection: "Private",
      overview: "Hub",
      family: "Family",
      calendar: "Calendar",
      memories: "Family Feed",
      familyFeed: "Feed",
      mySpace: "My Space",
      budget: "Family Budget",
      familyBudget: "Family Budget",
      switchFamily: "Switch family",
      newFamily: "Create new family",
      noFamilySelected: "No family yet",
    },
    landing: {
      heroTitle: "Bring clarity and warmth to everyday family life.",
      heroSubtitle:
        "Coordinate shared schedules, connect on a private family feed, and give every member their own private My Space for personal bucket budgets and daily habits.",
      ctaPrimary: "Continue with Google",
      ctaSecondary: "Sign in to your household",
      trustNote:
        "Protected with Supabase Row Level Security. Family data stays inside your household, and My Space stays strictly private to each individual.",
      pillarsHeading: "Everything your household needs, without the clutter",
      pillarsSubheading:
        "Designed for parents, partners, and kids to stay effortlessly connected while keeping personal finances and journals private.",
      pillars: {
        familyTitle: "Family Hub & Admin Controls",
        familyDesc:
          "Create family spaces, customize your household spotlight banner, manage roles, invite relatives, and choose which shared modules appear on your hub.",
        calendarTitle: "Shared Family Calendar",
        calendarDesc:
          "Switch seamlessly between monthly grid and agenda views with color-coded categories and clear member assignments.",
        memoriesTitle: "Family Pulse Private Feed",
        memoriesDesc:
          "A private family social timeline for photos, shared events, habit milestones, embedded YouTube videos, reactions, and comments.",
        budgetTitle: "Private My Space",
        budgetDesc:
          "Each member gets a private pay-yourself-first bucket ledger (Tithing, Investment, Savings, Free to Spend) and a personal habits & tasks tracker.",
      },
      previewCard: {
        spotlightLabel: "Household Spotlight",
        familyName: "My family",
        upcomingTitle: "Next on the calendar",
        upcomingEvent: "Saturday Farmers Market · 9:30 AM",
        budgetTitle: "Family Pulse",
        budgetValue: "3 new family posts",
        memoryTitle: "Shared milestone",
        memoryNote: "14-day Scripture reading streak!",
      },
      footerCopy:
        "Family Administrator — Private household coordination, bilingual in English and Spanish.",
    },
    auth: {
      loginTitle: "Welcome home",
      loginSubtitle:
        "Sign in with your Google account to access your Family Hub and your private My Space.",
      inviteNotice:
        "Sign in to accept your family invitation and join the household.",
      googleButton: "Continue with Google",
      redirecting: "Redirecting to Google...",
      privacyNote:
        "Your family data stays private to your household, and My Space stays strictly private to you.",
      errorCallback:
        "We could not finish signing you in. Please try again.",
      errorOAuth:
        "Unable to start Google sign-in. Check your Supabase OAuth settings.",
      setupMissingTitle: "Supabase configuration required",
      setupMissingBody:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file and enable Google OAuth in Supabase to sign in.",
    },
    invite: {
      pageTitle: "Family Invitation",
      invitedBy: "Invited by",
      roleAssigned: "Role",
      invitedEmailLabel: "Sent to",
      acceptButton: "Accept & Join Family",
      accepting: "Joining family...",
      signInToAccept: "Continue with Google to accept",
      acceptedSuccess: "Welcome to the family!",
      alreadyAcceptedTitle: "Invitation already accepted",
      alreadyAcceptedDesc:
        "This invitation link has already been used. If you are already a member, head straight to your dashboard.",
      expiredTitle: "Invitation expired",
      expiredDesc:
        "This invitation is no longer active. Ask a family admin to send a fresh invitation.",
      notFoundTitle: "Invitation not found",
      notFoundDesc:
        "We could not find an invitation matching this link. Double-check the URL or ask your family admin for a new invite.",
      goToDashboard: "Go to dashboard",
      errorAccepting: "Could not accept this invitation. Please try again.",
    },
    overview: {
      welcomeBack: "Welcome back",
      membersCount: "members",
      memberSingular: "member",
      noFamilyTitle: "Create your family hub",
      noFamilySubtitle:
        "Start by naming your household. You can customize your spotlight banner and invite family members right after.",
      createFirstFamily: "Create family",
      familyNamePlaceholder: "e.g., My family",
      quickActions: "Quick actions",
      addEvent: "Add event",
      logMemory: "Post to Feed",
      openMySpace: "Open My Space",
      addTransaction: "Family budget",
      manageFamily: "Manage family",
      upcomingEvents: "Upcoming events",
      noUpcomingEvents: "No upcoming events scheduled yet.",
      monthlyBudget: "This month's family budget",
      totalIncome: "Income",
      totalExpenses: "Expenses",
      netBalance: "Net balance",
      recentMemories: "Family Pulse",
      familyPulseHeading: "Latest on Family Pulse",
      noRecentMemories: "No family posts yet. Share a photo, note, or YouTube video!",
      mySpaceCalloutTitle: "Your Private My Space",
      mySpaceCalloutDesc:
        "Track your pay-yourself-first buckets, recurring expenses, daily spiritual & personal habits, and reminders — visible only to you.",
      mySpaceCalloutButton: "Go to My Space",
    },
    family: {
      title: "Family Management",
      subtitle:
        "Customize your household spotlight banner, manage members, send invitations, and configure shared hub modules.",
      createNewTitle: "Create a new family group",
      createNewSubtitle:
        "Organize another household, extended family, or vacation group separately.",
      familyNameLabel: "Family name",
      familyNamePlaceholder: "e.g., My family",
      createFamilyButton: "Create family group",
      familyCreatedToast: "Family group created!",
      spotlightSectionTitle: "Household Spotlight & Details",
      spotlightSectionSubtitle:
        "Personalize your family banner displayed across your dashboard.",
      uploadBanner: "Upload spotlight banner",
      uploadingBanner: "Uploading banner...",
      changeBanner: "Change banner",
      bannerHint:
        "JPG, PNG, or WebP up to 5 MB. Stored securely in Supabase Storage.",
      bannerUpdatedToast: "Spotlight banner updated!",
      renameSuccessToast: "Family name updated!",
      saveNameButton: "Update name",
      membersTitle: "Family Members",
      membersSubtitle: "Everyone who currently has access to this household.",
      joinedOn: "Joined",
      makeAdmin: "Make admin",
      makeMember: "Set as member",
      removeMember: "Remove",
      leaveFamily: "Leave family",
      memberRemovedToast: "Member removed from family.",
      roleUpdatedToast: "Member role updated.",
      inviteTitle: "Invite by Email",
      inviteSubtitle:
        "Send a direct invitation email powered by Supabase with a secure one-click join link.",
      emailLabel: "Email address",
      emailPlaceholder: "relative@example.com",
      roleLabel: "Role",
      sendInviteButton: "Send invitation",
      sendingInvite: "Sending invitation...",
      inviteSentToast: "Invitation email sent directly to their inbox!",
      inviteCreatedNoEmailToast:
        "Invitation created! Copy the invite link below to share it right away.",
      invitationsHistoryTitle: "Sent Invitations",
      noInvitations: "No invitations sent yet.",
      statusPending: "Pending",
      statusAccepted: "Accepted",
      statusExpired: "Expired",
      revokeInvite: "Expire",
      inviteRevokedToast: "Invitation marked as expired.",
      deleteFamilyError: "Could not complete this action.",
      invalidImageError: "Please choose a JPG, PNG, GIF, or WebP image.",
      imageTooLargeError: "Image must be 5 MB or smaller.",
      confirmRemoveMember: "Remove this member from the family?",
      confirmLeaveFamily: "Are you sure you want to leave this family?",
      modules: {
        title: "Module Visibility",
        subtitle:
          "Choose which shared modules appear on the Family Hub home screen for all members of this family.",
        adminOnlyBadge: "Admin only",
        showCalendarTitle: "Shared Calendar widget",
        showCalendarDesc:
          "Display upcoming family calendar events on the main Family Hub overview.",
        showFeedTitle: "Family Pulse feed highlights",
        showFeedDesc:
          "Show the latest family photos, milestones, and shared YouTube videos on the Family Hub overview.",
        showBudgetTitle: "Shared Family Budget module",
        showBudgetDesc:
          "Hidden by default. Turn on to show a shared household budget summary on the Family Hub and navigation.",
        showQuickActionsTitle: "Quick actions bar",
        showQuickActionsDesc:
          "Display shortcut buttons directly beneath the household spotlight banner.",
        savedToast: "Module visibility updated.",
      },
    },
    calendar: {
      title: "Shared Family Calendar",
      subtitle:
        "Coordinate appointments, school schedules, chores, and celebrations together.",
      monthView: "Month",
      agendaView: "Agenda",
      newEvent: "New event",
      editEvent: "Edit event",
      eventTitleLabel: "Event title",
      eventTitlePlaceholder: "e.g., Pediatrician checkup",
      descriptionLabel: "Details",
      descriptionPlaceholder: "Location, notes, or what to bring...",
      startTimeLabel: "Starts",
      endTimeLabel: "Ends",
      categoryLabel: "Category",
      assignedToLabel: "Assigned to",
      shareToFeedLabel: "Also share on Family Pulse feed",
      shareToFeedHint:
        "Posts this event to the private family timeline so everyone can react and comment.",
      allCategories: "All categories",
      allMembers: "All members",
      noEventsThisMonth: "No events scheduled for this view.",
      noEventsSelectedDay: "Nothing planned for this day.",
      eventsForDay: "Schedule for",
      addForDay: "Add event",
      eventCreatedToast: "Event added to the calendar.",
      eventUpdatedToast: "Event updated.",
      eventDeletedToast: "Event deleted.",
      endBeforeStartError: "End time must be after the start time.",
      confirmDeleteEvent: "Delete this calendar event?",
      weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      categories: {
        family: "Family",
        school: "School",
        health: "Health",
        chores: "Chores",
        celebration: "Celebration",
        travel: "Travel",
        other: "Other",
      },
    },
    memories: {
      title: "Family Pulse",
      subtitle:
        "Your private family timeline for photos, shared videos, milestones, and everyday moments.",
      newMemory: "New post",
      editMemory: "Edit post",
      searchPlaceholder: "Search posts, reflections, or tags...",
      allTags: "All tags",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
      titleLabel: "Title",
      titlePlaceholder: "e.g., Sunday botanical garden walk",
      dateLabel: "Date",
      notesLabel: "Story & reflection",
      notesPlaceholder: "Share a reflection, memory, or family update...",
      tagsLabel: "Tags",
      tagsPlaceholder: "weekend, outdoors, milestone",
      tagsHint: "Separate multiple tags with commas.",
      photoLabel: "Photo",
      uploadPhoto: "Upload photo",
      uploadingPhoto: "Uploading photo...",
      removePhoto: "Remove photo",
      emptyTitle: "Welcome to Family Pulse",
      emptySubtitle:
        "Share your first family photo, uplifting YouTube video, or milestone together.",
      memoryCreatedToast: "Posted to Family Pulse!",
      memoryUpdatedToast: "Post updated.",
      memoryDeletedToast: "Post deleted.",
      confirmDeleteMemory: "Delete this family post?",
      loggedBy: "Shared by",
    },
    feed: {
      title: "Family Pulse",
      subtitle:
        "A private household feed for family photos, shared events, milestones, and embedded YouTube videos.",
      newPostButton: "New post",
      shareVideoButton: "Share YouTube",
      composerMemoryTab: "Photo & Note",
      composerVideoTab: "YouTube Video",
      youtubeUrlLabel: "YouTube link",
      youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... or youtu.be/...",
      youtubeUrlHint:
        "Supports youtube.com/watch, youtu.be, and Shorts links. Plays privately via youtube-nocookie.com.",
      youtubeInvalidError:
        "Please paste a valid YouTube link (youtube.com/watch?v=..., youtu.be/..., or Shorts).",
      youtubePreviewLabel: "Embedded video preview",
      postTitlePlaceholderVideo: "e.g., Sunday devotional talk or piano recital",
      reflectionLabel: "Reflection or note",
      reflectionPlaceholder:
        "Why did you want to share this with the family?",
      filterAll: "All posts",
      postTypes: {
        memory: "Memory",
        photo: "Photo",
        youtube: "YouTube",
        milestone: "Milestone",
        event: "Event",
      },
      heartAction: "Love",
      celebrateAction: "Celebrate",
      commentsLabel: "Comments",
      addCommentPlaceholder: "Write a family comment...",
      postComment: "Post",
      noCommentsYet: "No comments yet. Be the first to reply!",
      commentAddedToast: "Comment posted.",
      postCreatedToast: "Shared to Family Pulse!",
      postUpdatedToast: "Post updated.",
      postDeletedToast: "Post removed.",
      confirmDeletePost: "Delete this post from Family Pulse?",
      emptyTitle: "Your private Family Pulse awaits",
      emptySubtitle:
        "Share a family photo, an uplifting YouTube clip, or celebrate a personal habit milestone together.",
      sharedMilestonePrefix: "Personal milestone celebrated",
      watchOnYoutube: "Open on YouTube",
    },
    mySpace: {
      title: "My Space",
      subtitle:
        "Your private personal ledger, daily routines, and goals — strictly protected by Row Level Security.",
      privacyBanner:
        "Only you can view or edit anything in My Space. Other family members and admins cannot see your private balances, expenses, or notes.",
      budgetTab: "Bucket Budget",
      habitsTab: "Habits & Tasks",
      budget: {
        heading: "Pay-Yourself-First Bucket Budget",
        subheading:
          "Every income entry automatically splits across Tithing, Investment, Savings, and Free to Spend.",
        recordIncome: "Record income",
        recordDisbursement: "Record expense / transfer",
        configureSplits: "Allocation %",
        splitsModalTitle: "Bucket Allocation Percentages",
        splitsModalSubtitle:
          "Tithing, Investment, and Savings each require at least 10%. Free to Spend receives the remainder.",
        minTenPercentRule:
          "Tithing, Investment, and Savings must each be at least 10%.",
        totalExceedsHundredError:
          "Combined Tithing, Investment, and Savings cannot exceed 100%.",
        splitsSavedToast: "Bucket allocation percentages saved!",
        buckets: {
          tithing: "Tithing",
          investment: "Investment",
          savings: "Savings",
          free_to_spend: "Free to Spend",
        },
        bucketDescriptions: {
          tithing: "Set aside first (min 10%)",
          investment: "Long-term growth (min 10%)",
          savings: "Emergency & goals (min 10%)",
          free_to_spend: "Remaining disposable balance",
        },
        freeToSpendSummaryTitle: "Free to Spend vs. Recurring Bills",
        currentFreeToSpend: "Current Free to Spend",
        upcomingRecurringTotal: "Upcoming unpaid recurring",
        netAfterRecurring: "Net remaining after bills",
        incomeModalTitle: "Record Personal Income",
        incomeSourceLabel: "Income source",
        incomeSourcePlaceholder: "e.g., Paycheck, Allowance, Freelance",
        incomeAmountLabel: "Amount received",
        splitPreviewTitle: "Automatic bucket split preview",
        incomeSavedToast: "Income recorded and split across your buckets!",
        incomeDeletedToast: "Income entry deleted.",
        disbursementModalTitle: "Record Disbursement or Expense",
        disbursementBucketLabel: "Deduct from bucket",
        disbursementTitleLabel: "Description",
        disbursementTitlePlaceholder: "e.g., Monthly tithing, ETF deposit, Coffee",
        disbursementSavedToast: "Transaction deducted from bucket.",
        disbursementDeletedToast: "Transaction deleted.",
        quickPayTithing: "Pay Tithing",
        quickInvest: "Invest Transfer",
        quickSpend: "Log Expense",
        recurringTitle: "Recurring Expenses & Subscriptions",
        recurringSubtitle:
          "Track bills and subscriptions against Free to Spend and see your true net remaining balance.",
        addRecurring: "Add recurring bill",
        editRecurring: "Edit recurring bill",
        recurringNameLabel: "Bill or subscription",
        recurringNamePlaceholder: "e.g., Phone plan, Music subscription, Gym",
        frequencyLabel: "Billing frequency",
        billingDayLabel: "Billing day of month",
        autoApplyLabel: "Auto-apply each month",
        autoApplyHint:
          "Automatically apply this bill against Free to Spend once the billing day arrives.",
        applyDueAutoBills: "Apply due auto-bills",
        appliedAutoBillsToast: "Applied due recurring expenses to Free to Spend.",
        markPaid: "Mark paid",
        paidThisMonth: "Paid this month",
        dueDayPrefix: "Day",
        recurringSavedToast: "Recurring expense saved.",
        recurringDeletedToast: "Recurring expense removed.",
        recurringPaidToast: "Marked paid and deducted from Free to Spend.",
        noRecurringYet:
          "No recurring bills added yet. Log subscriptions or monthly bills to track your true remaining spending power.",
        recentActivityTitle: "Personal Ledger History",
        incomeHistoryTab: "Income splits",
        disbursementsTab: "Disbursements & expenses",
        noIncomeYet:
          "Record your first income entry to automatically fund your four buckets.",
        noDisbursementsYet:
          "No bucket payments or everyday expenses recorded yet.",
        confirmDeleteIncome: "Delete this income entry and reverse its bucket splits?",
        confirmDeleteTx: "Delete this bucket transaction?",
        confirmDeleteRecurring: "Delete this recurring expense?",
        frequencies: {
          weekly: "Weekly",
          biweekly: "Bi-weekly",
          monthly: "Monthly",
          yearly: "Yearly",
        },
      },
      habits: {
        heading: "Personal Habits, Tasks & Reminders",
        subheading:
          "Build daily spiritual and personal routines, check in for streaks, and optionally celebrate milestones with your family.",
        newItem: "Add habit or task",
        editItem: "Edit item",
        filterAll: "All",
        filterHabits: "Habits",
        filterTasks: "One-off tasks",
        kindLabel: "Type",
        kindHabit: "Recurring habit",
        kindTask: "One-off task",
        titleLabel: "Title",
        titlePlaceholderHabit: "e.g., Scripture reading, Prayer, Piano practice",
        titlePlaceholderTask: "e.g., Finish math chapter, Organize desk",
        cadenceLabel: "Frequency",
        categoryLabel: "Category",
        reminderTimeLabel: "Reminder time",
        dueDateLabel: "Due date",
        privateNotesLabel: "Private notes",
        privateNotesPlaceholder:
          "Personal reflections or journal notes (never shared with family)...",
        privateNotesHint: "Strictly private — never included in shared milestones.",
        allowShareLabel: "Allow sharing milestones with family",
        allowShareHint:
          "Enables a button to celebrate your streak or completed goal on Family Pulse without sharing private notes.",
        checkInToday: "Check in",
        checkedInToday: "Done today",
        markDone: "Mark complete",
        completedLabel: "Completed",
        streakLabel: "Streak",
        bestStreakLabel: "Best",
        daysUnit: "days",
        weeksUnit: "weeks",
        shareMilestoneButton: "Share milestone with family",
        sharingMilestone: "Sharing...",
        milestoneSharedToast: "Milestone celebrated on Family Pulse!",
        needFamilyToShareError:
          "Join or create a family first to share a milestone.",
        habitSavedToast: "Saved to My Space!",
        habitUpdatedToast: "Updated.",
        habitDeletedToast: "Removed from My Space.",
        confirmDeleteHabit: "Delete this personal habit or task?",
        emptyTitle: "Create your first habit or personal task",
        emptySubtitle:
          "Track scripture reading, prayer, piano practice, study goals, or daily reminders privately.",
        todayProgress: "Today's habit check-ins",
        cadences: {
          daily: "Daily",
          weekly: "Weekly",
          once: "One-time",
        },
        categories: {
          spiritual: "Spiritual",
          study: "Study",
          music: "Music",
          health: "Health",
          personal: "Personal",
          other: "Other",
        },
      },
    },
    budget: {
      title: "Shared Family Budget",
      subtitle:
        "Monitor shared household income, expenses, net balance, and category spending.",
      newEntry: "Add entry",
      editEntry: "Edit entry",
      allMonths: "All months",
      totalIncome: "Total Income",
      totalExpenses: "Total Expenses",
      netBalance: "Net Balance",
      savingsRate: "Savings rate",
      income: "Income",
      expense: "Expense",
      typeLabel: "Entry type",
      categoryLabel: "Category",
      customCategoryPlaceholder: "Enter custom category",
      amountLabel: "Amount",
      dateLabel: "Date",
      descriptionLabel: "Description",
      descriptionPlaceholder: "e.g., Weekly organic groceries",
      breakdownTitle: "Category Breakdown",
      expenseBreakdown: "Expenses by category",
      incomeBreakdown: "Income by category",
      transactionsTitle: "Transactions",
      noEntriesTitle: "No budget entries for this period",
      noEntriesSubtitle:
        "Record your first income or expense entry to see balances and category insights.",
      entryCreatedToast: "Budget entry added.",
      entryUpdatedToast: "Budget entry updated.",
      entryDeletedToast: "Budget entry deleted.",
      invalidAmountError: "Please enter a valid positive amount.",
      confirmDeleteEntry: "Delete this budget entry?",
      allTypes: "All types",
      allCategories: "All categories",
      entriesCount: "entries",
      categories: {
        housing: "Housing",
        groceries: "Groceries",
        utilities: "Utilities",
        transportation: "Transportation",
        healthcare: "Healthcare",
        education: "Education",
        dining: "Dining Out",
        entertainment: "Entertainment",
        savings: "Savings",
        salary: "Salary",
        freelance: "Freelance",
        investments: "Investments",
        gifts: "Gifts",
        refunds: "Refunds",
        other: "Other",
      },
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      network: "Network error. Check your connection and try again.",
      unauthorized: "Please sign in to continue.",
      noFamily: "Create or select a family first.",
    },
  },
  es: {
    appName: "Administrador Familiar",
    tagline: "Un lugar tranquilo para tu hogar.",
    common: {
      loading: "Cargando...",
      save: "Guardar cambios",
      saving: "Guardando...",
      cancel: "Cancelar",
      delete: "Eliminar",
      deleting: "Eliminando...",
      edit: "Editar",
      create: "Crear",
      creating: "Creando...",
      close: "Cerrar",
      confirm: "Confirmar",
      search: "Buscar",
      filter: "Filtrar",
      all: "Todos",
      today: "Hoy",
      viewAll: "Ver todo",
      signOut: "Cerrar sesión",
      signIn: "Iniciar sesión",
      continueWithGoogle: "Continuar con Google",
      backToHome: "Volver al inicio",
      copyLink: "Copiar enlace",
      copied: "Copiado",
      noResults: "No se encontraron resultados.",
      optional: "Opcional",
      required: "Requerido",
      unknownMember: "Miembro de la familia",
      everyone: "Toda la familia",
      languageLabel: "Idioma",
      english: "English",
      spanish: "Español",
      admin: "Admin",
      member: "Miembro",
      you: "Tú",
      privateBadge: "Solo para ti",
      sharedBadge: "Compartido en familia",
    },
    nav: {
      familyHubSection: "Centro Familiar",
      mySpaceSection: "Privado",
      overview: "Inicio",
      family: "Familia",
      calendar: "Calendario",
      memories: "Muro Familiar",
      familyFeed: "Muro",
      mySpace: "Mi Espacio",
      budget: "Presupuesto Familiar",
      familyBudget: "Presupuesto Familiar",
      switchFamily: "Cambiar de familia",
      newFamily: "Crear nueva familia",
      noFamilySelected: "Sin familia aún",
    },
    landing: {
      heroTitle: "Aporta claridad y calidez a la vida diaria en familia.",
      heroSubtitle:
        "Coordina horarios compartidos, disfruta un muro familiar privado y dale a cada integrante su propio Mi Espacio privado para presupuestos por cubetas y hábitos diarios.",
      ctaPrimary: "Continuar con Google",
      ctaSecondary: "Entrar a tu hogar",
      trustNote:
        "Protegido con Row Level Security en Supabase. Los datos familiares quedan dentro del hogar y Mi Espacio es estrictamente privado para cada persona.",
      pillarsHeading: "Todo lo que tu hogar necesita, sin complicaciones",
      pillarsSubheading:
        "Diseñado para que madres, padres, parejas e hijos se mantengan conectados mientras conservan privadas sus finanzas y notas personales.",
      pillars: {
        familyTitle: "Centro Familiar y Controles Admin",
        familyDesc:
          "Crea grupos familiares, personaliza tu portada, gestiona roles, invita por correo y decide qué módulos aparecen en el inicio familiar.",
        calendarTitle: "Calendario Familiar Compartido",
        calendarDesc:
          "Alterna fácilmente entre vista mensual y agenda con categorías por color y asignaciones claras por integrante.",
        memoriesTitle: "Pulso Familiar (Muro Privado)",
        memoriesDesc:
          "Una red social privada solo para tu familia con fotos, eventos, logros de hábitos, videos de YouTube integrados, reacciones y comentarios.",
        budgetTitle: "Mi Espacio Privado",
        budgetDesc:
          "Cada miembro tiene su propio presupuesto de págate primero (Diezmo, Inversión, Ahorro y Libre para Gastar) y seguimiento de hábitos y tareas.",
      },
      previewCard: {
        spotlightLabel: "Portada Familiar",
        familyName: "Mi familia",
        upcomingTitle: "Próximo en el calendario",
        upcomingEvent: "Mercado del sábado · 9:30 AM",
        budgetTitle: "Pulso Familiar",
        budgetValue: "3 publicaciones nuevas",
        memoryTitle: "Logro compartido",
        memoryNote: "¡Racha de 14 días leyendo escrituras!",
      },
      footerCopy:
        "Administrador Familiar — Organización privada del hogar, bilingüe en inglés y español.",
    },
    auth: {
      loginTitle: "Bienvenido a casa",
      loginSubtitle:
        "Inicia sesión con tu cuenta de Google para acceder a tu Centro Familiar y a tu Mi Espacio privado.",
      inviteNotice:
        "Inicia sesión para aceptar tu invitación familiar y unirte al hogar.",
      googleButton: "Continuar con Google",
      redirecting: "Redirigiendo a Google...",
      privacyNote:
        "Los datos de tu familia permanecen privados en el hogar y Mi Espacio es visible solo para ti.",
      errorCallback:
        "No pudimos completar el inicio de sesión. Inténtalo nuevamente.",
      errorOAuth:
        "No se pudo iniciar la autenticación con Google. Revisa la configuración de Supabase.",
      setupMissingTitle: "Configuración de Supabase requerida",
      setupMissingBody:
        "Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY a tu archivo .env.local y habilita Google OAuth en Supabase para iniciar sesión.",
    },
    invite: {
      pageTitle: "Invitación Familiar",
      invitedBy: "Invitado por",
      roleAssigned: "Rol",
      invitedEmailLabel: "Enviada a",
      acceptButton: "Aceptar y unirme a la familia",
      accepting: "Uniéndote a la familia...",
      signInToAccept: "Continuar con Google para aceptar",
      acceptedSuccess: "¡Bienvenido a la familia!",
      alreadyAcceptedTitle: "Invitación ya aceptada",
      alreadyAcceptedDesc:
        "Este enlace de invitación ya fue utilizado. Si ya eres miembro, puedes ir directamente a tu panel.",
      expiredTitle: "Invitación expirada",
      expiredDesc:
        "Esta invitación ya no está activa. Pide a un administrador familiar que te envíe una nueva.",
      notFoundTitle: "Invitación no encontrada",
      notFoundDesc:
        "No encontramos una invitación con este enlace. Verifica la URL o solicita una nueva invitación.",
      goToDashboard: "Ir al panel",
      errorAccepting: "No se pudo aceptar la invitación. Intenta de nuevo.",
    },
    overview: {
      welcomeBack: "Hola de nuevo",
      membersCount: "miembros",
      memberSingular: "miembro",
      noFamilyTitle: "Crea tu espacio familiar",
      noFamilySubtitle:
        "Comienza poniéndole un nombre a tu hogar. Después podrás subir una portada destacada e invitar a tus familiares.",
      createFirstFamily: "Crear familia",
      familyNamePlaceholder: "ej., Mi familia",
      quickActions: "Acciones rápidas",
      addEvent: "Nuevo evento",
      logMemory: "Publicar en Muro",
      openMySpace: "Abrir Mi Espacio",
      addTransaction: "Presupuesto familiar",
      manageFamily: "Gestionar familia",
      upcomingEvents: "Próximos eventos",
      noUpcomingEvents: "Aún no hay eventos próximos programados.",
      monthlyBudget: "Presupuesto familiar del mes",
      totalIncome: "Ingresos",
      totalExpenses: "Gastos",
      netBalance: "Balance neto",
      recentMemories: "Pulso Familiar",
      familyPulseHeading: "Lo último en Pulso Familiar",
      noRecentMemories:
        "Aún no hay publicaciones. ¡Comparte una foto, nota o video de YouTube!",
      mySpaceCalloutTitle: "Tu Mi Espacio Privado",
      mySpaceCalloutDesc:
        "Lleva tus cubetas de págate primero, gastos recurrentes, hábitos espirituales y personales con recordatorios — visible solo para ti.",
      mySpaceCalloutButton: "Ir a Mi Espacio",
    },
    family: {
      title: "Gestión Familiar",
      subtitle:
        "Personaliza la portada de tu hogar, administra los integrantes, envía invitaciones y configura los módulos del Centro Familiar.",
      createNewTitle: "Crear un nuevo grupo familiar",
      createNewSubtitle:
        "Organiza otro hogar, familia extendida o grupo de viaje por separado.",
      familyNameLabel: "Nombre de la familia",
      familyNamePlaceholder: "ej., Mi familia",
      createFamilyButton: "Crear grupo familiar",
      familyCreatedToast: "¡Grupo familiar creado!",
      spotlightSectionTitle: "Portada Destacada y Detalles",
      spotlightSectionSubtitle:
        "Personaliza la imagen principal de tu familia en todo el panel.",
      uploadBanner: "Subir imagen de portada",
      uploadingBanner: "Subiendo portada...",
      changeBanner: "Cambiar portada",
      bannerHint:
        "JPG, PNG o WebP hasta 5 MB. Guardado de forma segura en Supabase Storage.",
      bannerUpdatedToast: "¡Portada destacada actualizada!",
      renameSuccessToast: "¡Nombre de la familia actualizado!",
      saveNameButton: "Actualizar nombre",
      membersTitle: "Miembros de la Familia",
      membersSubtitle: "Personas que actualmente tienen acceso a este hogar.",
      joinedOn: "Se unió el",
      makeAdmin: "Hacer admin",
      makeMember: "Cambiar a miembro",
      removeMember: "Quitar",
      leaveFamily: "Salir de la familia",
      memberRemovedToast: "Miembro eliminado de la familia.",
      roleUpdatedToast: "Rol del miembro actualizado.",
      inviteTitle: "Invitar por Correo Electrónico",
      inviteSubtitle:
        "Envía un correo de invitación directo con Supabase y un enlace seguro para unirse en un clic.",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "familiar@ejemplo.com",
      roleLabel: "Rol",
      sendInviteButton: "Enviar invitación",
      sendingInvite: "Enviando invitación...",
      inviteSentToast: "¡Correo de invitación enviado directamente!",
      inviteCreatedNoEmailToast:
        "¡Invitación creada! Copia el enlace de invitación abajo para compartirlo al instante.",
      invitationsHistoryTitle: "Invitaciones Enviadas",
      noInvitations: "Todavía no se han enviado invitaciones.",
      statusPending: "Pendiente",
      statusAccepted: "Aceptada",
      statusExpired: "Expirada",
      revokeInvite: "Expirar",
      inviteRevokedToast: "Invitación marcada como expirada.",
      deleteFamilyError: "No se pudo completar esta acción.",
      invalidImageError: "Elige una imagen JPG, PNG, GIF o WebP.",
      imageTooLargeError: "La imagen debe pesar 5 MB o menos.",
      confirmRemoveMember: "¿Quitar a este miembro de la familia?",
      confirmLeaveFamily: "¿Seguro que quieres salir de esta familia?",
      modules: {
        title: "Visibilidad de Módulos",
        subtitle:
          "Elige qué módulos compartidos aparecen en la pantalla principal del Centro Familiar para todos los integrantes.",
        adminOnlyBadge: "Solo administradores",
        showCalendarTitle: "Bloque de Calendario Compartido",
        showCalendarDesc:
          "Muestra los próximos eventos familiares en el resumen del Centro Familiar.",
        showFeedTitle: "Destacados de Pulso Familiar",
        showFeedDesc:
          "Muestra las últimas fotos, logros y videos de YouTube compartidos en el inicio familiar.",
        showBudgetTitle: "Módulo de Presupuesto Familiar",
        showBudgetDesc:
          "Oculto por defecto. Actívalo para mostrar un resumen de presupuesto compartido en el Centro Familiar y la navegación.",
        showQuickActionsTitle: "Barra de acciones rápidas",
        showQuickActionsDesc:
          "Muestra accesos directos justo debajo de la portada destacada del hogar.",
        savedToast: "Visibilidad de módulos actualizada.",
      },
    },
    calendar: {
      title: "Calendario Familiar Compartido",
      subtitle:
        "Coordina citas, horarios escolares, tareas del hogar y celebraciones juntos.",
      monthView: "Mes",
      agendaView: "Agenda",
      newEvent: "Nuevo evento",
      editEvent: "Editar evento",
      eventTitleLabel: "Título del evento",
      eventTitlePlaceholder: "ej., Consulta pediátrica",
      descriptionLabel: "Detalles",
      descriptionPlaceholder: "Ubicación, notas o qué llevar...",
      startTimeLabel: "Inicio",
      endTimeLabel: "Fin",
      categoryLabel: "Categoría",
      assignedToLabel: "Asignado a",
      shareToFeedLabel: "También compartir en Pulso Familiar",
      shareToFeedHint:
        "Publica este evento en el muro familiar privado para que todos puedan reaccionar y comentar.",
      allCategories: "Todas las categorías",
      allMembers: "Todos los miembros",
      noEventsThisMonth: "No hay eventos programados en esta vista.",
      noEventsSelectedDay: "No hay planes para este día.",
      eventsForDay: "Agenda del",
      addForDay: "Agregar evento",
      eventCreatedToast: "Evento agregado al calendario.",
      eventUpdatedToast: "Evento actualizado.",
      eventDeletedToast: "Evento eliminado.",
      endBeforeStartError: "La hora de fin debe ser posterior a la de inicio.",
      confirmDeleteEvent: "¿Eliminar este evento del calendario?",
      weekdaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
      categories: {
        family: "Familia",
        school: "Escuela",
        health: "Salud",
        chores: "Tareas",
        celebration: "Celebración",
        travel: "Viajes",
        other: "Otro",
      },
    },
    memories: {
      title: "Pulso Familiar",
      subtitle:
        "Tu muro privado familiar para fotos, videos compartidos, logros y momentos cotidianos.",
      newMemory: "Nueva publicación",
      editMemory: "Editar publicación",
      searchPlaceholder: "Buscar publicaciones, reflexiones o etiquetas...",
      allTags: "Todas las etiquetas",
      sortNewest: "Más recientes",
      sortOldest: "Más antiguos",
      titleLabel: "Título",
      titlePlaceholder: "ej., Paseo dominical al jardín botánico",
      dateLabel: "Fecha",
      notesLabel: "Historia y reflexión",
      notesPlaceholder: "Comparte una reflexión, recuerdo o noticia familiar...",
      tagsLabel: "Etiquetas",
      tagsPlaceholder: "fin de semana, aire libre, logro",
      tagsHint: "Separa varias etiquetas con comas.",
      photoLabel: "Foto",
      uploadPhoto: "Subir foto",
      uploadingPhoto: "Subiendo foto...",
      removePhoto: "Quitar foto",
      emptyTitle: "Bienvenido a Pulso Familiar",
      emptySubtitle:
        "Comparte tu primera foto familiar, un video edificante de YouTube o un logro juntos.",
      memoryCreatedToast: "¡Publicado en Pulso Familiar!",
      memoryUpdatedToast: "Publicación actualizada.",
      memoryDeletedToast: "Publicación eliminada.",
      confirmDeleteMemory: "¿Eliminar esta publicación familiar?",
      loggedBy: "Compartido por",
    },
    feed: {
      title: "Pulso Familiar",
      subtitle:
        "Un muro privado del hogar para fotos familiares, eventos compartidos, logros y videos de YouTube integrados.",
      newPostButton: "Nueva publicación",
      shareVideoButton: "Compartir YouTube",
      composerMemoryTab: "Foto y Nota",
      composerVideoTab: "Video de YouTube",
      youtubeUrlLabel: "Enlace de YouTube",
      youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... o youtu.be/...",
      youtubeUrlHint:
        "Compatible con youtube.com/watch, youtu.be y Shorts. Se reproduce de forma privada con youtube-nocookie.com.",
      youtubeInvalidError:
        "Pega un enlace válido de YouTube (youtube.com/watch?v=..., youtu.be/... o Shorts).",
      youtubePreviewLabel: "Vista previa del video",
      postTitlePlaceholderVideo: "ej., Charla devocional del domingo o recital de piano",
      reflectionLabel: "Reflexión o nota",
      reflectionPlaceholder:
        "¿Por qué quisiste compartir esto con la familia?",
      filterAll: "Todo",
      postTypes: {
        memory: "Recuerdo",
        photo: "Foto",
        youtube: "YouTube",
        milestone: "Logro",
        event: "Evento",
      },
      heartAction: "Me encanta",
      celebrateAction: "Celebrar",
      commentsLabel: "Comentarios",
      addCommentPlaceholder: "Escribe un comentario familiar...",
      postComment: "Enviar",
      noCommentsYet: "Aún no hay comentarios. ¡Sé el primero en responder!",
      commentAddedToast: "Comentario publicado.",
      postCreatedToast: "¡Compartido en Pulso Familiar!",
      postUpdatedToast: "Publicación actualizada.",
      postDeletedToast: "Publicación eliminada.",
      confirmDeletePost: "¿Eliminar esta publicación de Pulso Familiar?",
      emptyTitle: "Tu Pulso Familiar privado te espera",
      emptySubtitle:
        "Comparte una foto familiar, un video inspirador de YouTube o celebra un logro personal de hábitos en familia.",
      sharedMilestonePrefix: "Logro personal celebrado",
      watchOnYoutube: "Abrir en YouTube",
    },
    mySpace: {
      title: "Mi Espacio",
      subtitle:
        "Tu presupuesto personal, rutinas diarias y metas — estrictamente protegido con Row Level Security.",
      privacyBanner:
        "Solo tú puedes ver o editar lo que guardas en Mi Espacio. Otros familiares y administradores no tienen acceso a tus saldos, gastos ni notas privadas.",
      budgetTab: "Presupuesto por Cubetas",
      habitsTab: "Hábitos y Tareas",
      budget: {
        heading: "Presupuesto Págate Primero (Cubetas)",
        subheading:
          "Cada ingreso se divide automáticamente entre Diezmo, Inversión, Ahorro y Libre para Gastar.",
        recordIncome: "Registrar ingreso",
        recordDisbursement: "Registrar gasto / pago",
        configureSplits: "Porcentajes %",
        splitsModalTitle: "Porcentajes de Distribución",
        splitsModalSubtitle:
          "Diezmo, Inversión y Ahorro requieren un mínimo de 10% cada uno. Libre para Gastar recibe el resto.",
        minTenPercentRule:
          "Diezmo, Inversión y Ahorro deben ser al menos 10% cada uno.",
        totalExceedsHundredError:
          "La suma de Diezmo, Inversión y Ahorro no puede superar 100%.",
        splitsSavedToast: "¡Porcentajes de distribución guardados!",
        buckets: {
          tithing: "Diezmo",
          investment: "Inversión",
          savings: "Ahorro",
          free_to_spend: "Libre para Gastar",
        },
        bucketDescriptions: {
          tithing: "Apartado primero (mín. 10%)",
          investment: "Crecimiento a largo plazo (mín. 10%)",
          savings: "Emergencias y metas (mín. 10%)",
          free_to_spend: "Saldo disponible restante",
        },
        freeToSpendSummaryTitle: "Libre para Gastar vs. Gastos Recurrentes",
        currentFreeToSpend: "Libre para Gastar actual",
        upcomingRecurringTotal: "Recurrentes pendientes del mes",
        netAfterRecurring: "Saldo neto tras recurrentes",
        incomeModalTitle: "Registrar Ingreso Personal",
        incomeSourceLabel: "Fuente del ingreso",
        incomeSourcePlaceholder: "ej., Sueldo, Mesada, Trabajo independiente",
        incomeAmountLabel: "Monto recibido",
        splitPreviewTitle: "Vista previa de división automática",
        incomeSavedToast: "¡Ingreso registrado y dividido en tus cubetas!",
        incomeDeletedToast: "Ingreso eliminado.",
        disbursementModalTitle: "Registrar Pago o Gasto",
        disbursementBucketLabel: "Descontar de la cubeta",
        disbursementTitleLabel: "Descripción",
        disbursementTitlePlaceholder: "ej., Pago de diezmo, Depósito ETF, Café",
        disbursementSavedToast: "Movimiento descontado de la cubeta.",
        disbursementDeletedToast: "Movimiento eliminado.",
        quickPayTithing: "Pagar Diezmo",
        quickInvest: "Transferir Inversión",
        quickSpend: "Registrar Gasto",
        recurringTitle: "Gastos Recurrentes y Suscripciones",
        recurringSubtitle:
          "Controla pagos fijos y suscripciones contra Libre para Gastar y consulta tu saldo neto real.",
        addRecurring: "Agregar gasto recurrente",
        editRecurring: "Editar gasto recurrente",
        recurringNameLabel: "Factura o suscripción",
        recurringNamePlaceholder: "ej., Plan celular, Música, Gimnasio",
        frequencyLabel: "Frecuencia",
        billingDayLabel: "Día de cobro del mes",
        autoApplyLabel: "Aplicar automáticamente cada mes",
        autoApplyHint:
          "Descuenta este gasto de Libre para Gastar automáticamente al llegar el día de cobro.",
        applyDueAutoBills: "Aplicar pagos automáticos vencidos",
        appliedAutoBillsToast:
          "Se aplicaron los gastos recurrentes automáticos a Libre para Gastar.",
        markPaid: "Marcar pagado",
        paidThisMonth: "Pagado este mes",
        dueDayPrefix: "Día",
        recurringSavedToast: "Gasto recurrente guardado.",
        recurringDeletedToast: "Gasto recurrente eliminado.",
        recurringPaidToast: "Marcado como pagado y descontado de Libre para Gastar.",
        noRecurringYet:
          "Aún no tienes gastos recurrentes. Registra suscripciones o pagos mensuales para ver tu saldo neto real.",
        recentActivityTitle: "Historial Personal",
        incomeHistoryTab: "Divisiones de ingresos",
        disbursementsTab: "Pagos y gastos",
        noIncomeYet:
          "Registra tu primer ingreso para llenar automáticamente tus cuatro cubetas.",
        noDisbursementsYet:
          "Todavía no has registrado pagos de cubetas ni gastos diarios.",
        confirmDeleteIncome:
          "¿Eliminar este ingreso y revertir su distribución en las cubetas?",
        confirmDeleteTx: "¿Eliminar este movimiento de la cubeta?",
        confirmDeleteRecurring: "¿Eliminar este gasto recurrente?",
        frequencies: {
          weekly: "Semanal",
          biweekly: "Quincenal",
          monthly: "Mensual",
          yearly: "Anual",
        },
      },
      habits: {
        heading: "Hábitos Personales, Tareas y Recordatorios",
        subheading:
          "Construye rutinas diarias espirituales y personales, registra rachas y comparte logros opcionalmente con tu familia.",
        newItem: "Agregar hábito o tarea",
        editItem: "Editar elemento",
        filterAll: "Todo",
        filterHabits: "Hábitos",
        filterTasks: "Tareas únicas",
        kindLabel: "Tipo",
        kindHabit: "Hábito recurrente",
        kindTask: "Tarea única",
        titleLabel: "Título",
        titlePlaceholderHabit: "ej., Lectura de escrituras, Oración, Práctica de piano",
        titlePlaceholderTask: "ej., Terminar capítulo de estudio, Ordenar escritorio",
        cadenceLabel: "Frecuencia",
        categoryLabel: "Categoría",
        reminderTimeLabel: "Hora de recordatorio",
        dueDateLabel: "Fecha límite",
        privateNotesLabel: "Notas privadas",
        privateNotesPlaceholder:
          "Reflexiones personales o apuntes (nunca se comparten con la familia)...",
        privateNotesHint: "Estrictamente privado — nunca se incluye al compartir logros.",
        allowShareLabel: "Permitir compartir logros con la familia",
        allowShareHint:
          "Habilita un botón para celebrar tu racha o meta cumplida en Pulso Familiar sin exponer notas privadas.",
        checkInToday: "Completar hoy",
        checkedInToday: "Hecho hoy",
        markDone: "Marcar completada",
        completedLabel: "Completada",
        streakLabel: "Racha",
        bestStreakLabel: "Mejor",
        daysUnit: "días",
        weeksUnit: "semanas",
        shareMilestoneButton: "Compartir logro con la familia",
        sharingMilestone: "Compartiendo...",
        milestoneSharedToast: "¡Logro celebrado en Pulso Familiar!",
        needFamilyToShareError:
          "Primero únete o crea una familia para compartir un logro.",
        habitSavedToast: "¡Guardado en Mi Espacio!",
        habitUpdatedToast: "Actualizado.",
        habitDeletedToast: "Eliminado de Mi Espacio.",
        confirmDeleteHabit: "¿Eliminar este hábito o tarea personal?",
        emptyTitle: "Crea tu primer hábito o tarea personal",
        emptySubtitle:
          "Lleva un registro privado de lectura de escrituras, oración, piano, estudio o recordatorios diarios.",
        todayProgress: "Hábitos completados hoy",
        cadences: {
          daily: "Diario",
          weekly: "Semanal",
          once: "Una vez",
        },
        categories: {
          spiritual: "Espiritual",
          study: "Estudio",
          music: "Música",
          health: "Salud",
          personal: "Personal",
          other: "Otro",
        },
      },
    },
    budget: {
      title: "Presupuesto Familiar Compartido",
      subtitle:
        "Controla ingresos, gastos mensuales compartidos, balance neto y desglose por categoría.",
      newEntry: "Agregar movimiento",
      editEntry: "Editar movimiento",
      allMonths: "Todos los meses",
      totalIncome: "Ingresos Totales",
      totalExpenses: "Gastos Totales",
      netBalance: "Balance Neto",
      savingsRate: "Tasa de ahorro",
      income: "Ingreso",
      expense: "Gasto",
      typeLabel: "Tipo de movimiento",
      categoryLabel: "Categoría",
      customCategoryPlaceholder: "Escribe una categoría personalizada",
      amountLabel: "Monto",
      dateLabel: "Fecha",
      descriptionLabel: "Descripción",
      descriptionPlaceholder: "ej., Compras semanales del supermercado",
      breakdownTitle: "Desglose por Categoría",
      expenseBreakdown: "Gastos por categoría",
      incomeBreakdown: "Ingresos por categoría",
      transactionsTitle: "Movimientos",
      noEntriesTitle: "No hay movimientos en este período",
      noEntriesSubtitle:
        "Registra tu primer ingreso o gasto para ver balances y estadísticas por categoría.",
      entryCreatedToast: "Movimiento agregado al presupuesto.",
      entryUpdatedToast: "Movimiento actualizado.",
      entryDeletedToast: "Movimiento eliminado.",
      invalidAmountError: "Ingresa un monto válido mayor a cero.",
      confirmDeleteEntry: "¿Eliminar este movimiento del presupuesto?",
      allTypes: "Todos los tipos",
      allCategories: "Todas las categorías",
      entriesCount: "movimientos",
      categories: {
        housing: "Vivienda",
        groceries: "Supermercado",
        utilities: "Servicios",
        transportation: "Transporte",
        healthcare: "Salud",
        education: "Educación",
        dining: "Restaurantes",
        entertainment: "Entretenimiento",
        savings: "Ahorro",
        salary: "Salario",
        freelance: "Independiente",
        investments: "Inversiones",
        gifts: "Regalos",
        refunds: "Reembolsos",
        other: "Otro",
      },
    },
    errors: {
      generic: "Algo salió mal. Inténtalo de nuevo.",
      network: "Error de red. Revisa tu conexión e inténtalo de nuevo.",
      unauthorized: "Inicia sesión para continuar.",
      noFamily: "Primero crea o selecciona una familia.",
    },
  },
};
