import type {
  CalendarRecurrenceRule,
  FamilyGoalCategory,
  Language,
  MemoryTemplateType,
} from "@/types/database";

export interface ExtendedDictionary {
  calendarExt: {
    manageCategories: string;
    newCategoryPlaceholder: string;
    addCategory: string;
    categoryAddedToast: string;
    categoryDeletedToast: string;
    confirmDeleteCategory: string;
    noCategoriesYet: string;
    visibilityLabel: string;
    visibilityFamily: string;
    visibilityPrivate: string;
    visibilityAll: string;
    repeatLabel: string;
    repeatDaysLabel: string;
    repeatEndDateLabel: string;
    repeatsBadge: Record<CalendarRecurrenceRule, string>;
    weekdayLetters: [string, string, string, string, string, string, string];
  };
  vault: {
    tabLabel: string;
    heading: string;
    subheading: string;
    newMemory: string;
    editMemory: string;
    searchPlaceholder: string;
    allCategories: string;
    manageCategories: string;
    newCategoryPlaceholder: string;
    templateLabel: string;
    templates: Record<MemoryTemplateType, string>;
    categoryAddedToast: string;
    categoryDeletedToast: string;
    confirmDeleteCategory: string;
    pendingTagsHeading: string;
    taggedYouIn: string;
    confirmCopyButton: string;
    confirmingCopy: string;
    dismissTag: string;
    tagConfirmedToast: string;
    tagDismissedToast: string;
    copiedBadge: string;
    titleLabelMedia: string;
    titlePlaceholderMedia: string;
    titleLabelLocation: string;
    titlePlaceholderLocation: string;
    titleLabelGeneral: string;
    titlePlaceholderGeneral: string;
    placeNameLabel: string;
    placeNamePlaceholder: string;
    useCurrentLocation: string;
    locating: string;
    locationCapturedToast: string;
    locationErrorToast: string;
    dateTimeLabel: string;
    ratingLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    tagMembersLabel: string;
    shareToFeedLabel: string;
    shareToFeedHint: string;
    linkGoalLabel: string;
    noGoalOption: string;
    sharedOnFeedBadge: string;
    shareNowButton: string;
    unsharedNote: string;
    commentsLabel: string;
    addCommentPlaceholder: string;
    noCommentsYet: string;
    commentAddedToast: string;
    memorySavedToast: string;
    memoryUpdatedToast: string;
    memoryDeletedToast: string;
    sharedToFeedToast: string;
    confirmDeleteMemory: string;
    emptyTitle: string;
    emptySubtitle: string;
    taggedMembersPrefix: string;
    pendingBadge: string;
    confirmedBadge: string;
    defaultCategories: {
      name: string;
      template_type: MemoryTemplateType;
      color: string;
    }[];
  };
  goals: {
    sectionTitle: string;
    sectionSubtitle: string;
    newGoal: string;
    editGoal: string;
    titleLabel: string;
    titlePlaceholder: string;
    categoryLabel: string;
    targetLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    linkedMemoriesLabel: string;
    markComplete: string;
    completedBadge: string;
    goalSavedToast: string;
    goalDeletedToast: string;
    confirmDeleteGoal: string;
    emptyText: string;
    categories: Record<FamilyGoalCategory, string>;
  };
}

