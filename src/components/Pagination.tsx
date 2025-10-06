// app/components/Pagination.tsx
'use client';

import { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

// 1. Definimos el "contrato": qué información necesita el componente
interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (limit: number) => void;
}

export const Pagination: FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}) => {
    const { theme } = useTheme();
    // 2. Lógica interna para calcular el estado
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const canGoBack = currentPage > 1;
    const canGoForward = currentPage < totalPages;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Paleta de colores para modo claro y oscuro
    const bgColor = theme === 'dark' ? 'bg-[#212E36]' : 'bg-white';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-gray-200';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-gray-700';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-gray-600';
    const selectBg = theme === 'dark' ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-700';
    const buttonBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50';
    const buttonBorder = theme === 'dark' ? 'border-gray-500' : 'border-gray-300';
    const pageInfoBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
    const disabledOpacity = 'disabled:opacity-50 disabled:cursor-not-allowed';

    if (totalItems === 0) {
        return null; // No mostrar nada si no hay elementos
    }

    return (
        <div className={`${bgColor} border-t ${borderColor} rounded-b-lg`}>
            {/* Mobile */}
            <div className="sm:hidden px-3 py-3 flex items-center justify-between">
                <div className={`text-xs ${textSecondary}`}>
                    {startItem}-{endItem} of {totalItems}
                </div>
                
                <div className="flex items-center gap-2">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className={`text-xs border rounded px-2 py-1 ${selectBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!canGoBack}
                            className={`w-7 h-7 flex items-center justify-center border rounded transition-colors ${buttonBg} ${buttonBorder} ${disabledOpacity} ${textPrimary}`}
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className={`px-2 py-1 text-xs rounded ${pageInfoBg} ${textPrimary}`}>
                            {currentPage}/{totalPages}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!canGoForward}
                            className={`w-7 h-7 flex items-center justify-center border rounded transition-colors ${buttonBg} ${buttonBorder} ${disabledOpacity} ${textPrimary}`}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between px-4 py-3">
                <div className={`text-sm ${textPrimary}`}>
                    Showing <b>{startItem}</b> to <b>{endItem}</b> of <b>{totalItems}</b> results
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className={`text-sm border rounded px-2 py-1 ${selectBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>

                    <div className={`flex border rounded ${buttonBorder}`}>
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!canGoBack}
                            className={`px-2 py-1 transition-colors ${buttonBg} ${disabledOpacity} border-r ${buttonBorder} ${textPrimary}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className={`px-3 py-1 text-sm ${pageInfoBg} ${textPrimary}`}>
                            Page {currentPage} of {totalPages}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!canGoForward}
                            className={`px-2 py-1 transition-colors ${buttonBg} ${disabledOpacity} border-l ${buttonBorder} ${textPrimary}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};