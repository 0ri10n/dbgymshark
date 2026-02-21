import React from 'react';
import './PaginationControls.css';

const clampPage = (value, min, max) => Math.min(Math.max(value, min), max);

const PaginationControls = ({
    page,
    totalPages,
    onPageChange,
    groupSize = 5,
    className = '',
    ariaLabel = 'Paginacion',
}) => {
    const safeTotalPages = Math.max(Number(totalPages) || 1, 1);
    const safePage = clampPage(Number(page) || 1, 1, safeTotalPages);
    const safeGroupSize = Math.max(Number(groupSize) || 5, 1);

    const groupStart = Math.floor((safePage - 1) / safeGroupSize) * safeGroupSize + 1;
    const groupEnd = Math.min(groupStart + safeGroupSize - 1, safeTotalPages);

    const pageNumbers = Array.from(
        { length: groupEnd - groupStart + 1 },
        (_, index) => groupStart + index,
    );

    const goToPage = (nextPage) => {
        const targetPage = clampPage(nextPage, 1, safeTotalPages);
        if (targetPage !== safePage && typeof onPageChange === 'function') {
            onPageChange(targetPage);
        }
    };

    const canGoFirst = safePage > 1;
    const canGoPrevGroup = groupStart > 1;
    const canGoPrevPage = safePage > 1;
    const canGoNextPage = safePage < safeTotalPages;
    const canGoNextGroup = groupEnd < safeTotalPages;
    const canGoLast = safePage < safeTotalPages;

    const classes = ['app-pagination', className].filter(Boolean).join(' ');

    return (
        <nav className={classes} aria-label={ariaLabel}>
            <div className="app-pagination__controls">
                <button
                    type="button"
                    className="app-pagination__btn app-pagination__btn--icon"
                    onClick={() => goToPage(1)}
                    disabled={!canGoFirst}
                    title="Ir a primera pagina"
                    aria-label="Ir a primera pagina"
                >
                    <span aria-hidden="true">|&lt;</span>
                </button>

                <button
                    type="button"
                    className="app-pagination__btn app-pagination__btn--icon"
                    onClick={() => goToPage(groupStart - safeGroupSize)}
                    disabled={!canGoPrevGroup}
                    title="Ir al grupo anterior"
                    aria-label="Ir al grupo anterior"
                >
                    <span aria-hidden="true">&lt;&lt;</span>
                </button>

                <button
                    type="button"
                    className="app-pagination__btn app-pagination__btn--icon"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={!canGoPrevPage}
                    title="Ir a pagina anterior"
                    aria-label="Ir a pagina anterior"
                >
                    <span aria-hidden="true">&lt;</span>
                </button>

                {pageNumbers.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        className={`app-pagination__btn app-pagination__btn--page ${
                            pageNumber === safePage ? 'app-pagination__btn--active' : ''
                        }`}
                        onClick={() => goToPage(pageNumber)}
                        title={`Ir a pagina ${pageNumber}`}
                        aria-label={`Ir a pagina ${pageNumber}`}
                        aria-current={pageNumber === safePage ? 'page' : undefined}
                    >
                        {pageNumber}
                    </button>
                ))}

                <button
                    type="button"
                    className="app-pagination__btn app-pagination__btn--icon"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={!canGoNextPage}
                    title="Ir a pagina siguiente"
                    aria-label="Ir a pagina siguiente"
                >
                    <span aria-hidden="true">&gt;</span>
                </button>

                <button
                    type="button"
                    className="app-pagination__btn app-pagination__btn--icon"
                    onClick={() => goToPage(groupStart + safeGroupSize)}
                    disabled={!canGoNextGroup}
                    title="Ir al grupo siguiente"
                    aria-label="Ir al grupo siguiente"
                >
                    <span aria-hidden="true">&gt;&gt;</span>
                </button>

                <button
                    type="button"
                    className="app-pagination__btn app-pagination__btn--icon"
                    onClick={() => goToPage(safeTotalPages)}
                    disabled={!canGoLast}
                    title="Ir a ultima pagina"
                    aria-label="Ir a ultima pagina"
                >
                    <span aria-hidden="true">&gt;|</span>
                </button>
            </div>

            <span className="app-pagination__status">
                Pagina <strong>{safePage}</strong> de {safeTotalPages}
            </span>
        </nav>
    );
};

export default PaginationControls;
