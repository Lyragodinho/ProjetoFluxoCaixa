export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export const generateCsv = (data: (string | number)[][], filename: string): void => {
    const csvContent = data.map(e => e.join(",")).join("\n");
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8,');
};

export const parseCsv = (csvText: string): string[][] => {
    const rows = csvText.trim().split('\n');
    return rows.map(row => row.split(',').map(cell => cell.trim()));
};

export const calculateNextBusinessDay = (dateString: string): Date => {
    // Handles 'YYYY-MM-DD' and avoids timezone issues by setting time to noon UTC.
    const date = new Date(`${dateString}T12:00:00Z`);
    
    // Move to the day AFTER the due date
    date.setUTCDate(date.getUTCDate() + 1);

    // If it lands on Saturday (6), move forward 2 days to Monday
    if (date.getUTCDay() === 6) {
        date.setUTCDate(date.getUTCDate() + 2);
    } 
    // If it lands on Sunday (0), move forward 1 day to Monday
    else if (date.getUTCDay() === 0) {
        date.setUTCDate(date.getUTCDate() + 1);
    }
    
    return date;
};

// FIX: Export a dateReplacer function for JSON.stringify to handle Date objects.
export const dateReplacer = (key: string, value: any) => {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return value;
};
