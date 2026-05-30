//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Dialog,
    IconButton,
    Portal,
    Text,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getNoteCategoryByKey, NOTE_CATEGORIES } from "../constants/noteCategories";
import { useAuth } from "../context/AuthContext";
import {
    cancelTaskNotification,
    syncTaskNotificationsForUser,
} from "../services/notificationService";
import {
    deleteTask,
    getAllTasks,
    toggleTaskCompleted,
    updateTask,
} from "../services/taskService";

//JS:
LocaleConfig.locales.es = {
    monthNames: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
    ],
    monthNamesShort: [
        "Ene.",
        "Feb.",
        "Mar.",
        "Abr.",
        "May.",
        "Jun.",
        "Jul.",
        "Ago.",
        "Sep.",
        "Oct.",
        "Nov.",
        "Dic.",
    ],
    dayNames: [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
    ],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    today: "Hoy",
    };

    LocaleConfig.defaultLocale = "es";

    function getDueDateFromTask(task) {
    if (task?.dueDateTimestamp) {
        const date = new Date(task.dueDateTimestamp);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    if (task?.dueDate) {
        const date = new Date(task.dueDate);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
    }

    function toDateKey(date) {
    if (!date) return "";

    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
    }

    function formatDateLong(dateString) {
    if (!dateString) return "";

    const [year, month, day] = String(dateString).split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
    }

    function formatDateShort(dateString) {
    if (!dateString) return "";

    const [year, month, day] = String(dateString).split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
    }

    function getInitials(name) {
    const safeName = String(name || "").trim();

    if (!safeName) return "?";

    return safeName.charAt(0).toUpperCase();
    }

    function getTaskStatusMeta(task) {
    const isCompleted = !!task?.completed;

    if (isCompleted) {
        return {
        label: "Completada",
        color: "#2E7D32",
        soft: "rgba(46,125,50,0.10)",
        icon: "check-circle-outline",
        };
    }

    return {
        label: "Pendiente",
        color: "#B7791F",
        soft: "rgba(183,121,31,0.12)",
        icon: "clock-outline",
    };
    }

    function sortTasksForCalendar(a, b) {
    const aCompleted = !!a.completed;
    const bCompleted = !!b.completed;

    if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
    }

    const aPinned = !!a.isPinned;
    const bPinned = !!b.isPinned;

    if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
    }

    const orderA = typeof a?.order === "number" ? a.order : 999999;
    const orderB = typeof b?.order === "number" ? b.order : 999999;

    if (orderA !== orderB) {
        return orderA - orderB;
    }

    const aTime = a?.createdAt?.seconds || 0;
    const bTime = b?.createdAt?.seconds || 0;

    return aTime - bTime;
    }

    function CalendarDay({ date, state, selectedDate, todayKey, tasksByDate, onPressDay }) {
    const dateKey = date?.dateString;
    const dayTasks = tasksByDate[dateKey] || [];
    const firstTask = dayTasks[0];
    const extraCount = Math.max(dayTasks.length - 1, 0);

    const hasTasks = dayTasks.length > 0;
    const hasPendingTask = dayTasks.some((task) => !task?.completed);
    const allTasksCompleted = hasTasks && dayTasks.every((task) => !!task?.completed);
    const hasPinnedTask = dayTasks.some((task) => !!task?.isPinned);

    const isSelected = selectedDate === dateKey;
    const isToday = todayKey === dateKey;
    const isDisabled = state === "disabled";

    const category = firstTask ? getNoteCategoryByKey(firstTask.categoryKey) : null;

    return (
        <Pressable
        onPress={() => onPressDay(date)}
        style={({ pressed }) => [
            styles.dayCell,
            isToday && styles.dayCellToday,
            hasPendingTask && styles.dayCellPending,
            allTasksCompleted && styles.dayCellCompleted,
            hasPinnedTask && styles.dayCellPinned,
            isSelected && styles.dayCellSelected,
            pressed && styles.dayCellPressed,
        ]}
        >
        {hasPinnedTask ? (
            <View style={styles.dayPinnedBadge}>
            <MaterialCommunityIcons name="star" size={9} color="#FFFFFF" />
            </View>
        ) : null}

        <Text
            style={[
            styles.dayNumber,
            isDisabled && styles.dayNumberDisabled,
            isToday && styles.dayNumberToday,
            isSelected && styles.dayNumberSelected,
            ]}
        >
            {date?.day}
        </Text>

        {firstTask ? (
            <View style={styles.dayTaskPreview}>
            <View
                style={[
                styles.dayInitialCircle,
                {
                    backgroundColor: category.color,
                },
                ]}
            >
                <Text style={styles.dayInitialText}>
                {getInitials(firstTask.assignedToName)}
                </Text>
            </View>

            <Text
                style={styles.dayTaskText}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                {firstTask.title || "Tarea"}
            </Text>

            {extraCount > 0 ? (
                <Text style={[styles.dayExtraText, { color: category.color }]}>
                +{extraCount}
                </Text>
            ) : null}
            </View>
        ) : (
            <View style={styles.emptyDaySpace} />
        )}
        </Pressable>
    );
    }

    export default function CalendarScreen({ navigation }) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const todayKey = useMemo(() => toDateKey(new Date()), []);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
    const [dialogVisible, setDialogVisible] = useState(false);

    const [updatingTaskId, setUpdatingTaskId] = useState(null);
    const [pinningTaskId, setPinningTaskId] = useState(null);
    const [deletingTaskId, setDeletingTaskId] = useState(null);
    const [reordering, setReordering] = useState(false);

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const [ownerFilter, setOwnerFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);

            const data = await getAllTasks();
            const safeTasks = Array.isArray(data) ? data.filter(Boolean) : [];

            setTasks(safeTasks);

            await syncTaskNotificationsForUser({
            tasks: safeTasks,
            userId: user?.uid,
            });
        } catch (error) {
            console.log("LOAD TASKS CALENDAR ERROR:", error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
        }, [user?.uid]);

    useFocusEffect(
        useCallback(() => {
        if (user?.uid) {
            loadTasks();
        }
        }, [user?.uid, loadTasks])
    );

    const datedTasks = useMemo(() => {
        return (tasks || [])
        .map((task) => {
            const dueDate = getDueDateFromTask(task);
            if (!dueDate) return null;

            return {
            ...task,
            parsedDueDate: dueDate,
            dateKey: toDateKey(dueDate),
            };
        })
        .filter(Boolean)
        .sort(sortTasksForCalendar);
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return datedTasks.filter((task) => {
        if (ownerFilter === "mine") {
            if (String(task.assignedTo) !== String(user?.uid)) return false;
        }

        if (ownerFilter === "others") {
            if (String(task.assignedTo) === String(user?.uid)) return false;
        }

        if (statusFilter === "pending") {
            if (!!task.completed) return false;
        }

        if (statusFilter === "completed") {
            if (!task.completed) return false;
        }

        if (categoryFilter) {
            if (String(task.categoryKey) !== String(categoryFilter)) return false;
        }

        return true;
        });
    }, [datedTasks, ownerFilter, statusFilter, categoryFilter, user?.uid]);

    const tasksByDate = useMemo(() => {
        return filteredTasks.reduce((acc, task) => {
        if (!acc[task.dateKey]) {
            acc[task.dateKey] = [];
        }

        acc[task.dateKey].push(task);
        acc[task.dateKey].sort(sortTasksForCalendar);
        return acc;
        }, {});
    }, [filteredTasks]);

    const selectedTasks = useMemo(() => {
        return tasksByDate[selectedDate] || [];
    }, [tasksByDate, selectedDate]);

    const selectedCategory = useMemo(() => {
        if (!categoryFilter) return null;

        return getNoteCategoryByKey(categoryFilter);
    }, [categoryFilter]);

    const hasActiveFilters = !!ownerFilter || !!statusFilter || !!categoryFilter;
    const canReorderSelectedDay = selectedTasks.length > 1;

    const handleDayPress = (day) => {
        const dateString = day?.dateString;
        if (!dateString) return;

        setSelectedDate(dateString);
        setDialogVisible(true);
    };

    const handleCreateTaskForSelectedDate = () => {
        setDialogVisible(false);
        navigation.navigate("Crear tarea", { selectedDate });
    };

    const handleToggleOwnerFilter = (value) => {
        setOwnerFilter((prev) => (prev === value ? null : value));
    };

    const handleToggleStatusFilter = (value) => {
        setStatusFilter((prev) => (prev === value ? null : value));
    };

    const handleSelectCategoryFilter = (categoryKey) => {
        setCategoryFilter((prev) => (prev === categoryKey ? null : categoryKey));
        setCategoryDialogVisible(false);
    };

    const handleClearFilters = () => {
        setOwnerFilter(null);
        setStatusFilter(null);
        setCategoryFilter(null);
    };

    const handleToggleTask = async (task) => {
        if (!task?.id) return;

        try {
            setUpdatingTaskId(task.id);

            const nextCompletedValue = !task.completed;

            await toggleTaskCompleted(task.id, nextCompletedValue);

            if (nextCompletedValue) {
            await cancelTaskNotification(task.id);
            }

            await loadTasks();
        } catch (error) {
            console.log("TOGGLE TASK CALENDAR ERROR:", error);
        } finally {
            setUpdatingTaskId(null);
        }
        };

    const handleTogglePinned = async (task) => {
        if (!task?.id) return;

        try {
        setPinningTaskId(task.id);
        await updateTask(task.id, {
            isPinned: !task.isPinned,
        });
        await loadTasks();
        } catch (error) {
        console.log("TOGGLE PINNED TASK ERROR:", error);
        } finally {
        setPinningTaskId(null);
        }
    };

    const handleAskDeleteTask = (task) => {
        if (!task?.id) return;

        setTaskToDelete(task);
        setDeleteDialogVisible(true);
    };

    const handleCloseDeleteDialog = () => {
        if (deletingTaskId) return;

        setDeleteDialogVisible(false);
        setTaskToDelete(null);
    };

    const handleConfirmDeleteTask = async () => {
        if (!taskToDelete?.id) return;

        try {
        setDeletingTaskId(taskToDelete.id);

        await deleteTask(taskToDelete.id);
        await cancelTaskNotification(taskToDelete.id);

        setTasks((prevTasks) =>
            prevTasks.filter((task) => String(task.id) !== String(taskToDelete.id))
        );

        setDeleteDialogVisible(false);
        setTaskToDelete(null);

        await loadTasks();
        } catch (error) {
        console.log("DELETE TASK ERROR:", error);
        } finally {
        setDeletingTaskId(null);
        }
    };

    const handleDragEnd = async ({ data }) => {
        try {
        setReordering(true);

        setTasks((prevTasks) => {
            const orderMap = new Map();

            data.forEach((task, index) => {
            orderMap.set(task.id, index);
            });

            return prevTasks.map((task) => {
            if (!orderMap.has(task.id)) return task;

            return {
                ...task,
                order: orderMap.get(task.id),
            };
            });
        });

        await Promise.all(
            data.map((task, index) =>
            updateTask(task.id, {
                order: index,
            })
            )
        );

        await loadTasks();
        } catch (error) {
        console.log("REORDER TASKS ERROR:", error);
        } finally {
        setReordering(false);
        }
    };

    const renderTaskItem = ({ item: task, drag, isActive }) => {
        const category = getNoteCategoryByKey(task.categoryKey);
        const statusMeta = getTaskStatusMeta(task);
        const isUpdating = updatingTaskId === task.id;
        const isPinning = pinningTaskId === task.id;
        const isDeleting = deletingTaskId === task.id;

        return (
        <ScaleDecorator>
            <Pressable
            onLongPress={canReorderSelectedDay ? drag : undefined}
            delayLongPress={180}
            disabled={isActive}
            style={[
                styles.taskItem,
                isActive && styles.taskItemDragging,
                task.isPinned && styles.taskItemPinned,
            ]}
            >
            <View style={styles.taskTop}>
                <View
                style={[
                    styles.taskAvatar,
                    {
                    backgroundColor: category.color,
                    },
                ]}
                >
                <Text style={styles.taskAvatarText}>
                    {getInitials(task.assignedToName)}
                </Text>
                </View>

                <View style={styles.taskTitleWrap}>
                <Text style={styles.taskTitle} numberOfLines={2}>
                    {task.title || "Sin título"}
                </Text>

                <Text style={styles.taskAssignedText}>
                    {task.assignedToName || "Sin asignar"}
                </Text>
                </View>

                <View style={styles.taskTopActions}>
                    <View style={styles.taskActionButtonsRow}>
                        <IconButton
                        icon={task.isPinned ? "star" : "star-outline"}
                        size={18}
                        mode="contained-tonal"
                        loading={isPinning}
                        disabled={isPinning || isDeleting}
                        iconColor={task.isPinned ? "#B7791F" : "#98A2B3"}
                        containerColor={
                            task.isPinned ? "rgba(245,158,11,0.16)" : "#F8FAFC"
                        }
                        style={styles.starButton}
                        onPress={() => handleTogglePinned(task)}
                        />

                        <IconButton
                        icon="trash-can-outline"
                        size={18}
                        mode="contained-tonal"
                        loading={isDeleting}
                        disabled={isDeleting || isPinning}
                        iconColor="#B42318"
                        containerColor="rgba(180,35,24,0.08)"
                        style={styles.deleteButton}
                        onPress={() => handleAskDeleteTask(task)}
                        />

                        {canReorderSelectedDay ? (
                        <Pressable onLongPress={drag} delayLongPress={100} hitSlop={8}>
                            <View style={styles.dragHandle}>
                            <MaterialCommunityIcons
                                name="drag"
                                size={20}
                                color="#98A2B3"
                            />
                            </View>
                        </Pressable>
                        ) : null}
                    </View>
                </View>
            </View>

            <View style={styles.topTaskChipsRow}>
                {task.isPinned ? (
                <View style={styles.principalChip}>
                    <Text style={styles.principalChipText}>Tarea principal</Text>
                </View>
                ) : null}

                <Chip
                compact
                style={[
                    styles.categoryChip,
                    {
                    backgroundColor: category.soft,
                    borderColor: category.border,
                    },
                ]}
                textStyle={[
                    styles.categoryChipText,
                    { color: category.color },
                ]}
                icon={() => (
                    <MaterialCommunityIcons
                    name={category.icon}
                    size={14}
                    color={category.color}
                    />
                )}
                >
                {category.label}
                </Chip>

                <View
                style={[
                    styles.smallChip,
                    {
                    backgroundColor: statusMeta.soft,
                    borderColor: statusMeta.soft,
                    },
                ]}
                >
                <MaterialCommunityIcons
                    name={statusMeta.icon}
                    size={13}
                    color={statusMeta.color}
                />
                <Text
                    style={[
                    styles.smallChipText,
                    { color: statusMeta.color },
                    ]}
                >
                    {statusMeta.label}
                </Text>
                </View>
            </View>

            {!!task.description ? (
                <Text style={styles.taskDescription}>
                {task.description}
                </Text>
            ) : null}

            <View style={styles.metaStack}>
                <View style={styles.modalMetaRow}>
                <MaterialCommunityIcons
                    name="account-edit-outline"
                    size={15}
                    color="#667085"
                />
                <Text style={styles.modalMetaText}>
                    Creada por{" "}
                    <Text style={styles.modalMetaStrong}>
                    {task.createdByName || "Usuario"}
                    </Text>
                </Text>
                </View>

                <View style={styles.modalMetaRow}>
                <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={15}
                    color="#667085"
                />
                <Text style={styles.modalMetaText}>
                    Fecha{" "}
                    <Text style={styles.modalMetaStrong}>
                    {formatDateShort(task.dateKey)}
                    </Text>
                </Text>
                </View>
            </View>

            <Button
                mode={task.completed ? "outlined" : "contained"}
                onPress={() => handleToggleTask(task)}
                loading={isUpdating}
                disabled={isUpdating || isDeleting}
                style={[
                styles.toggleTaskButton,
                task.completed && styles.toggleTaskButtonDone,
                ]}
                contentStyle={styles.toggleTaskButtonContent}
                buttonColor={!task.completed ? theme.colors.primary : undefined}
                textColor={task.completed ? theme.colors.primary : "#FFFFFF"}
                icon={task.completed ? "restore" : "check"}
            >
                {task.completed ? "Marcar pendiente" : "Marcar completada"}
            </Button>
            </Pressable>
        </ScaleDecorator>
        );
    };

    return (
        <>
        <View
            style={[
            styles.container,
            {
                backgroundColor: "#F4F8F1",
                paddingTop: insets.top + 6,
            },
            ]}
        >
            <View style={styles.backgroundOrbTop} />
            <View style={styles.backgroundOrbBottom} />

            <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 118 + insets.bottom },
            ]}
            >
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                Tareas
                </Text>

                <Text variant="bodyMedium" style={styles.subtitle}>
                Visualizá las tareas por día, responsable y categoría.
                </Text>
            </View>

            <Card style={styles.filtersCard}>
                <Card.Content style={styles.filtersContent}>
                <View style={styles.filtersTopRow}>
                    <View style={styles.filtersTitleRow}>
                    <View style={styles.filtersIconWrap}>
                        <MaterialCommunityIcons
                        name="filter-variant"
                        size={15}
                        color={theme.colors.primary}
                        />
                    </View>

                    <Text style={styles.filtersTitle}>Filtros</Text>
                    </View>

                    <Pressable
                    onPress={handleClearFilters}
                    disabled={!hasActiveFilters}
                    hitSlop={8}
                    style={styles.clearFiltersPressable}
                    >
                    <Text
                        style={[
                        styles.clearFiltersText,
                        !hasActiveFilters && styles.clearFiltersTextHidden,
                        ]}
                    >
                        Limpiar
                    </Text>
                    </Pressable>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScrollContent}
                >
                    <Chip
                    compact
                    selected={ownerFilter === "mine"}
                    onPress={() => handleToggleOwnerFilter("mine")}
                    showSelectedCheck={false}
                    style={[
                        styles.filterChip,
                        ownerFilter === "mine" && styles.filterChipSelected,
                    ]}
                    textStyle={[
                        styles.filterChipText,
                        ownerFilter === "mine" && {
                        color: theme.colors.primary,
                        fontWeight: "800",
                        },
                    ]}
                    icon={() => (
                        <MaterialCommunityIcons
                        name="account-check-outline"
                        size={14}
                        color={ownerFilter === "mine" ? theme.colors.primary : "#667085"}
                        />
                    )}
                    >
                    Mías
                    </Chip>

                    <Chip
                    compact
                    selected={ownerFilter === "others"}
                    onPress={() => handleToggleOwnerFilter("others")}
                    showSelectedCheck={false}
                    style={[
                        styles.filterChip,
                        ownerFilter === "others" && styles.filterChipSelected,
                    ]}
                    textStyle={[
                        styles.filterChipText,
                        ownerFilter === "others" && {
                        color: theme.colors.primary,
                        fontWeight: "800",
                        },
                    ]}
                    icon={() => (
                        <MaterialCommunityIcons
                        name="account-group-outline"
                        size={14}
                        color={
                            ownerFilter === "others" ? theme.colors.primary : "#667085"
                        }
                        />
                    )}
                    >
                    Otros
                    </Chip>

                    <Chip
                    compact
                    selected={!!categoryFilter}
                    onPress={() => setCategoryDialogVisible(true)}
                    showSelectedCheck={false}
                    style={[
                        styles.filterChip,
                        categoryFilter && {
                        backgroundColor: selectedCategory?.soft,
                        borderColor: selectedCategory?.border,
                        },
                    ]}
                    textStyle={[
                        styles.filterChipText,
                        categoryFilter && {
                        color: selectedCategory?.color,
                        fontWeight: "800",
                        },
                    ]}
                    icon={() => (
                        <MaterialCommunityIcons
                        name={selectedCategory?.icon || "shape-outline"}
                        size={14}
                        color={categoryFilter ? selectedCategory?.color : "#667085"}
                        />
                    )}
                    >
                    {selectedCategory?.label || "Categoría"}
                    </Chip>

                    <Chip
                    compact
                    selected={statusFilter === "pending"}
                    onPress={() => handleToggleStatusFilter("pending")}
                    showSelectedCheck={false}
                    style={[
                        styles.filterChip,
                        statusFilter === "pending" && styles.filterChipSelectedWarning,
                    ]}
                    textStyle={[
                        styles.filterChipText,
                        statusFilter === "pending" && {
                        color: "#B7791F",
                        fontWeight: "800",
                        },
                    ]}
                    icon={() => (
                        <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color={statusFilter === "pending" ? "#B7791F" : "#667085"}
                        />
                    )}
                    >
                    Pendientes
                    </Chip>

                    <Chip
                    compact
                    selected={statusFilter === "completed"}
                    onPress={() => handleToggleStatusFilter("completed")}
                    showSelectedCheck={false}
                    style={[
                        styles.filterChip,
                        statusFilter === "completed" && styles.filterChipSelectedSuccess,
                    ]}
                    textStyle={[
                        styles.filterChipText,
                        statusFilter === "completed" && {
                        color: "#2E7D32",
                        fontWeight: "800",
                        },
                    ]}
                    icon={() => (
                        <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={14}
                        color={statusFilter === "completed" ? "#2E7D32" : "#667085"}
                        />
                    )}
                    >
                    Completadas
                    </Chip>
                </ScrollView>
                </Card.Content>
            </Card>

            <Card style={styles.calendarCard}>
                <Card.Content style={styles.calendarContent}>
                {loading ? (
                    <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Cargando tareas...</Text>
                    </View>
                ) : (
                    <Calendar
                    key={todayKey}
                    current={todayKey}
                    onDayPress={handleDayPress}
                    markingType="custom"
                    hideExtraDays={false}
                    enableSwipeMonths
                    firstDay={1}
                    dayComponent={({ date, state }) => (
                        <CalendarDay
                        date={date}
                        state={state}
                        selectedDate={selectedDate}
                        todayKey={todayKey}
                        tasksByDate={tasksByDate}
                        onPressDay={handleDayPress}
                        />
                    )}
                    theme={{
                        backgroundColor: "#FFFFFF",
                        calendarBackground: "#FFFFFF",
                        textSectionTitleColor: "#667085",
                        textDisabledColor: "#C5CCD3",
                        arrowColor: "#4E7A28",
                        monthTextColor: "#234015",
                        indicatorColor: "#4E7A28",
                        textMonthFontWeight: "800",
                        textDayHeaderFontWeight: "800",
                        textMonthFontSize: 20,
                        textDayHeaderFontSize: 13,
                    }}
                    style={styles.calendar}
                    />
                )}
                </Card.Content>
            </Card>
            </ScrollView>
        </View>

        <Portal>
            <Dialog
            visible={categoryDialogVisible}
            onDismiss={() => setCategoryDialogVisible(false)}
            style={styles.categoryDialog}
            >
            <Dialog.Title style={styles.categoryDialogTitle}>
                Filtrar por categoría
            </Dialog.Title>

            <Dialog.ScrollArea style={styles.categoryDialogScrollArea}>
                <ScrollView
                style={styles.categoryDialogScroll}
                contentContainerStyle={styles.categoryDialogContent}
                showsVerticalScrollIndicator={false}
                >
                {NOTE_CATEGORIES.map((item) => {
                    const selected = item.key === categoryFilter;

                    return (
                    <Pressable
                        key={item.key}
                        onPress={() => handleSelectCategoryFilter(item.key)}
                        style={({ pressed }) => [
                        styles.categoryOption,
                        {
                            backgroundColor: selected ? item.soft : "#FFFFFF",
                            borderColor: selected ? item.border : "#ECEFF3",
                        },
                        pressed && styles.categoryOptionPressed,
                        ]}
                    >
                        <View
                        style={[
                            styles.categoryOptionIcon,
                            {
                            backgroundColor: item.soft,
                            borderColor: item.border,
                            },
                        ]}
                        >
                        <MaterialCommunityIcons
                            name={item.icon}
                            size={18}
                            color={item.color}
                        />
                        </View>

                        <Text
                        style={[
                            styles.categoryOptionText,
                            selected && { color: item.color },
                        ]}
                        >
                        {item.label}
                        </Text>

                        {selected ? (
                        <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={item.color}
                        />
                        ) : null}
                    </Pressable>
                    );
                })}
                </ScrollView>
            </Dialog.ScrollArea>

            <Dialog.Actions>
                {categoryFilter ? (
                <Button
                    onPress={() => {
                    setCategoryFilter(null);
                    setCategoryDialogVisible(false);
                    }}
                    textColor="#667085"
                >
                    Quitar filtro
                </Button>
                ) : null}

                <Button onPress={() => setCategoryDialogVisible(false)}>
                Cerrar
                </Button>
            </Dialog.Actions>
            </Dialog>

            <Dialog
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}
            style={styles.dialog}
            >
            <Dialog.Title style={styles.dialogTitle}>
                {formatDateLong(selectedDate)}
            </Dialog.Title>

            {selectedTasks.length > 1 ? (
                <View style={styles.reorderHintBox}>
                <MaterialCommunityIcons name="gesture-tap-hold" size={15} color="#667085" />
                <Text style={styles.reorderHintText}>
                    Mantené presionada una tarea y arrastrala para ordenar la prioridad del día.
                </Text>
                </View>
            ) : null}

            <Dialog.ScrollArea style={styles.dialogScrollArea}>
                {selectedTasks.length > 0 ? (
                <DraggableFlatList
                    data={selectedTasks}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderTaskItem}
                    onDragEnd={handleDragEnd}
                    activationDistance={8}
                    scrollEnabled
                    style={styles.dragList}
                    contentContainerStyle={styles.dialogScrollContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                    reordering ? (
                        <View style={styles.reorderingBox}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.reorderingText}>Guardando orden...</Text>
                        </View>
                    ) : null
                    }
                />
                ) : (
                <ScrollView
                    style={styles.dialogScroll}
                    contentContainerStyle={styles.dialogScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.emptyDialogBox}>
                    <View style={styles.emptyDialogIconCircle}>
                        <MaterialCommunityIcons
                        name="calendar-plus"
                        size={30}
                        color={theme.colors.primary}
                        />
                    </View>

                    <Text style={styles.emptyDialogTitle}>
                        Sin tareas para este día
                    </Text>

                    <Text style={styles.emptyDialogText}>
                        No hay tareas asignadas para {formatDateShort(selectedDate)}.
                    </Text>
                    </View>
                </ScrollView>
                )}
            </Dialog.ScrollArea>

            <Dialog.Actions style={styles.modalActionsRow}>
                <Button
                mode="text"
                compact
                onPress={() => setDialogVisible(false)}
                textColor="#667085"
                style={styles.modalSmallButton}
                labelStyle={styles.modalSmallButtonLabel}
                >
                Cerrar
                </Button>

                <Button
                mode="outlined"
                compact
                onPress={handleCreateTaskForSelectedDate}
                textColor={theme.colors.primary}
                style={styles.modalSmallButton}
                labelStyle={styles.modalSmallButtonLabel}
                icon="plus"
                >
                Nueva tarea
                </Button>
            </Dialog.Actions>
            </Dialog>

            <Dialog
            visible={deleteDialogVisible}
            onDismiss={handleCloseDeleteDialog}
            style={styles.deleteDialog}
            >
            <Dialog.Content style={styles.deleteDialogContent}>
                <View style={styles.deleteIconCircle}>
                <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={28}
                    color="#FFFFFF"
                />
                </View>

                <Text variant="titleLarge" style={styles.deleteDialogTitle}>
                Eliminar tarea
                </Text>

                <Text variant="bodyMedium" style={styles.deleteDialogText}>
                ¿Querés eliminar{" "}
                <Text style={styles.deleteDialogStrong}>
                    {taskToDelete?.title || "esta tarea"}
                </Text>
                ? Esta acción no se puede deshacer.
                </Text>

                <View style={styles.deleteDialogActions}>
                <Button
                    mode="outlined"
                    onPress={handleCloseDeleteDialog}
                    disabled={!!deletingTaskId}
                    style={styles.cancelDeleteButton}
                    textColor="#667085"
                >
                    Cancelar
                </Button>

                <Button
                    mode="contained"
                    onPress={handleConfirmDeleteTask}
                    loading={!!deletingTaskId}
                    disabled={!!deletingTaskId}
                    style={styles.confirmDeleteButton}
                    buttonColor="#B42318"
                    icon="trash-can-outline"
                >
                    Eliminar
                </Button>
                </View>
            </Dialog.Content>
            </Dialog>
        </Portal>
        </>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 8,
    },

    scrollContent: {
        flexGrow: 1,
    },

    backgroundOrbTop: {
        position: "absolute",
        top: -130,
        right: -70,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: "rgba(78,122,40,0.08)",
    },

    backgroundOrbBottom: {
        position: "absolute",
        bottom: -120,
        left: -80,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "rgba(78,122,40,0.05)",
    },

    header: {
        paddingHorizontal: 4,
        marginBottom: 12,
    },

    title: {
        fontWeight: "800",
        color: "#234015",
        marginBottom: 8,
    },

    subtitle: {
        color: "#5E6E57",
        lineHeight: 21,
        maxWidth: 340,
    },

    filtersCard: {
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        elevation: 1,
        marginBottom: 12,
    },

    filtersContent: {
        paddingHorizontal: 12,
        paddingTop: 11,
        paddingBottom: 11,
    },

    filtersTopRow: {
        height: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 9,
        overflow: "hidden",
    },

    filtersTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        flex: 1,
    },

    filtersIconWrap: {
        width: 27,
        height: 27,
        borderRadius: 10,
        backgroundColor: "#F6F9F2",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        alignItems: "center",
        justifyContent: "center",
    },

    filtersTitle: {
        fontSize: 13.5,
        fontWeight: "800",
        color: "#344054",
    },

    clearFiltersPressable: {
        width: 64,
        height: 28,
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
    },

    clearFiltersText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#667085",
    },

    clearFiltersTextHidden: {
        opacity: 0,
    },

    filtersScrollContent: {
        gap: 8,
        paddingRight: 4,
    },

    filterChip: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    filterChipSelected: {
        backgroundColor: "rgba(78,122,40,0.10)",
        borderColor: "rgba(78,122,40,0.25)",
    },

    filterChipSelectedWarning: {
        backgroundColor: "rgba(183,121,31,0.12)",
        borderColor: "rgba(183,121,31,0.25)",
    },

    filterChipSelectedSuccess: {
        backgroundColor: "rgba(46,125,50,0.10)",
        borderColor: "rgba(46,125,50,0.24)",
    },

    filterChipText: {
        fontSize: 12,
        color: "#667085",
        fontWeight: "700",
    },

    calendarCard: {
        borderRadius: 26,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        elevation: 3,
        marginBottom: 14,
    },

    calendarContent: {
        paddingTop: 16,
        paddingBottom: 14,
        paddingHorizontal: 0,
    },

    calendar: {
        borderRadius: 20,
    },

    loadingBox: {
        paddingVertical: 34,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },

    loadingText: {
        color: "#667085",
        fontWeight: "600",
    },

    dayCell: {
        width: 48,
        minHeight: 78,
        borderRadius: 16,
        paddingHorizontal: 2,
        paddingTop: 6,
        paddingBottom: 4,
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "visible",
        borderWidth: 1,
        borderColor: "transparent",
    },

    dayCellToday: {
        backgroundColor: "rgba(78,122,40,0.06)",
    },

    dayCellPending: {
        borderColor: "rgba(183,121,31,0.34)",
        backgroundColor: "rgba(183,121,31,0.035)",
    },

    dayCellCompleted: {
        borderColor: "rgba(46,125,50,0.30)",
        backgroundColor: "rgba(46,125,50,0.035)",
    },

    dayCellPinned: {
        backgroundColor: "rgba(245,158,11,0.06)",
    },

    dayCellSelected: {
        backgroundColor: "rgba(78,122,40,0.10)",
        borderColor: "rgba(78,122,40,0.32)",
    },

    dayCellPressed: {
        opacity: 0.85,
    },

    dayPinnedBadge: {
        position: "absolute",
        top: -5,
        right: -4,
        width: 17,
        height: 17,
        borderRadius: 999,
        backgroundColor: "#F59E0B",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },

    dayNumber: {
        fontSize: 13,
        fontWeight: "800",
        color: "#1F2937",
        marginBottom: 5,
    },

    dayNumberDisabled: {
        color: "#C5CCD3",
    },

    dayNumberToday: {
        color: "#4E7A28",
    },

    dayNumberSelected: {
        color: "#234015",
    },

    dayTaskPreview: {
        width: "100%",
        maxWidth: 45,
        alignItems: "center",
        gap: 2,
        overflow: "hidden",
    },

    dayInitialCircle: {
        width: 24,
        height: 24,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },

    dayInitialText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "900",
    },

    dayTaskText: {
        width: 44,
        maxWidth: 44,
        textAlign: "center",
        fontSize: 10,
        color: "#344054",
        fontWeight: "700",
        lineHeight: 11,
        overflow: "hidden",
    },

    dayExtraText: {
        fontSize: 10,
        fontWeight: "900",
        lineHeight: 12,
    },

    emptyDaySpace: {
        height: 38,
    },

    categoryDialog: {
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
    },

    categoryDialogTitle: {
        color: "#234015",
        fontWeight: "800",
    },

    categoryDialogScrollArea: {
        paddingHorizontal: 0,
        maxHeight: 430,
    },

    categoryDialogScroll: {
        maxHeight: 420,
    },

    categoryDialogContent: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        gap: 10,
    },

    categoryOption: {
        minHeight: 58,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    categoryOptionPressed: {
        opacity: 0.9,
    },

    categoryOptionIcon: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    categoryOptionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "800",
        color: "#344054",
    },

    dialog: {
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
    },

    dialogTitle: {
        color: "#234015",
        fontWeight: "800",
        textTransform: "capitalize",
    },

    reorderHintBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#ECEFF3",
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginHorizontal: 20,
        marginBottom: 10,
    },

    reorderHintText: {
        flex: 1,
        fontSize: 12,
        color: "#667085",
        lineHeight: 17,
        fontWeight: "600",
    },

    dialogScrollArea: {
        paddingHorizontal: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },

    dialogScroll: {
        maxHeight: 450,
    },

    dragList: {
        maxHeight: 450,
    },

    dialogScrollContent: {
        paddingHorizontal: 20,
        paddingBottom: -5,
    },

    taskItem: {
        borderWidth: 1,
        borderColor: "#E7EEE1",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 12,
    },

    taskItemPinned: {
        borderColor: "rgba(245,158,11,0.35)",
        backgroundColor: "rgba(255,251,235,0.62)",
    },

    taskItemDragging: {
        opacity: 0.94,
        elevation: 5,
        transform: [{ scale: 1.01 }],
    },

    taskTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 10,
    },

    taskAvatar: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    taskAvatarText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 17,
    },

    taskTitleWrap: {
        flex: 1,
    },

    taskTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: "800",
        color: "#1F2937",
        lineHeight: 22,
    },

    taskAssignedText: {
        marginTop: 2,
        fontSize: 12.5,
        color: "#667085",
        fontWeight: "600",
    },

    taskTopActions: {
        alignItems: "flex-end",
        justifyContent: "flex-start",
        },

        taskActionButtonsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        },

        starButton: {
        margin: 0,
        width: 31,
        height: 31,
        borderRadius: 12,
        },

        deleteButton: {
        margin: 0,
        width: 31,
        height: 31,
        borderRadius: 12,
        },

        dragHandle: {
        width: 31,
        height: 31,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#ECEFF3",
        alignItems: "center",
        justifyContent: "center",
        },

    topTaskChipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
    },

    principalChip: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: "rgba(245,158,11,0.12)",
        borderColor: "rgba(245,158,11,0.28)",
    },

    principalChipText: {
        fontSize: 11.5,
        fontWeight: "800",
        color: "#B7791F",
    },

    categoryChip: {
        alignSelf: "flex-start",
        borderWidth: 1,
    },

    categoryChipText: {
        fontWeight: "800",
        fontSize: 12,
    },

    smallChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    smallChipText: {
        fontSize: 11.5,
        fontWeight: "700",
    },

    taskDescription: {
        color: "#475467",
        lineHeight: 19,
        marginBottom: 10,
    },

    metaStack: {
        gap: 7,
        marginBottom: 12,
    },

    modalMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    modalMetaText: {
        flex: 1,
        fontSize: 13,
        color: "#667085",
    },

    modalMetaStrong: {
        fontWeight: "800",
        color: "#344054",
    },

    toggleTaskButton: {
        borderRadius: 14,
    },

    toggleTaskButtonDone: {
        borderColor: "#D7DFCF",
    },

    toggleTaskButtonContent: {
        height: 42,
    },

    reorderingBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 8,
    },

    reorderingText: {
        fontSize: 12.5,
        fontWeight: "700",
        color: "#667085",
    },

    modalActionsRow: {
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingTop: 0,
        paddingBottom: 10,
    },

    modalSmallButton: {
        borderRadius: 14,
    },

    modalSmallButtonLabel: {
        fontSize: 12.5,
        fontWeight: "800",
    },

    emptyDialogBox: {
        paddingTop: 10,
        paddingBottom: 8,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    emptyDialogIconCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: "#F6F9F2",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },

    emptyDialogTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#344054",
        textAlign: "center",
    },

    emptyDialogText: {
        fontSize: 13.5,
        color: "#667085",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 8,
    },

    deleteDialog: {
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
    },

    deleteDialogContent: {
        alignItems: "center",
        paddingTop: 24,
        paddingBottom: 18,
    },

    deleteIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#B42318",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    deleteDialogTitle: {
        fontWeight: "800",
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 8,
    },

    deleteDialogText: {
        color: "#667085",
        textAlign: "center",
        lineHeight: 21,
        marginBottom: 18,
    },

    deleteDialogStrong: {
        fontWeight: "800",
        color: "#1F2937",
    },

    deleteDialogActions: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },

    cancelDeleteButton: {
        flex: 1,
        borderRadius: 16,
        borderColor: "#D0D5DD",
    },

    confirmDeleteButton: {
        flex: 1,
        borderRadius: 16,
    },
});