//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { createTask } from "../services/taskService";
import { getAllUsers } from "../services/userService";

//JS:
export default function CreateTaskScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [assignedTo, setAssignedTo] = useState(user?.uid || "");
  const [assignedToName, setAssignedToName] = useState(user?.name || "Yo");
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);

  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setAssignedTo(String(user.uid));
      setAssignedToName(user.name || user.email || "Yo");
    }
  }, [user]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await getAllUsers();
      const safeUsers = Array.isArray(data) ? data : [];
      setUsers(safeUsers);
    } catch (error) {
      console.log("LOAD USERS ERROR:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const selectableUsers = useMemo(() => {
    const normalizedDbUsers = (users || [])
      .map((item) => ({
        uid: String(item?.uid || item?.id || ""),
        name: item?.name || item?.nombre || "",
        email: item?.email || "",
      }))
      .filter((item) => item.uid);

    const selfUser = user?.uid
      ? {
          uid: String(user.uid),
          name: user?.name || "Yo",
          email: user?.email || "",
        }
      : null;

    const merged = selfUser ? [selfUser, ...normalizedDbUsers] : normalizedDbUsers;

    return merged.filter(
      (item, index, arr) =>
        item?.uid &&
        arr.findIndex((u) => String(u?.uid) === String(item.uid)) === index
    );
  }, [users, user]);

  const handleSelectUser = (selectedUser) => {
    setAssignedTo(String(selectedUser.uid));
    setAssignedToName(selectedUser.name || selectedUser.email || "Usuario");
    setAssignDialogVisible(false);
  };

  const normalizeDateToEndOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const finalDate = normalizeDateToEndOfDay(selectedDate);
      setDueDate(finalDate);
    }
  };

  const handleConfirmIOSDate = () => {
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setDueDate(null);
  };

  const formatDateLabel = (date) => {
    if (!date) return "Seleccionar fecha";

    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert("Atención", "El título es obligatorio.");
      return;
    }

    if (!assignedTo) {
      Alert.alert("Atención", "Elegí a quién asignar la tarea.");
      return;
    }

    try {
      setSaving(true);

      await createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        createdBy: user?.uid ? String(user.uid) : "",
        createdByName: user?.name || "Usuario",
        assignedTo: String(assignedTo),
        assignedToName,
        dueDate: dueDate ? dueDate.toISOString() : null,
        dueDateTimestamp: dueDate ? dueDate.getTime() : null,
        hasDueDate: !!dueDate,
      });

      setTitle("");
      setDescription("");
      setPriority("media");
      setAssignedTo(user?.uid ? String(user.uid) : "");
      setAssignedToName(user?.name || user?.email || "Yo");
      setDueDate(null);

      setSuccessVisible(true);
    } catch (error) {
      console.log("CREATE TASK ERROR:", error);
      Alert.alert("Error", "No se pudo crear la tarea.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessVisible(false);
    navigation.navigate("Tareas");
  };

  const prioritySummary =
    priority === "baja"
      ? "Baja prioridad"
      : priority === "media"
      ? "Prioridad media"
      : "Alta prioridad";

  return (
    <>
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F8F1" />

        <View style={styles.backgroundShapeTop} />
        <View style={styles.backgroundShapeBottom} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 8, paddingBottom: 28 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text variant="headlineMedium" style={styles.title}>
                Nueva tarea
              </Text>

              <Text variant="bodyMedium" style={styles.subtitle}>
                Creá una tarea nueva y asignala rápidamente al responsable indicado.
              </Text>
            </View>

            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <TextInput
                  label="Título"
                  mode="outlined"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  contentStyle={styles.inputContent}
                  left={<TextInput.Icon icon="text-box-outline" />}
                  theme={{
                    colors: {
                      primary: "#4E7A28",
                      outline: "#C9D8BF",
                      background: "#FFFFFF",
                    },
                  }}
                />

                <TextInput
                  label="Descripción"
                  mode="outlined"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  contentStyle={[styles.inputContent, styles.textAreaContent]}
                  left={<TextInput.Icon icon="file-document-outline" />}
                  theme={{
                    colors: {
                      primary: "#4E7A28",
                      outline: "#C9D8BF",
                      background: "#FFFFFF",
                    },
                  }}
                />

                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconWrap}>
                      <MaterialCommunityIcons
                        name="flag-outline"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text variant="titleSmall" style={styles.label}>
                      Prioridad
                    </Text>
                  </View>

                  <Text style={styles.sectionHint}>{prioritySummary}</Text>
                </View>

                <SegmentedButtons
                  value={priority}
                  onValueChange={setPriority}
                  style={styles.segmented}
                  buttons={[
                    {
                      value: "baja",
                      label: "Baja",
                      checkedColor: "#FFFFFF",
                      uncheckedColor: "#256C35",
                      style:
                        priority === "baja"
                          ? styles.segmentLow
                          : styles.segmentDefault,
                    },
                    {
                      value: "media",
                      label: "Media",
                      checkedColor: "#FFFFFF",
                      uncheckedColor: "#8A6A10",
                      style:
                        priority === "media"
                          ? styles.segmentMedium
                          : styles.segmentDefault,
                    },
                    {
                      value: "alta",
                      label: "Alta",
                      checkedColor: "#FFFFFF",
                      uncheckedColor: "#7A1F1F",
                      style:
                        priority === "alta"
                          ? styles.segmentHigh
                          : styles.segmentDefault,
                    },
                  ]}
                />

                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconWrap}>
                      <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text variant="titleSmall" style={styles.label}>
                      Fecha límite
                    </Text>
                  </View>

                  <Text style={styles.sectionHint}>
                    Podés elegir una fecha para mostrarla luego en el calendario.
                  </Text>
                </View>

                <Pressable onPress={handleOpenDatePicker} style={styles.assignTrigger}>
                  <View style={styles.assignLeft}>
                    <View style={styles.assignAvatar}>
                      <MaterialCommunityIcons
                        name="calendar-outline"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.assignTextWrap}>
                      <Text style={styles.assignLabel}>Vencimiento</Text>
                      <Text style={styles.assignValue}>
                        {dueDate ? formatDateLabel(dueDate) : "Seleccionar fecha"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chevronBadge}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#6B7280"
                    />
                  </View>
                </Pressable>

                {dueDate ? (
                  <View style={styles.dateActionsRow}>
                    <Button
                      mode="text"
                      onPress={handleOpenDatePicker}
                      textColor={theme.colors.primary}
                      icon="pencil-outline"
                      compact
                    >
                      Cambiar
                    </Button>

                    <Button
                      mode="text"
                      onPress={handleClearDate}
                      textColor="#B3261E"
                      icon="close-circle-outline"
                      compact
                    >
                      Quitar
                    </Button>
                  </View>
                ) : null}

                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconWrap}>
                      <MaterialCommunityIcons
                        name="account-check-outline"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text variant="titleSmall" style={styles.label}>
                      Asignar a
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    if (!usersLoading) {
                      setAssignDialogVisible(true);
                    }
                  }}
                  style={styles.assignTrigger}
                >
                  <View style={styles.assignLeft}>
                    <View style={styles.assignAvatar}>
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.assignTextWrap}>
                      <Text style={styles.assignLabel}>Responsable</Text>
                      <Text style={styles.assignValue}>
                        {usersLoading
                          ? "Cargando usuarios..."
                          : assignedToName || "Seleccionar"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chevronBadge}>
                    {usersLoading ? (
                      <ActivityIndicator size={16} color={theme.colors.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color="#6B7280"
                      />
                    )}
                  </View>
                </Pressable>

                <View style={styles.infoBox}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>
                    Podés dejarla asignada a vos o seleccionar otra persona del equipo.
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleCreateTask}
                  loading={saving}
                  disabled={saving}
                  style={styles.saveButton}
                  contentStyle={styles.saveButtonContent}
                  labelStyle={styles.saveButtonLabel}
                  buttonColor={theme.colors.primary}
                  icon="plus"
                >
                  Guardar tarea
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {showDatePicker && Platform.OS === "android" ? (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
          accentColor="#4E7A28"
        />
      ) : null}

      <Portal>
        <Dialog
          visible={showDatePicker && Platform.OS === "ios"}
          onDismiss={() => setShowDatePicker(false)}
          style={styles.dateDialog}
        >
          <Dialog.Title style={styles.selectDialogTitle}>
            Seleccionar fecha límite
          </Dialog.Title>

          <Dialog.Content>
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={handleDateChange}
              style={styles.iosDatePicker}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowDatePicker(false)}>Cancelar</Button>
            <Button onPress={handleConfirmIOSDate}>Aceptar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={assignDialogVisible}
          onDismiss={() => setAssignDialogVisible(false)}
          style={styles.selectDialog}
        >
          <Dialog.Title style={styles.selectDialogTitle}>
            Seleccionar responsable
          </Dialog.Title>

          <Dialog.ScrollArea style={styles.selectDialogScrollArea}>
            <ScrollView
              style={styles.selectScroll}
              contentContainerStyle={styles.selectScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectableUsers.length > 0 ? (
                selectableUsers.map((item) => {
                  const isSelected = String(item.uid) === String(assignedTo);

                  return (
                    <Pressable
                      key={item.uid}
                      onPress={() => handleSelectUser(item)}
                      style={[
                        styles.userOption,
                        isSelected && styles.userOptionSelected,
                      ]}
                    >
                      <View style={styles.userOptionLeft}>
                        <View
                          style={[
                            styles.userAvatar,
                            isSelected && styles.userAvatarSelected,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isSelected ? "check" : "account-outline"}
                            size={18}
                            color={isSelected ? "#FFFFFF" : theme.colors.primary}
                          />
                        </View>

                        <View style={styles.userTextWrap}>
                          <Text style={styles.userName}>
                            {String(item.uid) === String(user?.uid)
                              ? `${item.name || item.email || "Yo"} (Yo)`
                              : item.name || item.email || "Usuario"}
                          </Text>

                          {!!item.email && (
                            <Text style={styles.userEmail}>{item.email}</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyUsersBox}>
                  <Text style={styles.emptyUsersText}>
                    No hay usuarios disponibles.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={() => setAssignDialogVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={successVisible}
          onDismiss={handleCloseSuccess}
          style={styles.successDialog}
        >
          <Dialog.Content style={styles.successDialogContent}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={30} color="#FFFFFF" />
            </View>

            <Text variant="titleLarge" style={styles.successTitle}>
              Tarea creada
            </Text>

            <Text variant="bodyMedium" style={styles.successText}>
              La tarea se guardó correctamente y ya está lista para el equipo.
            </Text>

            <Button
              mode="contained"
              onPress={handleCloseSuccess}
              style={styles.successButton}
              contentStyle={styles.successButtonContent}
              buttonColor={theme.colors.primary}
            >
              Continuar
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: "#F4F8F1",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },

  backgroundShapeTop: {
    position: "absolute",
    top: -120,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(78, 122, 40, 0.08)",
  },

  backgroundShapeBottom: {
    position: "absolute",
    bottom: -100,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(78, 122, 40, 0.06)",
  },

  headerBlock: {
    marginBottom: 16,
  },

  title: {
    color: "#234015",
    fontWeight: "800",
    marginBottom: 8,
  },

  subtitle: {
    color: "#5E6E57",
    lineHeight: 21,
    maxWidth: 320,
  },

  card: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3ECD9",
    elevation: 3,
  },

  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },

  input: {
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
  },

  inputOutline: {
    borderRadius: 16,
  },

  inputContent: {
    paddingVertical: 4,
  },

  textAreaContent: {
    minHeight: 92,
    textAlignVertical: "top",
  },

  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#F6F9F2",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontWeight: "800",
    color: "#1F2937",
  },

  sectionHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },

  segmented: {
    marginBottom: 18,
  },

  segmentDefault: {
    borderColor: "#D8E0CF",
    backgroundColor: "#FFFFFF",
  },

  segmentHigh: {
    backgroundColor: "#C62828",
    borderColor: "#C62828",
  },

  segmentMedium: {
    backgroundColor: "#B7791F",
    borderColor: "#B7791F",
  },

  segmentLow: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },

  assignTrigger: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D7E0CE",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  assignLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },

  assignAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F6F9F2",
    alignItems: "center",
    justifyContent: "center",
  },

  assignTextWrap: {
    flex: 1,
  },

  assignLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },

  assignValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },

  chevronBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  dateActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    marginTop: -2,
  },

  infoBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#FAFBFA",
    borderWidth: 1,
    borderColor: "#ECEFF3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 18,
  },

  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: "#667085",
    lineHeight: 18,
  },

  saveButton: {
    borderRadius: 16,
  },

  saveButtonContent: {
    height: 52,
  },

  saveButtonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },

  dateDialog: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  iosDatePicker: {
    alignSelf: "center",
  },

  selectDialog: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },

  selectDialogTitle: {
    color: "#234015",
    fontWeight: "800",
  },

  selectDialogScrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },

  selectScroll: {
    maxHeight: 320,
  },

  selectScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  userOption: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EDE1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    justifyContent: "center",
  },

  userOptionSelected: {
    borderColor: "#4E7A28",
    backgroundColor: "#F7FBF3",
  },

  userOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F6F9F2",
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatarSelected: {
    backgroundColor: "#4E7A28",
  },

  userTextWrap: {
    flex: 1,
  },

  userName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },

  userEmail: {
    fontSize: 12.5,
    color: "#6B7280",
  },

  emptyUsersBox: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  emptyUsersText: {
    fontSize: 13,
    color: "#6B7280",
  },

  successDialog: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },

  successDialogContent: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
  },

  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#4E7A28",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  successTitle: {
    fontWeight: "800",
    color: "#234015",
    marginBottom: 8,
    textAlign: "center",
  },

  successText: {
    textAlign: "center",
    color: "#667085",
    lineHeight: 21,
    marginBottom: 18,
  },

  successButton: {
    borderRadius: 14,
    alignSelf: "stretch",
    marginBottom: 15,
  },

  successButtonContent: {
    height: 48,
  },
});