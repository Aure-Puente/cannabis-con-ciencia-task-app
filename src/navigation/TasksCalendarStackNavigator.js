//Importaciones:
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CalendarScreen from "../screens/CalendarScreen";
import CreateTaskScreen from "../screens/CreateTaskScreen";

//JS:
const Stack = createNativeStackNavigator();

export default function TasksCalendarStackNavigator() {
    return (
        <Stack.Navigator
        screenOptions={{
            headerShown: false,
            headerTitleAlign: "center",
            headerShadowVisible: false,
        }}
        >
        <Stack.Screen name="TareasCalendario" component={CalendarScreen} />
        <Stack.Screen name="Crear tarea" component={CreateTaskScreen} />
        </Stack.Navigator>
    );
}