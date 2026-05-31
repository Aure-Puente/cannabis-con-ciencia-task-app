//JS:
export const NOTE_CATEGORIES = [
    {
        key: "administracion",
        label: "Administración",
        color: "#C62828",
        soft: "rgba(198, 40, 40, 0.11)",
        border: "rgba(198, 40, 40, 0.22)",
        icon: "briefcase-outline",
    },
    {
        key: "produccion",
        label: "Producción",
        color: "#2E7D32",
        soft: "rgba(46, 125, 50, 0.12)",
        border: "rgba(46, 125, 50, 0.22)",
        icon: "sprout",
    },
    {
        key: "redes",
        label: "Redes",
        color: "#7C3AED",
        soft: "rgba(124, 58, 237, 0.12)",
        border: "rgba(124, 58, 237, 0.22)",
        icon: "access-point-network",
    },
    {
        key: "investigacion",
        label: "Investigación",
        color: "#2563EB",
        soft: "rgba(37, 99, 235, 0.12)",
        border: "rgba(37, 99, 235, 0.22)",
        icon: "flask-outline",
    },
    {
        key: "medicinal",
        label: "Medicinal",
        color: "#D99A00",
        soft: "rgba(217, 154, 0, 0.13)",
        border: "rgba(217, 154, 0, 0.24)",
        icon: "medical-bag",
    },
];

export function getNoteCategoryByKey(categoryKey) {
    return (
        NOTE_CATEGORIES.find((category) => category.key === categoryKey) ||
        NOTE_CATEGORIES[0]
    );
}