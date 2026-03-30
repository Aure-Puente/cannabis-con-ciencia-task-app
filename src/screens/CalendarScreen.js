//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import {
    ActivityIndicator,
    Button,
    Card,
    Dialog,
    Portal,
    Text,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getAllTasks } from "../services/taskService";

//JS:
    function getPriorityLabel(priority) {
    switch (priority) {
        case "alta":
        return "Alta";
        case "media":
        return "Media";
        case "baja":
        return "Baja";
        default:
        return "-";
    }
    }

    function getPriorityColor(priority) {
    switch (priority) {
        case "alta":
        return "#C62828";
        case "media":
        return "#B7791F";
        case "baja":
        return "#2E7D32";
        default:
        return "#6B7280";
    }
    }

    function getPrioritySoft(priority) {
    switch (priority) {
        case "alta":
        return "rgba(198,40,40,0.10)";
        case "media":
        return "rgba(183,121,31,0.12)";
        case "baja":
        return "rgba(46,125,50,0.10)";
        default:
        return "rgba(107,114,128,0.10)";
    }
    }

    function getCompletedLabel(completed) {
    return completed ? "Completada" : "Pendiente";
    }

    function getCompletedColor(completed) {
    return completed ? "#2E7D32" : "#6B7280";
    }

    function getCompletedSoft(completed) {
    return completed ? "rgba(46,125,50,0.10)" : "rgba(107,114,128,0.10)";
    }

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

    function getTaskStatusMeta(task) {
    const isCompleted = !!task?.completed;
    const dueDate = getDueDateFromTask(task);

    if (!dueDate) {
        return {
        label: "Sin fecha",
        color: "#6B7280",
        soft: "rgba(107,114,128,0.10)",
        icon: "calendar-blank-outline",
        };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
    );

    const diffMs = dueDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (isCompleted) {
        return {
        label: "Completada",
        color: "#2E7D32",
        soft: "rgba(46,125,50,0.10)",
        icon: "check-circle-outline",
        };
    }

    if (diffDays < 0) {
        return {
        label: "Vencida",
        color: "#C62828",
        soft: "rgba(198,40,40,0.10)",
        icon: "alert-circle-outline",
        };
    }

    if (diffDays === 0) {
        return {
        label: "Vence hoy",
        color: "#B7791F",
        soft: "rgba(183,121,31,0.12)",
        icon: "calendar-today",
        };
    }

    if (diffDays <= 2) {
        return {
        label: "Próxima",
        color: "#2563EB",
        soft: "rgba(37,99,235,0.10)",
        icon: "calendar-clock",
        };
    }

    return {
        label: "Programada",
        color: "#4E7A28",
        soft: "rgba(78,122,40,0.10)",
        icon: "calendar-check-outline",
    };
    }

    export default function CalendarScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
    const [dialogVisible, setDialogVisible] = useState(false);

    const loadTasks = useCallback(async () => {
        try {
        setLoading(true);
        const data = await getAllTasks();
        setTasks(Array.isArray(data) ? data.filter(Boolean) : []);
        } catch (error) {
        console.log("LOAD TASKS CALENDAR ERROR:", error);
        setTasks([]);
        } finally {
        setLoading(false);
        }
    }, []);

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
        .sort((a, b) => {
            const aTime = a?.parsedDueDate?.getTime?.() || 0;
            const bTime = b?.parsedDueDate?.getTime?.() || 0;
            return aTime - bTime;
        });
    }, [tasks]);

    const tasksByDate = useMemo(() => {
        return datedTasks.reduce((acc, task) => {
        if (!acc[task.dateKey]) {
            acc[task.dateKey] = [];
        }
        acc[task.dateKey].push(task);
        return acc;
        }, {});
    }, [datedTasks]);

    const markedDates = useMemo(() => {
        const marks = {};

        Object.keys(tasksByDate).forEach((dateKey) => {
        const dayTasks = tasksByDate[dateKey] || [];
        const hasPending = dayTasks.some((task) => !task.completed);
        const allCompleted =
            dayTasks.length > 0 && dayTasks.every((task) => !!task.completed);

        if (hasPending) {
            marks[dateKey] = {
            customStyles: {
                container: {
                backgroundColor: "rgba(183,121,31,0.18)",
                borderWidth: 1.5,
                borderColor: "#B7791F",
                borderRadius: 999,
                },
                text: {
                color: "#8A5A00",
                fontWeight: "800",
                },
            },
            };
        } else if (allCompleted) {
            marks[dateKey] = {
            customStyles: {
                container: {
                backgroundColor: "rgba(46,125,50,0.14)",
                borderWidth: 1.5,
                borderColor: "#2E7D32",
                borderRadius: 999,
                },
                text: {
                color: "#1F6A2B",
                fontWeight: "800",
                },
            },
            };
        }
        });

        if (selectedDate) {
        marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            customStyles: {
            container: {
                backgroundColor: "#4E7A28",
                borderWidth: 1.5,
                borderColor: "#4E7A28",
                borderRadius: 999,
            },
            text: {
                color: "#FFFFFF",
                fontWeight: "800",
            },
            },
        };
        }

        return marks;
    }, [tasksByDate, selectedDate]);

    const selectedTasks = useMemo(() => {
        return tasksByDate[selectedDate] || [];
    }, [tasksByDate, selectedDate]);

    const handleDayPress = (day) => {
        const dateString = day?.dateString;
        if (!dateString) return;

        setSelectedDate(dateString);
        setDialogVisible(true);
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
                { paddingBottom: 120 + insets.bottom },
            ]}
            >
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                Calendario
                </Text>

                <Text variant="bodyMedium" style={styles.subtitle}>
                Tocá un día para ver las tareas con fecha límite asignadas a esa fecha.
                </Text>
            </View>

            <Card style={styles.calendarCard}>
                <Card.Content style={styles.calendarContent}>
                {loading ? (
                    <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Cargando calendario...</Text>
                    </View>
                ) : (
                    <Calendar
                    current={selectedDate || toDateKey(new Date())}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    markingType="custom"
                    theme={{
                        backgroundColor: "#FFFFFF",
                        calendarBackground: "#FFFFFF",
                        textSectionTitleColor: "#667085",
                        todayTextColor: "#4E7A28",
                        dayTextColor: "#1F2937",
                        textDisabledColor: "#C5CCD3",
                        arrowColor: "#4E7A28",
                        monthTextColor: "#234015",
                        indicatorColor: "#4E7A28",
                        textDayFontWeight: "700",
                        textMonthFontWeight: "800",
                        textDayHeaderFontWeight: "700",
                        textDayFontSize: 14,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 12,
                    }}
                    enableSwipeMonths
                    firstDay={1}
                    style={styles.calendar}
                    />
                )}
                </Card.Content>
            </Card>

            <Card style={styles.selectedInfoCard}>
                <Card.Content style={styles.selectedInfoContent}>
                <View style={styles.selectedInfoHeader}>
                    <View style={styles.selectedIconWrap}>
                    <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={18}
                        color={theme.colors.primary}
                    />
                    </View>

                    <View style={styles.selectedTextWrap}>
                    <Text style={styles.selectedLabel}>Fecha seleccionada</Text>
                    <Text style={styles.selectedDateText}>
                        {formatDateLong(selectedDate)}
                    </Text>
                    </View>
                </View>

                <View style={styles.selectedSummaryRow}>
                    <Text style={styles.selectedSummaryText}>
                    {selectedTasks.length > 0
                        ? `${selectedTasks.length} tarea${
                            selectedTasks.length === 1 ? "" : "s"
                        } para este día`
                        : "No hay tareas con fecha límite en este día"}
                    </Text>

                    <Button
                    mode="contained"
                    onPress={() => setDialogVisible(true)}
                    style={styles.detailsButton}
                    contentStyle={styles.detailsButtonContent}
                    buttonColor={theme.colors.primary}
                    icon="eye-outline"
                    >
                    Ver detalle
                    </Button>
                </View>
                </Card.Content>
            </Card>

            <Card style={styles.legendCard}>
                <Card.Content style={styles.legendContent}>
                <Text style={styles.legendTitle}>Referencia</Text>

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                    <View style={styles.legendCirclePending}>
                        <Text style={styles.legendCircleTextPending}>15</Text>
                    </View>
                    <Text style={styles.legendText}>Pendientes</Text>
                    </View>

                    <View style={styles.legendItem}>
                    <View style={styles.legendCircleCompleted}>
                        <Text style={styles.legendCircleTextCompleted}>15</Text>
                    </View>
                    <Text style={styles.legendText}>Completadas</Text>
                    </View>
                </View>
                </Card.Content>
            </Card>
            </ScrollView>
        </View>

        <Portal>
            <Dialog
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}
            style={styles.dialog}
            >
            <Dialog.Title style={styles.dialogTitle}>
                {formatDateLong(selectedDate)}
            </Dialog.Title>

            <Dialog.ScrollArea style={styles.dialogScrollArea}>
                <ScrollView
                style={styles.dialogScroll}
                contentContainerStyle={styles.dialogScrollContent}
                showsVerticalScrollIndicator={false}
                >
                {selectedTasks.length > 0 ? (
                    selectedTasks.map((task) => {
                    const dueMeta = getTaskStatusMeta(task);
                    const isCompleted = !!task.completed;

                    return (
                        <View
                        key={task.id || task.uid || `${task.title}-${task.dateKey}`}
                        style={styles.taskItem}
                        >
                        <View style={styles.taskTop}>
                            <Text style={styles.taskTitle}>
                            {task.title || "Sin título"}
                            </Text>

                            <View
                            style={[
                                styles.smallChip,
                                {
                                backgroundColor: getPrioritySoft(task.priority),
                                borderColor: getPrioritySoft(task.priority),
                                },
                            ]}
                            >
                            <MaterialCommunityIcons
                                name="flag-outline"
                                size={13}
                                color={getPriorityColor(task.priority)}
                            />
                            <Text
                                style={[
                                styles.smallChipText,
                                { color: getPriorityColor(task.priority) },
                                ]}
                            >
                                {getPriorityLabel(task.priority)}
                            </Text>
                            </View>
                        </View>

                        <View style={styles.topTaskChipsRow}>
                            <View
                            style={[
                                styles.smallChip,
                                {
                                backgroundColor: getCompletedSoft(isCompleted),
                                borderColor: getCompletedSoft(isCompleted),
                                },
                            ]}
                            >
                            <MaterialCommunityIcons
                                name={
                                isCompleted
                                    ? "check-circle-outline"
                                    : "clock-outline"
                                }
                                size={13}
                                color={getCompletedColor(isCompleted)}
                            />
                            <Text
                                style={[
                                styles.smallChipText,
                                { color: getCompletedColor(isCompleted) },
                                ]}
                            >
                                {getCompletedLabel(isCompleted)}
                            </Text>
                            </View>

                            <View
                            style={[
                                styles.smallChip,
                                {
                                backgroundColor: dueMeta.soft,
                                borderColor: dueMeta.soft,
                                },
                            ]}
                            >
                            <MaterialCommunityIcons
                                name={dueMeta.icon}
                                size={13}
                                color={dueMeta.color}
                            />
                            <Text
                                style={[
                                styles.smallChipText,
                                { color: dueMeta.color },
                                ]}
                            >
                                {dueMeta.label}
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
                                name="account-check-outline"
                                size={15}
                                color="#667085"
                            />
                            <Text style={styles.modalMetaText}>
                                Asignada a{" "}
                                <Text style={styles.modalMetaStrong}>
                                {task.assignedToName || "Sin asignar"}
                                </Text>
                            </Text>
                            </View>

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
                                Fecha límite{" "}
                                <Text style={styles.modalMetaStrong}>
                                {formatDateShort(task.dateKey)}
                                </Text>
                            </Text>
                            </View>
                        </View>
                        </View>
                    );
                    })
                ) : (
                    <View style={styles.emptyDialogBox}>
                    <MaterialCommunityIcons
                        name="calendar-blank-outline"
                        size={28}
                        color="#98A2B3"
                    />
                    <Text style={styles.emptyDialogTitle}>Sin tareas para este día</Text>
                    <Text style={styles.emptyDialogText}>
                        No hay tareas con fecha límite asignadas para {formatDateShort(selectedDate)}.
                    </Text>
                    </View>
                )}
                </ScrollView>
            </Dialog.ScrollArea>

            <Dialog.Actions style={styles.dialogActions}>
                <Button onPress={() => setDialogVisible(false)}>Cerrar</Button>
            </Dialog.Actions>
            </Dialog>
        </Portal>
        </>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
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
        marginBottom: 18,
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

    calendarCard: {
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        elevation: 3,
        marginBottom: 16,
    },

    calendarContent: {
        paddingTop: 14,
        paddingBottom: 10,
        paddingHorizontal: 10,
    },

    calendar: {
        borderRadius: 18,
    },

    loadingBox: {
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },

    loadingText: {
        color: "#667085",
        fontWeight: "600",
    },

    selectedInfoCard: {
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        elevation: 2,
        marginBottom: 14,
    },

    selectedInfoContent: {
        paddingVertical: 14,
    },

    selectedInfoHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },

    selectedIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "#F6F9F2",
        alignItems: "center",
        justifyContent: "center",
    },

    selectedTextWrap: {
        flex: 1,
    },

    selectedLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 2,
    },

    selectedDateText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#1F2937",
        textTransform: "capitalize",
    },

    selectedSummaryRow: {
        gap: 12,
    },

    selectedSummaryText: {
        color: "#667085",
        lineHeight: 20,
        fontSize: 13.5,
    },

    detailsButton: {
        borderRadius: 14,
        alignSelf: "flex-start",
    },

    detailsButtonContent: {
        height: 42,
    },

    legendCard: {
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E3ECD9",
        elevation: 1,
    },

    legendContent: {
        paddingVertical: 14,
    },

    legendTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#1F2937",
        marginBottom: 10,
    },

    legendRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },

    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    legendCirclePending: {
        width: 28,
        height: 28,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(183,121,31,0.18)",
        borderWidth: 1.5,
        borderColor: "#B7791F",
    },

    legendCircleTextPending: {
        fontSize: 11,
        fontWeight: "800",
        color: "#8A5A00",
    },

    legendCircleCompleted: {
        width: 28,
        height: 28,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(46,125,50,0.14)",
        borderWidth: 1.5,
        borderColor: "#2E7D32",
    },

    legendCircleTextCompleted: {
        fontSize: 11,
        fontWeight: "800",
        color: "#1F6A2B",
    },

    legendText: {
        fontSize: 12.5,
        color: "#667085",
        fontWeight: "600",
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

    dialogScrollArea: {
        paddingHorizontal: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },

    dialogScroll: {
        maxHeight: 430,
    },

    dialogScrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 2,
    },

    dialogActions: {
        paddingTop: 2,
        paddingBottom: 8,
        paddingHorizontal: 12,
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

    taskTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 8,
    },

    taskTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: "800",
        color: "#1F2937",
        lineHeight: 22,
    },

    topTaskChipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
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

    emptyDialogBox: {
        paddingTop: 10,
        paddingBottom: 4,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
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
    },
});