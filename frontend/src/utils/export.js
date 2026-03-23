/**
 * Exports data to CSV and triggers a browser download.
 * @param {Array} data - Array of objects to export.
 * @param {string} filename - Desired name for the downloaded file.
 */
export const exportToCsv = (data, filename = 'export.csv') => {
    if (!data || !data.length) {
        throw new Error('No data available for export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(fieldName => {
                const value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
                // Escape quotes and wrap in quotes for CSV safety
                const escaped = ('' + value).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
