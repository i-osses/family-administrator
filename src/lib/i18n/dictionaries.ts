import type { CalendarCategory, Language } from "@/types/database";

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
  };
  nav: {
    overview: string;
    family: string;
    calendar: string;
    memories: string;
    budget: string;
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
    addTransaction: string;
    manageFamily: string;
    upcomingEvents: string;
    noUpcomingEvents: string;
    monthlyBudget: string;
    totalIncome: string;
    totalExpenses: string;
    netBalance: string;
    recentMemories: string;
    noRecentMemories: string;
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
    categories: Record<CalendarCategory, string>;
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
    },
    nav: {
      overview: "Overview",
      family: "Family",
      calendar: "Calendar",
      memories: "Memories",
      budget: "Budget",
      switchFamily: "Switch family",
      newFamily: "Create new family",
      noFamilySelected: "No family yet",
    },
    landing: {
      heroTitle: "Bring clarity and warmth to everyday family life.",
      heroSubtitle:
        "Coordinate shared schedules, capture family milestones, and stay aligned on household budgets — all in one private space built for every member of your home.",
      ctaPrimary: "Continue with Google",
      ctaSecondary: "Sign in to your household",
      trustNote:
        "Protected with Supabase Row Level Security. Only invited family members can see your household data.",
      pillarsHeading: "Everything your household needs, without the clutter",
      pillarsSubheading:
        "Designed for busy parents, partners, and relatives to stay effortlessly in sync across phone and desktop.",
      pillars: {
        familyTitle: "Family Hub & Invitations",
        familyDesc:
          "Create one or more family spaces, customize your household spotlight banner, manage roles, and invite relatives by email.",
        calendarTitle: "Shared Family Calendar",
        calendarDesc:
          "Switch seamlessly between monthly grid and agenda views with color-coded categories and clear member assignments.",
        memoriesTitle: "Activity & Memory Log",
        memoriesDesc:
          "Record milestones, weekend adventures, and daily notes with searchable tags and photo keepsakes.",
        budgetTitle: "Household Budgeting",
        budgetDesc:
          "Track monthly income and expenses, visualize category breakdowns, and monitor your net balance at a glance.",
      },
      previewCard: {
        spotlightLabel: "Household Spotlight",
        familyName: "The Rivera Household",
        upcomingTitle: "Next on the calendar",
        upcomingEvent: "Saturday Farmers Market · 9:30 AM",
        budgetTitle: "Monthly net balance",
        budgetValue: "+$1,840.00",
        memoryTitle: "Latest memory",
        memoryNote: "First homemade sourdough loaf together",
      },
      footerCopy:
        "Family Administrator — Private household coordination, bilingual in English and Spanish.",
    },
    auth: {
      loginTitle: "Welcome home",
      loginSubtitle:
        "Sign in with your Google account to access your family calendar, memories, and household budget.",
      inviteNotice:
        "Sign in to accept your family invitation and join the household.",
      googleButton: "Continue with Google",
      redirecting: "Redirecting to Google...",
      privacyNote:
        "Your data stays private to the families you create or join.",
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
      familyNamePlaceholder: "e.g., The Garcia Family",
      quickActions: "Quick actions",
      addEvent: "Add event",
      logMemory: "Log memory",
      addTransaction: "Add budget entry",
      manageFamily: "Manage family",
      upcomingEvents: "Upcoming events",
      noUpcomingEvents: "No upcoming events scheduled yet.",
      monthlyBudget: "This month's budget",
      totalIncome: "Income",
      totalExpenses: "Expenses",
      netBalance: "Net balance",
      recentMemories: "Recent memories",
      noRecentMemories: "No memories logged yet. Capture your first moment!",
    },
    family: {
      title: "Family Management",
      subtitle:
        "Customize your household spotlight banner, manage members, and send email invitations.",
      createNewTitle: "Create a new family group",
      createNewSubtitle:
        "Organize another household, extended family, or vacation group separately.",
      familyNameLabel: "Family name",
      familyNamePlaceholder: "e.g., The Morales Home",
      createFamilyButton: "Create family group",
      familyCreatedToast: "Family group created!",
      spotlightSectionTitle: "Household Spotlight & Details",
      spotlightSectionSubtitle:
        "Personalize your family banner displayed across your dashboard.",
      uploadBanner: "Upload spotlight banner",
      uploadingBanner: "Uploading banner...",
      changeBanner: "Change banner",
      bannerHint: "JPG, PNG, or WebP up to 5 MB. Stored securely in Supabase Storage.",
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
        "Send a personalized invitation email via Resend with a secure one-click join link.",
      emailLabel: "Email address",
      emailPlaceholder: "relative@example.com",
      roleLabel: "Role",
      sendInviteButton: "Send invitation",
      sendingInvite: "Sending invitation...",
      inviteSentToast: "Invitation email sent!",
      inviteCreatedNoEmailToast:
        "Invitation created! Configure RESEND_API_KEY to send emails automatically, or copy the invite link below.",
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
      title: "Activity & Memory Log",
      subtitle:
        "Preserve everyday moments, milestones, trips, and family notes.",
      newMemory: "Log memory",
      editMemory: "Edit memory",
      searchPlaceholder: "Search titles, notes, or tags...",
      allTags: "All tags",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
      titleLabel: "Title",
      titlePlaceholder: "e.g., Sunday botanical garden walk",
      dateLabel: "Activity date",
      notesLabel: "Story & notes",
      notesPlaceholder: "What happened? Who was there? Any funny quotes...",
      tagsLabel: "Tags",
      tagsPlaceholder: "weekend, outdoors, milestone",
      tagsHint: "Separate multiple tags with commas.",
      photoLabel: "Memory photo",
      uploadPhoto: "Upload photo",
      uploadingPhoto: "Uploading photo...",
      removePhoto: "Remove photo",
      emptyTitle: "Start your family memory journal",
      emptySubtitle:
        "Log outings, milestones, recipes, and small moments worth remembering.",
      memoryCreatedToast: "Memory saved!",
      memoryUpdatedToast: "Memory updated.",
      memoryDeletedToast: "Memory deleted.",
      confirmDeleteMemory: "Delete this memory?",
      loggedBy: "Logged by",
    },
    budget: {
      title: "Personal & Family Budget",
      subtitle:
        "Monitor monthly income, expenses, net balance, and category spending.",
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
    },
    nav: {
      overview: "Resumen",
      family: "Familia",
      calendar: "Calendario",
      memories: "Recuerdos",
      budget: "Presupuesto",
      switchFamily: "Cambiar de familia",
      newFamily: "Crear nueva familia",
      noFamilySelected: "Sin familia aún",
    },
    landing: {
      heroTitle: "Aporta claridad y calidez a la vida diaria en familia.",
      heroSubtitle:
        "Coordina calendarios compartidos, guarda recuerdos especiales y mantén alineado el presupuesto del hogar — todo en un espacio privado para cada integrante.",
      ctaPrimary: "Continuar con Google",
      ctaSecondary: "Entrar a tu hogar",
      trustNote:
        "Protegido con Row Level Security en Supabase. Solo los familiares invitados pueden ver los datos de tu hogar.",
      pillarsHeading: "Todo lo que tu hogar necesita, sin complicaciones",
      pillarsSubheading:
        "Diseñado para que madres, padres, parejas y familiares se mantengan sincronizados desde el móvil o la computadora.",
      pillars: {
        familyTitle: "Espacio Familiar e Invitaciones",
        familyDesc:
          "Crea uno o más grupos familiares, personaliza tu portada destacada, gestiona roles e invita a familiares por correo electrónico.",
        calendarTitle: "Calendario Familiar Compartido",
        calendarDesc:
          "Alterna fácilmente entre vista mensual y agenda con categorías por color y asignaciones claras por integrante.",
        memoriesTitle: "Diario de Actividades y Recuerdos",
        memoriesDesc:
          "Registra momentos importantes, salidas y notas cotidianas con etiquetas buscables y fotografías.",
        budgetTitle: "Presupuesto del Hogar",
        budgetDesc:
          "Registra ingresos y gastos por mes, visualiza el desglose por categoría y consulta tu balance neto al instante.",
      },
      previewCard: {
        spotlightLabel: "Portada Familiar",
        familyName: "Hogar Rivera",
        upcomingTitle: "Próximo en el calendario",
        upcomingEvent: "Mercado del sábado · 9:30 AM",
        budgetTitle: "Balance neto mensual",
        budgetValue: "+$1,840.00",
        memoryTitle: "Último recuerdo",
        memoryNote: "Nuestro primer pan casero de masa madre",
      },
      footerCopy:
        "Administrador Familiar — Organización privada del hogar, bilingüe en inglés y español.",
    },
    auth: {
      loginTitle: "Bienvenido a casa",
      loginSubtitle:
        "Inicia sesión con tu cuenta de Google para acceder al calendario familiar, recuerdos y presupuesto del hogar.",
      inviteNotice:
        "Inicia sesión para aceptar tu invitación familiar y unirte al hogar.",
      googleButton: "Continuar con Google",
      redirecting: "Redirigiendo a Google...",
      privacyNote:
        "Tus datos permanecen privados dentro de las familias que creas o a las que te unes.",
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
      familyNamePlaceholder: "ej., Familia García",
      quickActions: "Acciones rápidas",
      addEvent: "Nuevo evento",
      logMemory: "Registrar recuerdo",
      addTransaction: "Agregar movimiento",
      manageFamily: "Gestionar familia",
      upcomingEvents: "Próximos eventos",
      noUpcomingEvents: "Aún no hay eventos próximos programados.",
      monthlyBudget: "Presupuesto de este mes",
      totalIncome: "Ingresos",
      totalExpenses: "Gastos",
      netBalance: "Balance neto",
      recentMemories: "Recuerdos recientes",
      noRecentMemories:
        "Aún no hay recuerdos registrados. ¡Guarda tu primer momento!",
    },
    family: {
      title: "Gestión Familiar",
      subtitle:
        "Personaliza la portada de tu hogar, administra los integrantes y envía invitaciones por correo.",
      createNewTitle: "Crear un nuevo grupo familiar",
      createNewSubtitle:
        "Organiza otro hogar, familia extendida o grupo de viaje por separado.",
      familyNameLabel: "Nombre de la familia",
      familyNamePlaceholder: "ej., Hogar Morales",
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
        "Envía una invitación personalizada con Resend y un enlace seguro para unirse en un clic.",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "familiar@ejemplo.com",
      roleLabel: "Rol",
      sendInviteButton: "Enviar invitación",
      sendingInvite: "Enviando invitación...",
      inviteSentToast: "¡Correo de invitación enviado!",
      inviteCreatedNoEmailToast:
        "¡Invitación creada! Configura RESEND_API_KEY para enviar correos automáticamente o copia el enlace abajo.",
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
      title: "Registro de Actividades y Recuerdos",
      subtitle:
        "Conserva momentos cotidianos, logros, paseos y notas familiares.",
      newMemory: "Registrar recuerdo",
      editMemory: "Editar recuerdo",
      searchPlaceholder: "Buscar por título, notas o etiquetas...",
      allTags: "Todas las etiquetas",
      sortNewest: "Más recientes",
      sortOldest: "Más antiguos",
      titleLabel: "Título",
      titlePlaceholder: "ej., Paseo dominical al jardín botánico",
      dateLabel: "Fecha de la actividad",
      notesLabel: "Historia y notas",
      notesPlaceholder: "¿Qué pasó? ¿Quién estuvo? Frases divertidas...",
      tagsLabel: "Etiquetas",
      tagsPlaceholder: "fin de semana, aire libre, logro",
      tagsHint: "Separa varias etiquetas con comas.",
      photoLabel: "Foto del recuerdo",
      uploadPhoto: "Subir foto",
      uploadingPhoto: "Subiendo foto...",
      removePhoto: "Quitar foto",
      emptyTitle: "Comienza tu diario familiar de recuerdos",
      emptySubtitle:
        "Guarda salidas, logros, recetas y pequeños instantes dignos de recordar.",
      memoryCreatedToast: "¡Recuerdo guardado!",
      memoryUpdatedToast: "Recuerdo actualizado.",
      memoryDeletedToast: "Recuerdo eliminado.",
      confirmDeleteMemory: "¿Eliminar este recuerdo?",
      loggedBy: "Registrado por",
    },
    budget: {
      title: "Presupuesto Personal y Familiar",
      subtitle:
        "Controla ingresos, gastos mensuales, balance neto y desglose por categoría.",
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
