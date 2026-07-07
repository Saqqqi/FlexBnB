'use client';

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const categories = [
  { name: "Top Cities", icon: "/Top_City_Icon.jpg" },
  { name: "Amazing Views", icon: "/Amazing_views_icon.jpg" },
  { name: "Top Of The World", icon: "/Top_Of_The_World_Icon.jpg" },
  { name: "Artics", icon: "/Artic_Icon.jpg" },
  { name: "Rooms", icon: "/Rooms_Icon.jpg" },
  { name: "Mansions", icon: "/Mansion_Icon.jpg" },
  { name: "Trending", icon: "/Trending_Icon.jpg" },
  { name: "BeachFront", icon: "/BeachFront_Icon.jpg" },
  { name: "Camping", icon: "/Camping_Icon.jpg" },
  { name: "Farms", icon: "/Farms_Icon.jpg" },
  { name: "Domes", icon: "/Domes_Icon.jpg" },
  // Extra discovery categories
  // Reuse existing icons from /public so images always load
  { name: "Lakefront", icon: "/BeachFront_Icon.jpg" },
  { name: "Countryside", icon: "/Farms_Icon.jpg" },
  { name: "Tiny Homes", icon: "/Rooms_Icon.jpg" },
  { name: "Castles", icon: "/Castle_Icon.jpg" },
  { name: "Islands", icon: "/BeachFront_Icon.jpg" },
  { name: "Boats", icon: "/BeachFront_Icon.jpg" },
  { name: "Ski Resorts", icon: "/Artic_Icon.jpg" },
  { name: "Desert", icon: "/Camping_Icon.jpg" },
  { name: "National Parks", icon: "/Farms_Icon.jpg" },
];

const Categories = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative flex items-center gap-2 sm:gap-4 pb-4 border-b border-gray-100">
      {/* Left Scroll Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="hidden sm:flex absolute left-0 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Categories Container */}
      <div
        ref={scrollRef}
        onScroll={checkScrollPosition}
        className="flex items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 overflow-x-auto scrollbar-hide scroll-smooth px-1 sm:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(category.name)}
            className={`
              flex-shrink-0 pb-3 flex flex-col items-center gap-2 
              border-b-2 transition-all duration-200
              ${activeCategory === category.name 
                ? 'border-gray-800 opacity-100' 
                : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
              }
            `}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
              <Image
                src={category.icon}
                alt={`${category.name} icon`}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap text-gray-700">
              {category.name}
            </span>
          </button>
        ))}
      </div>

      {/* Right Scroll Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="hidden sm:flex absolute right-24 lg:right-28 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Filters Button */}
      <button className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 ml-auto border border-gray-300 rounded-xl hover:border-gray-800 hover:shadow-sm transition-all bg-white">
        <svg 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth="1.5" 
          stroke="currentColor" 
          className="w-4 h-4 sm:w-5 sm:h-5"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" 
          />
        </svg>
        <span className="text-xs sm:text-sm font-semibold">Filters</span>
      </button>
    </div>
  );
};

export default Categories;
