'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TableScrollControlsProps {
  tableContainerId: string;
}

const TableScrollControls: React.FC<TableScrollControlsProps> = ({ tableContainerId }) => {
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(20);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const updateScrollState = useCallback(() => {
    const container = document.getElementById(tableContainerId);
    if (!container) return;

    tableContainerRef.current = container as HTMLDivElement;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // Check if scrolling is needed
    const needsScroll = scrollWidth > clientWidth;
    setShowScrollbar(needsScroll);

    if (needsScroll) {
      // Calculate thumb width as percentage of visible area
      const visibleRatio = clientWidth / scrollWidth;
      const thumbWidthPercent = Math.max(10, visibleRatio * 100); // Minimum 10%
      setThumbWidth(thumbWidthPercent);

      // Calculate scroll position percentage
      const maxScroll = scrollWidth - clientWidth;
      const scrollableRange = 100 - thumbWidthPercent; // Available range for thumb movement
      const percentage = maxScroll > 0 ? (scrollLeft / maxScroll) * scrollableRange : 0;
      setScrollPercentage(Math.min(scrollableRange, Math.max(0, percentage)));

      // Update arrow states
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < maxScroll - 1);
    }
  }, [tableContainerId]);

  useEffect(() => {
    const container = document.getElementById(tableContainerId);
    if (!container) return;

    // Initial check
    updateScrollState();

    // Add scroll listener
    container.addEventListener('scroll', updateScrollState);
    
    // Add resize listener
    window.addEventListener('resize', updateScrollState);

    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(updateScrollState);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer.disconnect();
    };
  }, [tableContainerId, updateScrollState]);

  const scrollTable = (direction: 'left' | 'right') => {
    const container = tableContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.5; // Scroll 50% of visible width
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tableContainerRef.current;
    if (!container || !scrollbarRef.current) return;

    const scrollbarRect = scrollbarRef.current.getBoundingClientRect();
    const clickX = e.clientX - scrollbarRect.left;
    const scrollbarWidth = scrollbarRect.width;
    
    // Calculate where to position the CENTER of the thumb
    const clickPercentage = (clickX / scrollbarWidth) * 100;
    const thumbHalfWidth = thumbWidth / 2;
    
    // Adjust for thumb width so clicking positions the center of thumb at click point
    let targetPercentage = clickPercentage - thumbHalfWidth;
    const maxPercentage = 100 - thumbWidth;
    targetPercentage = Math.max(0, Math.min(maxPercentage, targetPercentage));
    
    // Convert percentage to scroll position
    const maxScroll = container.scrollWidth - container.clientWidth;
    const scrollableRange = 100 - thumbWidth;
    const scrollLeft = scrollableRange > 0 ? (targetPercentage / scrollableRange) * maxScroll : 0;

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  };

  if (!showScrollbar) return null;

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center gap-2">
      <button
        onClick={() => scrollTable('left')}
        disabled={!canScrollLeft}
        className={`p-1.5 rounded transition-colors ${
          canScrollLeft 
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div 
        ref={scrollbarRef}
        className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer relative"
        onClick={handleScrollbarClick}
      >
        <div 
          className="absolute top-0 h-full bg-blue-500 rounded-full transition-all duration-150"
          style={{ 
            width: `${thumbWidth}%`, 
            left: `${scrollPercentage}%` 
          }}
        />
      </div>
      
      <button
        onClick={() => scrollTable('right')}
        disabled={!canScrollRight}
        className={`p-1.5 rounded transition-colors ${
          canScrollRight 
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default TableScrollControls;

