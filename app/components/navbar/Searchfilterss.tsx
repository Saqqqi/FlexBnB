'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchfiltersProps {
    isScrolled?: boolean;
    isMobile?: boolean;
}

const Searchfilters = ({ isScrolled = false, isMobile = false }: SearchfiltersProps) => {
    const router = useRouter();
    const [activeField, setActiveField] = useState<string | null>(null);
    const [location, setLocation] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setActiveField(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.set('location', location);
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        if (guests > 1) params.set('guests', String(guests));
        router.push(`/?${params.toString()}`);
        setActiveField(null);
    };

    const fieldClass = (field: string) => `
        group relative cursor-pointer h-[64px] px-6 flex items-center rounded-full transition-colors
        ${activeField === field ? (isScrolled ? 'bg-gray-100' : 'bg-white/20') : 'hover:bg-black/5'}
    `;

    const labelClass = `text-xs font-semibold ${isScrolled ? 'text-gray-800' : 'text-white'}`;
    const valueClass = `text-sm ${isScrolled ? 'text-gray-500' : 'text-white/70'}`;

    if (isMobile) {
        return (
            <div className="relative" ref={ref}>
                <div
                    onClick={() => setActiveField(activeField ? null : 'location')}
                    className="flex items-center justify-between bg-white rounded-full px-4 py-3 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="font-medium">Search</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">{location || 'Anywhere'}</span>
                    </div>
                    <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-white">
                        <svg viewBox="0 0 32 32" className="h-4 w-4 fill-none stroke-current stroke-[4]">
                            <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"/>
                        </svg>
                    </div>
                </div>

                {activeField && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl p-4 z-50">
                        <div className="space-y-4">
                            <div className="border-b pb-3">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</label>
                                <input
                                    type="text"
                                    placeholder="Search destinations"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Check In</label>
                                    <input
                                        type="date"
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Check Out</label>
                                    <input
                                        type="date"
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Guests</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg hover:border-gray-500">−</button>
                                    <span className="font-medium w-6 text-center">{guests}</span>
                                    <button onClick={() => setGuests(guests + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg hover:border-gray-500">+</button>
                                </div>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={`relative h-[64px] flex items-center justify-between border rounded-full transition-all duration-300 ${
                isScrolled
                    ? 'border-gray-200 bg-white shadow-sm hover:shadow-md'
                    : 'border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20'
            }`}
        >
            <div className="flex items-center divide-x divide-gray-200/30">
                {/* Where */}
                <div className={fieldClass('location')} onClick={() => setActiveField(activeField === 'location' ? null : 'location')}>
                    <div>
                        <p className={labelClass}>Where</p>
                        <p className={valueClass}>{location || 'Search destinations'}</p>
                    </div>
                    {activeField === 'location' && (
                        <div className="absolute top-[72px] left-0 w-80 bg-white rounded-2xl shadow-2xl p-4 z-50" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Destination</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search destinations"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setActiveField('checkIn')}
                                className="w-full mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-800"
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                                {['Pakistan', 'Dubai', 'London', 'New York'].map(city => (
                                    <button key={city} onClick={() => { setLocation(city); setActiveField('checkIn'); }}
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Check In */}
                <div className={fieldClass('checkIn')} onClick={() => setActiveField(activeField === 'checkIn' ? null : 'checkIn')}>
                    <div>
                        <p className={labelClass}>Check In</p>
                        <p className={valueClass}>{checkIn || 'Add dates'}</p>
                    </div>
                    {activeField === 'checkIn' && (
                        <div className="absolute top-[72px] left-0 bg-white rounded-2xl shadow-2xl p-4 z-50" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Check In Date</label>
                            <input
                                autoFocus
                                type="date"
                                value={checkIn}
                                onChange={(e) => { setCheckIn(e.target.value); setActiveField('checkOut'); }}
                                className="mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                            />
                        </div>
                    )}
                </div>

                {/* Check Out */}
                <div className={fieldClass('checkOut')} onClick={() => setActiveField(activeField === 'checkOut' ? null : 'checkOut')}>
                    <div>
                        <p className={labelClass}>Check Out</p>
                        <p className={valueClass}>{checkOut || 'Add dates'}</p>
                    </div>
                    {activeField === 'checkOut' && (
                        <div className="absolute top-[72px] left-0 bg-white rounded-2xl shadow-2xl p-4 z-50" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Check Out Date</label>
                            <input
                                autoFocus
                                type="date"
                                value={checkOut}
                                onChange={(e) => { setCheckOut(e.target.value); setActiveField('guests'); }}
                                className="mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                            />
                        </div>
                    )}
                </div>

                {/* Who */}
                <div className={fieldClass('guests')} onClick={() => setActiveField(activeField === 'guests' ? null : 'guests')}>
                    <div>
                        <p className={labelClass}>Who</p>
                        <p className={valueClass}>{guests > 1 ? `${guests} guests` : 'Add guests'}</p>
                    </div>
                    {activeField === 'guests' && (
                        <div className="absolute top-[72px] right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 z-50" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Guests</label>
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-gray-700 font-medium">Number of guests</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setGuests(Math.max(1, guests - 1))}
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg hover:border-gray-500 transition-colors"
                                    >−</button>
                                    <span className="font-semibold w-6 text-center text-gray-800">{guests}</span>
                                    <button
                                        onClick={() => setGuests(guests + 1)}
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg hover:border-gray-500 transition-colors"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Button */}
            <div className="px-2">
                <button
                    onClick={handleSearch}
                    className="p-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-xl transition-all duration-300"
                >
                    <svg viewBox="0 0 32 32" className="h-4 w-4 fill-none stroke-current stroke-[4]">
                        <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Searchfilters;
