//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, FAB, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getAllTasks } from "../services/taskService";

//JS:
function StatBigCard({ icon, label, value, iconColor }) {
  return (
    <View style={styles.statCardWrap}>
      <Card style={styles.statBigCard}>
        <Card.Content style={styles.statBigContent}>
          <View style={styles.statBigIconWrap}>
            <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
          </View>

          <Text style={styles.statBigNumber}>{value}</Text>
          <Text style={styles.statBigLabel}>{label}</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllTasks();
      setTasks(Array.isArray(data) ? data.filter(Boolean) : []);
    } catch (error) {
      console.log("LOAD TASKS HOME ERROR:", error);
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

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.filter((task) => !task.completed).length;
    const assignedToMe = tasks.filter(
      (task) => String(task.assignedTo) === String(user?.uid)
    ).length;

    return { total, completed, pending, assignedToMe };
  }, [tasks, user?.uid]);

  const displayName = user?.name?.trim()?.split(" ")[0] || "equipo";

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 140 + insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text variant="headlineMedium" style={styles.title}>
              Hola, {displayName}
            </Text>

            <View style={styles.loadingSlot}>
              {loading ? (
                <View style={styles.refreshBadge}>
                  <ActivityIndicator size={12} color={theme.colors.primary} />
                  <Text style={styles.refreshText}>Actualizando</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Bienvenido. Acá podés ver el estado general de las tareas del
            equipo.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen general</Text>
          <Text style={styles.sectionSubtitle}>Estado actual del trabajo</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBigCard
            icon="format-list-bulleted-square"
            label="Totales"
            value={stats.total}
            iconColor="#4E7A28"
          />

          <StatBigCard
            icon="progress-clock"
            label="Pendientes"
            value={stats.pending}
            iconColor="#B7791F"
          />

          <StatBigCard
            icon="check-circle-outline"
            label="Completadas"
            value={stats.completed}
            iconColor="#2E7D32"
          />

          <StatBigCard
            icon="account-check-outline"
            label="Para mí"
            value={stats.assignedToMe}
            iconColor="#2563EB"
          />
        </View>

        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.buttonsWrap}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Nueva tarea")}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            buttonColor={theme.colors.primary}
            icon="plus"
          >
            Nueva tarea
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Tareas")}
            style={styles.secondaryButton}
            contentStyle={styles.secondaryButtonContent}
            textColor={theme.colors.primary}
            icon="format-list-checks"
          >
            Ver tareas
          </Button>
        </View>
      </ScrollView>

      <FAB
        icon="calendar-month-outline"
        onPress={() => navigation.navigate("Calendario")}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 55,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#FFFFFF"
        customSize={58}
      />
    </View>
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

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  loadingSlot: {
    minWidth: 98,
    alignItems: "flex-end",
  },

  refreshBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE6D3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  refreshText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4E7A28",
  },

  title: {
    fontWeight: "800",
    color: "#234015",
    flexShrink: 1,
  },

  subtitle: {
    color: "#5E6E57",
    lineHeight: 21,
    maxWidth: 330,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#667085",
    fontSize: 12.5,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 20,
  },

  statCardWrap: {
    width: "48.5%",
  },

  statBigCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  statBigContent: {
    paddingVertical: 13,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  statBigIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "#F6F9F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statBigNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },

  statBigLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#667085",
  },

  logoSection: {
    alignItems: "center",
    marginBottom: 22,
    marginTop: 2,
  },

  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F7FAF4",
    borderWidth: 1,
    borderColor: "#EEF3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 112,
    height: 112,
  },

  buttonsWrap: {
    gap: 12,
  },

  primaryButton: {
    borderRadius: 16,
  },

  primaryButtonContent: {
    height: 50,
  },

  secondaryButton: {
    borderRadius: 16,
    borderColor: "#DCE6D3",
  },

  secondaryButtonContent: {
    height: 50,
  },

  fab: {
    position: "absolute",
    right: 16,
    borderRadius: 18,
    elevation: 6,
  },
});