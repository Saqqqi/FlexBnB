// app/components/Navbar.tsx
'use client'

import Image from 'next/image';
import Link from 'next/link';
import Searchfilters from './Searchfilterss';
import UserNav from './UserNav';
import AddPropertyButton from './AddPropertyButton';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav 
            className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-white shadow-lg py-3' 
                    : 'bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-sm py-5'
            }`}
        >
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <Image 
                            src="/flexbnb_logo_white.png"
                            alt="FLEXBNB"
                            width={130}
                            height={40}
                            className={`transition-all duration-300 ${
                                isScrolled ? 'opacity-80' : 'opacity-100'
                            }`}
                            priority
                        />
                    </Link>

                    {/* Search - Hidden on mobile, visible on tablet+ */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-4">
                        <Searchfilters isScrolled={isScrolled} />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <AddPropertyButton isScrolled={isScrolled} />
                        <UserNav isScrolled={isScrolled} />
                    </div>
                </div>

                {/* Mobile Search - Visible only on mobile */}
                <div className="md:hidden mt-3">
                    <Searchfilters isScrolled={isScrolled} isMobile />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;