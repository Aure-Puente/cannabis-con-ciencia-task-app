//Importaciones:
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StatusBar, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

//JS:
export default function TaskHistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8F1" />

      <View style={styles.backgroundShapeTop} />
      <View style={styles.backgroundShapeBottom} />

      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Historial
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Consultá las tareas que ya fueron completadas por el equipo.
        </Text>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={42}
                color={theme.colors.primary}
              />
            </View>

            <Text variant="titleLarge" style={styles.cardTitle}>
              Sección en construcción
            </Text>

            <Text variant="bodyMedium" style={styles.cardText}>
              Próximamente vas a poder ver el historial completo de tareas finalizadas.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8F1",
  },

  container: {
    flex: 1,
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

  title: {
    color: "#234015",
    fontWeight: "800",
    marginBottom: 8,
  },

  subtitle: {
    color: "#5E6E57",
    lineHeight: 21,
    maxWidth: 330,
    marginBottom: 18,
  },

  card: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3ECD9",
    elevation: 3,
  },

  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },

  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#F6F9F2",
    borderWidth: 1,
    borderColor: "#E3ECD9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  cardTitle: {
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },

  cardText: {
    color: "#667085",
    textAlign: "center",
    lineHeight: 21,
  },
});