// app/components/UserNav.tsx
'use client'

import { useState, useRef, useEffect } from "react";
import MenuLink from "./MenuLink";
import LogoutButton from "../LogoutButton";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    useUser,
    UserButton
} from "@clerk/nextjs";

interface UserNavProps {
    isScrolled?: boolean;
}

const UserNav = ({ isScrolled = false }: UserNavProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUser();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-300 ${
                    isScrolled
                        ? 'border-gray-200 hover:shadow-md bg-white hover:border-gray-300'
                        : 'border-white/30 hover:border-white/50 bg-white/10 backdrop-blur-sm hover:bg-white/20'
                }`}
            >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`h-5 w-5 transition-colors ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                }`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`h-5 w-5 transition-colors ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                }`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <SignedIn>
                        {/* User Info */}
                        <div className="p-4 border-b border-gray-100">
                            <p className="font-semibold text-gray-900">{user?.fullName}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>

                        {/* Clerk User Button */}
                        <div className="px-3 py-2 border-b border-gray-100">
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonPopoverCard: "w-full",
                                        userButtonPopoverFooter: "hidden",
                                    }
                                }}
                                afterSignOutUrl="/"
                            />
                        </div>

                        {/* Navigation Links */}
                        <div className="py-1">
                            <MenuLink
                                label="📋 My Reservations"
                                onClick={() => {
                                    window.location.href = "/MyReservations";
                                    setIsOpen(false);
                                }}
                            />
                            <MenuLink
                                label="🏠 Host Dashboard"
                                onClick={() => {
                                    window.location.href = "/Host/Dashboard";
                                    setIsOpen(false);
                                }}
                            />
                            <hr className="my-1 border-gray-100" />
                            <MenuLink
                                label="🏊 Room Pooling"
                                onClick={() => {
                                    window.location.href = "/room-pooling";
                                    setIsOpen(false);
                                }}
                            />
                            <MenuLink
                                label="🗓️ Itinerary Planner"
                                onClick={() => {
                                    window.location.href = "/itinerary-planner";
                                    setIsOpen(false);
                                }}
                            />
                            <MenuLink
                                label="⚙️ Preferences"
                                onClick={() => {
                                    window.location.href = "/preferences";
                                    setIsOpen(false);
                                }}
                            />
                        </div>

                        <hr className="border-gray-100" />
                        <div className="p-2">
                            <LogoutButton />
                        </div>
                    </SignedIn>

                    <SignedOut>
                        <div className="py-2">
                            <SignInButton mode="modal">
                                <MenuLink
                                    label="Log In"
                                    onClick={() => setIsOpen(false)}
                                />
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <MenuLink
                                    label="Sign Up"
                                    onClick={() => setIsOpen(false)}
                                />
                            </SignUpButton>
                        </div>
                    </SignedOut>
                </div>
            )}
        </div>
    );
};

export default UserNav;