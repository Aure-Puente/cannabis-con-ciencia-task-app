//Importaciones:
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EditTaskScreen from "../screens/EditTaskScreen";
import TasksScreen from "../screens/TasksScreen";

//JS:
const Stack = createNativeStackNavigator();

export default function TasksStackNavigator() {
    return (
        <Stack.Navigator
        screenOptions={{
            headerTitleAlign: "center",
            headerShadowVisible: false,
        }}
        >
        <Stack.Screen
            name="TasksMain"
            component={TasksScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="Editar tarea"
            component={EditTaskScreen}
            options={{ headerShown: false }}
        />
        </Stack.Navigator>
    );
}