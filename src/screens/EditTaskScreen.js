//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
  Menu,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { updateTask } from "../services/taskService";
import { getAllUsers } from "../services/userService";

//JS:
export default function EditTaskScreen({ navigation, route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const task = route?.params?.task;

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "media");
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || user?.uid || "");
  const [assignedToName, setAssignedToName] = useState(
    task?.assignedToName || user?.name || "Yo"
  );
  const [menuVisible, setMenuVisible] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("LOAD USERS ERROR:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const selectableUsers = useMemo(() => {
    const selfUser = {
      uid: user?.uid,
      name: user?.name || "Yo",
      email: user?.email || "",
    };

    const merged = [selfUser, ...(users || [])];

    return merged.filter(
      (item, index, arr) =>
        item?.uid &&
        arr.findIndex((u) => u?.uid === item.uid) === index
    );
  }, [users, user?.uid, user?.name, user?.email]);

  const handleSelectUser = (selectedUser) => {
    setAssignedTo(selectedUser.uid);
    setAssignedToName(selectedUser.name || selectedUser.email || "Usuario");
    setMenuVisible(false);
  };

  const handleSave = async () => {
    if (!task?.id) {
      Alert.alert("Error", "No se encontró la tarea.");
      return;
    }

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

      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTo,
        assignedToName,
      });

      setSuccessVisible(true);
    } catch (error) {
      console.log("UPDATE TASK ERROR:", error);
      Alert.alert("Error", "No se pudo actualizar la tarea.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessVisible(false);
    navigation.goBack();
  };

  const prioritySummary =
    priority === "alta"
      ? "Alta prioridad"
      : priority === "media"
      ? "Prioridad media"
      : "Baja prioridad";

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
                Editar tarea
              </Text>

              <Text variant="bodyMedium" style={styles.subtitle}>
                Actualizá la información de la tarea y dejala lista para el equipo.
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
                      value: "alta",
                      label: "Alta",
                      checkedColor: "#FFFFFF",
                      uncheckedColor: "#7A1F1F",
                      style: priority === "alta" ? styles.segmentHigh : styles.segmentDefault,
                    },
                    {
                      value: "media",
                      label: "Media",
                      checkedColor: "#FFFFFF",
                      uncheckedColor: "#8A6A10",
                      style: priority === "media" ? styles.segmentMedium : styles.segmentDefault,
                    },
                    {
                      value: "baja",
                      label: "Baja",
                      checkedColor: "#FFFFFF",
                      uncheckedColor: "#256C35",
                      style: priority === "baja" ? styles.segmentLow : styles.segmentDefault,
                    },
                  ]}
                />

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

                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchorPosition="bottom"
                  contentStyle={styles.menuContent}
                  anchor={
                    <Pressable onPress={() => setMenuVisible(true)} style={styles.assignTrigger}>
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
                            {usersLoading ? "Cargando usuarios..." : assignedToName || "Seleccionar"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.chevronBadge}>
                        {usersLoading ? (
                          <ActivityIndicator size={16} color={theme.colors.primary} />
                        ) : (
                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={20}
                            color="#6B7280"
                          />
                        )}
                      </View>
                    </Pressable>
                  }
                >
                  {selectableUsers.map((item) => (
                    <Menu.Item
                      key={item.uid}
                      onPress={() => handleSelectUser(item)}
                      title={
                        item.uid === user?.uid
                          ? `${item.name || "Yo"} (Yo)`
                          : item.name || item.email || "Usuario"
                      }
                      leadingIcon={
                        item.uid === assignedTo ? "check-circle" : "account-outline"
                      }
                    />
                  ))}
                </Menu>

                <View style={styles.infoBox}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.infoText}>
                    Revisá bien el responsable y la prioridad antes de guardar los cambios.
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  style={styles.saveButton}
                  contentStyle={styles.saveButtonContent}
                  labelStyle={styles.saveButtonLabel}
                  buttonColor={theme.colors.primary}
                  icon="content-save-outline"
                >
                  Guardar cambios
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Portal>
        <Dialog visible={successVisible} onDismiss={handleCloseSuccess} style={styles.successDialog}>
          <Dialog.Content style={styles.successDialogContent}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={30} color="#FFFFFF" />
            </View>

            <Text variant="titleLarge" style={styles.successTitle}>
              Tarea actualizada
            </Text>

            <Text variant="bodyMedium" style={styles.successText}>
              Los cambios se guardaron correctamente.
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
    marginBottom: 16,
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

  menuContent: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 15
  },

  successButtonContent: {
    height: 48,
  },
});