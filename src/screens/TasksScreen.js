//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import {
  deleteTask,
  getAllTasks,
  toggleTaskCompleted,
  updateTasksOrder,
} from "../services/taskService";

//JS:
const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "asignadas_a_mi", label: "Asignadas a mí" },
  { key: "creadas_por_mi", label: "Creadas por mí" },
  { key: "pendientes", label: "Pendientes" },
  { key: "completadas", label: "Completadas" },
  { key: "alta", label: "Alta" },
  { key: "media", label: "Media" },
  { key: "baja", label: "Baja" },
];

function getActiveFilterLabel(activeFilter) {
  return FILTERS.find((filter) => filter.key === activeFilter)?.label || "Todas";
}

export default function TasksScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [activeFilter, setActiveFilter] = useState("todas");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filtersContentVisible, setFiltersContentVisible] = useState(false);

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtersAnimation = useRef(new Animated.Value(0)).current;

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getAllTasks();
      setTasks(Array.isArray(data) ? data.filter(Boolean) : []);
    } catch (error) {
      console.log("LOAD TASKS ERROR:", error);
      Alert.alert("Error", "No se pudieron cargar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadTasks();
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadTasks();
      }
    }, [user?.uid])
  );

  useEffect(() => {
    if (filtersExpanded) {
      setFiltersContentVisible(true);

      Animated.timing(filtersAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(filtersAnimation, {
        toValue: 0,
        duration: 170,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setFiltersContentVisible(false);
        }
      });
    }
  }, [filtersExpanded, filtersAnimation]);

  const handleToggleTask = async (task) => {
    if (!task?.id) return;

    try {
      await toggleTaskCompleted(task.id, !task.completed);
      loadTasks();
    } catch (error) {
      console.log("TOGGLE TASK ERROR:", error);
      Alert.alert("Error", "No se pudo actualizar la tarea.");
    }
  };

  const handleDeleteTask = (task) => {
    if (!task?.id) return;
    setTaskToDelete(task);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete?.id) return;

    try {
      setDeleting(true);
      await deleteTask(taskToDelete.id);
      setDeleteDialogVisible(false);
      setTaskToDelete(null);
      loadTasks();
    } catch (error) {
      console.log("DELETE TASK ERROR:", error);
      Alert.alert("Error", "No se pudo eliminar la tarea.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) return;
    setDeleteDialogVisible(false);
    setTaskToDelete(null);
  };

  const handleEditTask = (task) => {
    navigation.navigate("Editar tarea", { task });
  };

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case "asignadas_a_mi":
        return tasks.filter((task) => task.assignedTo === user?.uid);

      case "creadas_por_mi":
        return tasks.filter((task) => task.createdBy === user?.uid);

      case "pendientes":
        return tasks.filter((task) => !task.completed);

      case "completadas":
        return tasks.filter((task) => task.completed);

      case "alta":
        return tasks.filter((task) => task.priority === "alta");

      case "media":
        return tasks.filter((task) => task.priority === "media");

      case "baja":
        return tasks.filter((task) => task.priority === "baja");

      case "todas":
      default:
        return tasks;
    }
  }, [tasks, activeFilter, user?.uid]);

  const handleDragEnd = async ({ data }) => {
    try {
      setTasks(data);
      setSavingOrder(true);
      await updateTasksOrder(data);
    } catch (error) {
      console.log("UPDATE ORDER ERROR:", error);
      Alert.alert("Error", "No se pudo guardar el nuevo orden.");
      loadTasks();
    } finally {
      setSavingOrder(false);
    }
  };

  const canDrag = activeFilter === "todas";

  const animatedFiltersStyle = {
    opacity: filtersAnimation,
    maxHeight: filtersAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 220],
    }),
    transform: [
      {
        translateY: filtersAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-4, 0],
        }),
      },
    ],
  };

  return (
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

      <View style={styles.topContent}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text variant="headlineMedium" style={styles.title}>
              Tareas
            </Text>

            <Text variant="bodySmall" style={styles.subtitle}>
              Organizá, filtrá y reordená las tareas del equipo
            </Text>
          </View>
        </View>

        <Card style={styles.filtersCard}>
          <Pressable
            onPress={() => setFiltersExpanded((prev) => !prev)}
            style={({ pressed }) => [
              styles.filtersHeader,
              pressed && styles.filtersHeaderPressed,
            ]}
          >
            <View style={styles.filtersHeaderLeft}>
              <View style={styles.filterIconBadge}>
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={15}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.filtersCompactText}>
                Filtros:{" "}
                <Text style={styles.filtersCompactValue}>
                  {getActiveFilterLabel(activeFilter)}
                </Text>
              </Text>
            </View>

            <View style={styles.chevronWrap}>
              <MaterialCommunityIcons
                name={filtersExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#6B7280"
              />
            </View>
          </Pressable>

          {filtersContentVisible && (
            <Animated.View style={[styles.filtersAnimatedWrap, animatedFiltersStyle]}>
              <Divider style={styles.filtersDivider} />
              <Card.Content style={styles.filtersContent}>
                <View style={styles.filtersWrap}>
                  {FILTERS.map((filter) => {
                    const selected = activeFilter === filter.key;

                    return (
                      <Chip
                        key={filter.key}
                        selected={selected}
                        onPress={() => setActiveFilter(filter.key)}
                        compact
                        style={[
                          styles.chip,
                          selected && {
                            backgroundColor: "rgba(78,122,40,0.12)",
                            borderColor: "rgba(78,122,40,0.22)",
                          },
                        ]}
                        textStyle={[
                          styles.chipText,
                          selected && {
                            color: theme.colors.primary,
                            fontWeight: "700",
                          },
                        ]}
                        showSelectedCheck={false}
                      >
                        {filter.label}
                      </Chip>
                    );
                  })}
                </View>
              </Card.Content>
            </Animated.View>
          )}
        </Card>

        {!canDrag && (
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color="#6B7280"
            />
            <Text style={styles.infoBannerText}>
              El orden manual solo está disponible en “Todas”.
            </Text>
          </View>
        )}

        {savingOrder && (
          <View style={styles.infoBanner}>
            <ActivityIndicator size={13} color={theme.colors.primary} />
            <Text style={styles.infoBannerText}>Guardando nuevo orden...</Text>
          </View>
        )}
      </View>

      <View style={styles.listWrapper}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando tareas...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={32}
                color={theme.colors.primary}
              />
            </View>

            <Text variant="titleLarge" style={styles.emptyTitle}>
              No hay tareas para este filtro
            </Text>

            <Text variant="bodyMedium" style={styles.emptyText}>
              Probá cambiar el filtro o crear una nueva tarea.
            </Text>

            <Button
              mode="contained"
              onPress={() => navigation.navigate("Nueva tarea")}
              style={styles.emptyButton}
              buttonColor={theme.colors.primary}
              icon="plus"
            >
              Crear tarea
            </Button>
          </View>
        ) : (
          <DraggableFlatList
            data={filteredTasks}
            keyExtractor={(item, index) => item?.id || String(index)}
            onDragEnd={handleDragEnd}
            activationDistance={10}
            showsVerticalScrollIndicator={false}
            containerStyle={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: 130 + insets.bottom },
            ]}
            renderItem={({ item, drag, isActive }) => (
              <TaskCard
                task={item}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onDrag={canDrag ? drag : undefined}
                isActive={isActive}
              />
            )}
          />
        )}
      </View>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={handleCloseDeleteDialog}
          style={styles.deleteDialog}
        >
          <Dialog.Content style={styles.deleteDialogContent}>
            <View style={styles.deleteIconCircle}>
              <MaterialCommunityIcons name="trash-can-outline" size={28} color="#FFFFFF" />
            </View>

            <Text variant="titleLarge" style={styles.deleteDialogTitle}>
              Eliminar tarea
            </Text>

            <Text variant="bodyMedium" style={styles.deleteDialogText}>
              ¿Querés eliminar{" "}
              <Text style={styles.deleteTaskName}>
                {taskToDelete?.title || "esta tarea"}
              </Text>
              ? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteActionsRow}>
              <Button
                mode="outlined"
                onPress={handleCloseDeleteDialog}
                disabled={deleting}
                style={styles.deleteCancelButton}
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                onPress={handleConfirmDelete}
                loading={deleting}
                disabled={deleting}
                buttonColor="#C62828"
                style={styles.deleteConfirmButton}
              >
                Eliminar
              </Button>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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

  topContent: {
    marginBottom: 8,
  },

  listWrapper: {
    flex: 1,
    minHeight: 0,
  },

  list: {
    flex: 1,
  },

  header: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  headerTextBlock: {
    flex: 1,
  },

  title: {
    fontWeight: "800",
    color: "#234015",
  },

  subtitle: {
    color: "#5E6E57",
    marginTop: 2,
  },

  filtersCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4ECD9",
    elevation: 2,
    overflow: "hidden",
    marginBottom: 8,
  },

  filtersHeader: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  filtersHeaderPressed: {
    opacity: 0.96,
  },

  filtersHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  filterIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F6F9F2",
    alignItems: "center",
    justifyContent: "center",
  },

  filtersCompactText: {
    color: "#475467",
    fontSize: 14,
    fontWeight: "600",
  },

  filtersCompactValue: {
    color: "#1F2937",
    fontWeight: "800",
  },

  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  filtersAnimatedWrap: {
    overflow: "hidden",
  },

  filtersDivider: {
    backgroundColor: "#EEF2E8",
  },

  filtersContent: {
    paddingTop: 12,
    paddingBottom: 10,
  },

  filtersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    marginRight: 0,
    marginBottom: 0,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    borderRadius: 999,
  },

  chipText: {
    fontSize: 12.5,
    color: "#475467",
    fontWeight: "600",
  },

  infoBanner: {
    marginTop: 0,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECEFF3",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#667085",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#667085",
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 50,
  },

  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F6F9F2",
    borderWidth: 1,
    borderColor: "#E4ECD9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    marginBottom: 8,
    fontWeight: "800",
    textAlign: "center",
    color: "#234015",
  },

  emptyText: {
    textAlign: "center",
    color: "#667085",
    lineHeight: 21,
    marginBottom: 18,
    maxWidth: 280,
  },

  emptyButton: {
    borderRadius: 16,
  },

  listContent: {
    paddingTop: 2,
  },

  deleteDialog: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  deleteDialogContent: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },

  deleteIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  deleteDialogTitle: {
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },

  deleteDialogText: {
    textAlign: "center",
    color: "#667085",
    lineHeight: 21,
    marginBottom: 18,
  },

  deleteTaskName: {
    fontWeight: "800",
    color: "#344054",
  },

  deleteActionsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  deleteCancelButton: {
    flex: 1,
    borderRadius: 14,
    borderColor: "#D7DFCF",
  },

  deleteConfirmButton: {
    flex: 1,
    borderRadius: 14,
  },
});