export const extendedDictionaries: Record<Language, ExtendedDictionary> = {
  en: {
    calendarExt: {
      manageCategories: "Categories",
      newCategoryPlaceholder: "e.g., Ballet, Piano, Church",
      addCategory: "Add",
      categoryAddedToast: "Calendar category created.",
      categoryDeletedToast: "Calendar category deleted.",
      confirmDeleteCategory: "Delete this calendar category?",
      noCategoriesYet: "No categories yet. Add your first one above.",
      visibilityLabel: "Visibility",
      visibilityFamily: "Family Calendar",
      visibilityPrivate: "Private (My Space)",
      visibilityAll: "All",
      repeatLabel: "Repeat",
      repeatDaysLabel: "Repeat on",
      repeatEndDateLabel: "Ends on",
      repeatsBadge: {
        none: "Does not repeat",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
      },
      weekdayLetters: ["S", "M", "T", "W", "T", "F", "S"],
    },
    vault: {
      tabLabel: "Memory Vault",
      heading: "Personal Memory Vault",
      subheading:
        "Log movies, books, scriptures, workouts, hikes, and moments privately — share to Family Pulse or tag family anytime.",
      newMemory: "Log memory",
      editMemory: "Edit memory",
      searchPlaceholder:
        "Search movies, books, scriptures, exercises, places, or tagged people...",
      allCategories: "All",
      manageCategories: "Categories",
      newCategoryPlaceholder: "e.g., Recipes, Concerts, Study",
      templateLabel: "Input template",
      templates: {
        media: "Media / Study (Rating)",
        location: "Hike / Trip (GPS Place)",
        general: "Milestone / General",
      },
      categoryAddedToast: "Memory category added.",
      categoryDeletedToast: "Memory category deleted.",
      confirmDeleteCategory: "Delete this memory category?",
      pendingTagsHeading: "You were tagged in a family memory",
      taggedYouIn: "tagged you in",
      confirmCopyButton: "Confirm & save to my vault",
      confirmingCopy: "Saving...",
      dismissTag: "Dismiss",
      tagConfirmedToast: "Saved a permanent copy to your Memory Vault!",
      tagDismissedToast: "Tag dismissed.",
      copiedBadge: "Confirmed copy",
      titleLabelMedia: "Title / Reference",
      titlePlaceholderMedia: "e.g., Dune Part Two, Alma 32, 5K Run",
      titleLabelLocation: "Trip / Hike title",
      titlePlaceholderLocation: "e.g., Cascade Falls Trail",
      titleLabelGeneral: "Memory title",
      titlePlaceholderGeneral: "e.g., First piano recital",
      placeNameLabel: "Place / Location",
      placeNamePlaceholder: "e.g., Yosemite Valley, Local park",
      useCurrentLocation: "Use Current Location",
      locating: "Locating...",
      locationCapturedToast: "GPS pin added!",
      locationErrorToast: "Could not access GPS location.",
      dateTimeLabel: "Date & time",
      ratingLabel: "Rating",
      notesLabel: "Notes & reflection",
      notesPlaceholder: "Personal takeaway, favorite quote, or details...",
      tagMembersLabel: "Tag family members",
      shareToFeedLabel: "Share to Family Pulse",
      shareToFeedHint:
        "Publishes this memory to your shared private family feed.",
      linkGoalLabel: "Link to Family Goal",
      noGoalOption: "None",
      sharedOnFeedBadge: "On Family Pulse",
      shareNowButton: "Share to Family Pulse",
      unsharedNote: "Private in your vault",
      commentsLabel: "Comments",
      addCommentPlaceholder: "Add a comment or reflection...",
      noCommentsYet: "No comments yet.",
      commentAddedToast: "Comment added.",
      memorySavedToast: "Saved to your Memory Vault!",
      memoryUpdatedToast: "Memory updated.",
      memoryDeletedToast: "Memory deleted from your vault.",
      sharedToFeedToast: "Shared to Family Pulse!",
      confirmDeleteMemory:
        "Delete this memory from your vault? Confirmed copies owned by tagged family members will remain intact.",
      emptyTitle: "Your personal Memory Vault is ready",
      emptySubtitle:
        "Log movies, books, scriptures, workouts, hikes, or milestones in seconds and find them instantly anytime.",
      taggedMembersPrefix: "With",
      pendingBadge: "Pending",
      confirmedBadge: "Confirmed",
      defaultCategories: [
        { name: "Movies", template_type: "media", color: "#9E4F73" },
        { name: "Books", template_type: "media", color: "#3B6998" },
        { name: "Scriptures", template_type: "media", color: "#B8862D" },
        { name: "Exercise", template_type: "media", color: "#2C7A7B" },
        { name: "Hike / Trip", template_type: "location", color: "#2D5A47" },
        {
          name: "Family Milestone",
          template_type: "general",
          color: "#C86D51",
        },
      ],
    },
    goals: {
      sectionTitle: "Shared Family Goals",
      sectionSubtitle:
        "Set shared spiritual, learning, or adventure goals and link shared memories to track progress together.",
      newGoal: "New goal",
      editGoal: "Edit goal",
      titleLabel: "Goal title",
      titlePlaceholder: "e.g., Read Book of Mormon together, 10 Family Hikes",
      categoryLabel: "Focus",
      targetLabel: "Target memories",
      notesLabel: "Notes",
      notesPlaceholder: "Optional goal description...",
      linkedMemoriesLabel: "linked memories",
      markComplete: "Complete",
      completedBadge: "Completed",
      goalSavedToast: "Family goal saved!",
      goalDeletedToast: "Family goal deleted.",
      confirmDeleteGoal: "Delete this shared family goal?",
      emptyText:
        "No family goals yet. Set a shared spiritual, learning, or adventure goal together.",
      categories: {
        spiritual: "Spiritual",
        learning: "Learning",
        adventure: "Adventure",
        health: "Health",
        other: "Other",
      },
    },
  },
  es: {
    calendarExt: {
      manageCategories: "Categorías",
      newCategoryPlaceholder: "ej., Ballet, Piano, Iglesia",
      addCategory: "Agregar",
      categoryAddedToast: "Categoría de calendario creada.",
      categoryDeletedToast: "Categoría de calendario eliminada.",
      confirmDeleteCategory: "¿Eliminar esta categoría del calendario?",
      noCategoriesYet: "Aún no hay categorías. Agrega la primera arriba.",
      visibilityLabel: "Visibilidad",
      visibilityFamily: "Calendario Familiar",
      visibilityPrivate: "Privado (Mi Espacio)",
      visibilityAll: "Todos",
      repeatLabel: "Repetir",
      repeatDaysLabel: "Repetir los días",
      repeatEndDateLabel: "Termina el",
      repeatsBadge: {
        none: "No se repite",
        daily: "Diario",
        weekly: "Semanal",
        monthly: "Mensual",
      },
      weekdayLetters: ["D", "L", "M", "X", "J", "V", "S"],
    },
    vault: {
      tabLabel: "Bóveda de Recuerdos",
      heading: "Bóveda Personal de Recuerdos",
      subheading:
        "Registra películas, libros, escrituras, ejercicio, caminatas y momentos en privado — comparte en Pulso Familiar o etiqueta familiares cuando quieras.",
      newMemory: "Registrar recuerdo",
      editMemory: "Editar recuerdo",
      searchPlaceholder:
        "Buscar películas, libros, escrituras, ejercicio, lugares o personas...",
      allCategories: "Todo",
      manageCategories: "Categorías",
      newCategoryPlaceholder: "ej., Recetas, Conciertos, Estudio",
      templateLabel: "Plantilla",
      templates: {
        media: "Medios / Estudio (Calificación)",
        location: "Caminata / Viaje (Lugar GPS)",
        general: "Logro / General",
      },
      categoryAddedToast: "Categoría de recuerdos agregada.",
      categoryDeletedToast: "Categoría eliminada.",
      confirmDeleteCategory: "¿Eliminar esta categoría de recuerdos?",
      pendingTagsHeading: "Te etiquetaron en un recuerdo familiar",
      taggedYouIn: "te etiquetó en",
      confirmCopyButton: "Confirmar y guardar en mi bóveda",
      confirmingCopy: "Guardando...",
      dismissTag: "Descartar",
      tagConfirmedToast: "¡Copia permanente guardada en tu Bóveda!",
      tagDismissedToast: "Etiqueta descartada.",
      copiedBadge: "Copia confirmada",
      titleLabelMedia: "Título / Referencia",
      titlePlaceholderMedia: "ej., Dune Parte 2, Alma 32, Carrera 5K",
      titleLabelLocation: "Título del viaje / caminata",
      titlePlaceholderLocation: "ej., Sendero Cascada",
      titleLabelGeneral: "Título del recuerdo",
      titlePlaceholderGeneral: "ej., Primer recital de piano",
      placeNameLabel: "Lugar / Ubicación",
      placeNamePlaceholder: "ej., Parque Nacional, Playa Norte",
      useCurrentLocation: "Usar ubicación actual",
      locating: "Ubicando...",
      locationCapturedToast: "¡Ubicación GPS guardada!",
      locationErrorToast: "No se pudo obtener la ubicación GPS.",
      dateTimeLabel: "Fecha y hora",
      ratingLabel: "Calificación",
      notesLabel: "Notas y reflexión",
      notesPlaceholder: "Aprendizaje personal, cita favorita o detalles...",
      tagMembersLabel: "Etiquetar familiares",
      shareToFeedLabel: "Compartir en Pulso Familiar",
      shareToFeedHint:
        "Publica este recuerdo en el muro familiar privado compartido.",
      linkGoalLabel: "Vincular a Meta Familiar",
      noGoalOption: "Ninguna",
      sharedOnFeedBadge: "En Pulso Familiar",
      shareNowButton: "Compartir en Pulso Familiar",
      unsharedNote: "Privado en tu bóveda",
      commentsLabel: "Comentarios",
      addCommentPlaceholder: "Agrega un comentario o reflexión...",
      noCommentsYet: "Aún no hay comentarios.",
      commentAddedToast: "Comentario agregado.",
      memorySavedToast: "¡Guardado en tu Bóveda de Recuerdos!",
      memoryUpdatedToast: "Recuerdo actualizado.",
      memoryDeletedToast: "Recuerdo eliminado de tu bóveda.",
      sharedToFeedToast: "¡Compartido en Pulso Familiar!",
      confirmDeleteMemory:
        "¿Eliminar este recuerdo de tu bóveda? Las copias confirmadas de los familiares etiquetados permanecerán intactas.",
      emptyTitle: "Tu Bóveda Personal de Recuerdos está lista",
      emptySubtitle:
        "Registra películas, libros, escrituras, ejercicio, caminatas o logros en segundos y encuéntralos al instante.",
      taggedMembersPrefix: "Con",
      pendingBadge: "Pendiente",
      confirmedBadge: "Confirmado",
      defaultCategories: [
        { name: "Películas", template_type: "media", color: "#9E4F73" },
        { name: "Libros", template_type: "media", color: "#3B6998" },
        { name: "Escrituras", template_type: "media", color: "#B8862D" },
        { name: "Ejercicio", template_type: "media", color: "#2C7A7B" },
        { name: "Caminata / Viaje", template_type: "location", color: "#2D5A47" },
        {
          name: "Logro Familiar",
          template_type: "general",
          color: "#C86D51",
        },
      ],
    },
    goals: {
      sectionTitle: "Metas Familiares Compartidas",
      sectionSubtitle:
        "Establece metas espirituales, de aprendizaje o aventura y vincula recuerdos compartidos para ver el progreso.",
      newGoal: "Nueva meta",
      editGoal: "Editar meta",
      titleLabel: "Título de la meta",
      titlePlaceholder: "ej., Leer las escrituras en familia, 10 caminatas",
      categoryLabel: "Enfoque",
      targetLabel: "Recuerdos objetivo",
      notesLabel: "Notas",
      notesPlaceholder: "Descripción opcional de la meta...",
      linkedMemoriesLabel: "recuerdos vinculados",
      markComplete: "Completar",
      completedBadge: "Completada",
      goalSavedToast: "¡Meta familiar guardada!",
      goalDeletedToast: "Meta familiar eliminada.",
      confirmDeleteGoal: "¿Eliminar esta meta familiar compartida?",
      emptyText:
        "Aún no hay metas familiares. Crea una meta espiritual, de estudio o aventura juntos.",
      categories: {
        spiritual: "Espiritual",
        learning: "Aprendizaje",
        adventure: "Aventura",
        health: "Salud",
        other: "Otro",
      },
    },
  },
};
