export const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '-';

    // Check if starts with YYYY-MM-DD (e.g. "2024-12-31", "2024-12-31 10:30", "2024-12-31T10:30")
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
    if (match) {
        const [_, year, month, day, rest] = match;
        // Return DD/MM/YYYY + original time part if exists
        return `${day}/${month}/${year}${rest}`;
    }

    return dateStr;
};
