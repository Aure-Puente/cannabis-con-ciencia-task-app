//Importaciones:
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import AppTabs from "./AppTabs";
import AuthNavigator from "./AuthNavigator";

//JS:
export default function RootNavigator() {
    const { user, authLoading } = useAuth();
    const { colors } = useTheme();

    if (authLoading) {
        return (
        <View
            style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
            }}
        >
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
        );
    }

    return user ? <AppTabs /> : <AuthNavigator />;
    }