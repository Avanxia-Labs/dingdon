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

    // Paleta de colores
    const containerBg = theme === 'dark' ? 'bg-[#212E36]' : 'bg-[#FFFFFF]';
    const borderColor = theme === 'dark' ? 'border-[#2a3b47]' : 'border-[#EFF3F5]';
    const textPrimary = theme === 'dark' ? 'text-[#EFF3F5]' : 'text-[#2A3B47]';
    const textSecondary = theme === 'dark' ? 'text-[#C8CDD0]' : 'text-[#697477]';
    const selectBg = theme === 'dark' ? 'bg-[#192229] border-[#2a3b47] text-[#EFF3F5]' : 'bg-[#FFFFFF] border-[#EFF3F5] text-[#2A3B47]';
    const buttonHover = theme === 'dark' ? 'hover:bg-[#2a3b47]' : 'hover:bg-[#EFF3F5]';
    const currentPageBg = theme === 'dark' ? 'bg-[#192229]' : 'bg-[#EFF3F5]';

    // 2. Lógica interna para calcular el estado
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const canGoBack = currentPage > 1;
    const canGoForward = currentPage < totalPages;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) {
        return null; // No mostrar nada si no hay elementos
    }

    return (
        <div className={`border-t rounded-b-lg ${containerBg} ${borderColor}`}>
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
                        className={`text-xs border rounded px-2 py-1 ${selectBg}`}
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>

                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!canGoBack}
                            className={`w-7 h-7 flex items-center justify-center border rounded disabled:opacity-50 ${borderColor} ${textPrimary} ${buttonHover}`}
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className={`px-2 py-1 text-xs rounded ${currentPageBg} ${textPrimary}`}>
                            {currentPage}/{totalPages}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!canGoForward}
                            className={`w-7 h-7 flex items-center justify-center border rounded disabled:opacity-50 ${borderColor} ${textPrimary} ${buttonHover}`}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between px-4 py-3">
                <div className={`text-sm ${textSecondary}`}>
                    Showing <b className={textPrimary}>{startItem}</b> to <b className={textPrimary}>{endItem}</b> of <b className={textPrimary}>{totalItems}</b> results
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className={`text-sm border rounded px-2 py-1 ${selectBg}`}
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>

                    <div className={`flex border rounded ${borderColor}`}>
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!canGoBack}
                            className={`px-2 py-1 disabled:opacity-50 border-r ${borderColor} ${textPrimary} ${buttonHover}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className={`px-3 py-1 text-sm ${currentPageBg} ${textPrimary}`}>
                            Page {currentPage} of {totalPages}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!canGoForward}
                            className={`px-2 py-1 disabled:opacity-50 border-l ${borderColor} ${textPrimary} ${buttonHover}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};