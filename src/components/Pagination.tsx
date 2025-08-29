// app/components/Pagination.tsx
'use client';

import { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="bg-white border-t border-gray-200 rounded-b-lg">
            {/* Mobile */}
            <div className="sm:hidden px-3 py-3 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                    {startItem}-{endItem} of {totalItems}
                </div>
                
                <div className="flex items-center gap-2">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="text-xs border rounded px-2 py-1"
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!canGoBack}
                            className="w-7 h-7 flex items-center justify-center border rounded disabled:opacity-50"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <div className="px-2 py-1 text-xs bg-gray-100 rounded">
                            {currentPage}/{totalPages}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!canGoForward}
                            className="w-7 h-7 flex items-center justify-center border rounded disabled:opacity-50"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between px-4 py-3">
                <div className="text-sm text-gray-700">
                    Showing <b>{startItem}</b> to <b>{endItem}</b> of <b>{totalItems}</b> results
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="text-sm border rounded px-2 py-1"
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>

                    <div className="flex border rounded">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={!canGoBack}
                            className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50 border-r"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1 text-sm bg-gray-50">
                            Page {currentPage} of {totalPages}
                        </div>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={!canGoForward}
                            className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50 border-l"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};