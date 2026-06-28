import React from 'react';

const DataTable = ({ columns, data, rowKey = 'id' }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-gray-100">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((item, index) => (
                        <tr key={item[rowKey] ?? index} className="hover:bg-blue-50/30 transition-colors">
                            {columns.map((column) => (
                                <td key={column.key} className="px-6 py-4 text-sm text-gray-700">
                                    {column.render ? column.render(item) : item[column.key] ?? '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
