'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Property {
  id: string;
  title: string;
  price_per_night: number;
  image_url: string;
  country: string;
  allow_room_pooling?: boolean;
  max_pool_members?: number;
}

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedProperty?: Property | null;
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedProperty,
}) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [totalPrice, setTotalPrice] = useState(0);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [genderPreference, setGenderPreference] = useState('no_preference');
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [useCompatibilityMatching, setUseCompatibilityMatching] = useState(true);
  const [minCompatibilityScore, setMinCompatibilityScore] = useState(50);
  const [bookingDeadline, setBookingDeadline] = useState('');
  
  // Properties search
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchingProperties, setSearchingProperties] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (preselectedProperty) {
      setPropertyId(preselectedProperty.id);
      setSelectedProperty(preselectedProperty);
      // Reset maxMembers if it exceeds property's limit
      if (preselectedProperty.max_pool_members && maxMembers > preselectedProperty.max_pool_members) {
        setMaxMembers(Math.min(4, preselectedProperty.max_pool_members));
      }
    }
  }, [preselectedProperty]);

  // Reset maxMembers when property changes to respect property's limit
  useEffect(() => {
    if (selectedProperty?.max_pool_members) {
      const propertyMax = selectedProperty.max_pool_members;
      if (maxMembers > propertyMax) {
        setMaxMembers(Math.min(4, propertyMax));
      }
    }
  }, [selectedProperty]);

  // Calculate total price based on dates and property
  useEffect(() => {
    if (checkIn && checkOut && selectedProperty) {
      const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (nights > 0) {
        setTotalPrice(nights * selectedProperty.price_per_night);
      }
    }
  }, [checkIn, checkOut, selectedProperty]);

  // Set default booking deadline to 3 days before check-in
  useEffect(() => {
    if (checkIn) {
      const deadline = new Date(checkIn);
      deadline.setDate(deadline.getDate() - 3);
      setBookingDeadline(deadline.toISOString().slice(0, 16));
    }
  }, [checkIn]);

  const searchProperties = async () => {
    if (!propertySearch.trim()) return;
    
    try {
      setSearchingProperties(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/properties/?search=${encodeURIComponent(propertySearch)}`
      );
      const data = await res.json();
      // Filter to only show properties that allow room pooling
      const allProperties = data.data || [];
      const poolingEnabled = allProperties.filter((p: any) => p.allow_room_pooling === true);
      setProperties(poolingEnabled.length > 0 ? poolingEnabled : allProperties);
    } catch (error) {
      console.error('Failed to search properties:', error);
    } finally {
      setSearchingProperties(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyId || !checkIn || !checkOut || !title || !bookingDeadline) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const token = await getToken();
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/pools/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            property: propertyId,
            check_in_date: checkIn,
            check_out_date: checkOut,
            max_members: maxMembers,
            total_price: totalPrice,
            visibility,
            gender_preference: genderPreference,
            smoking_allowed: smokingAllowed,
            pets_allowed: petsAllowed,
            use_compatibility_matching: useCompatibilityMatching,
            min_compatibility_score: minCompatibilityScore,
            booking_deadline: new Date(bookingDeadline).toISOString(),
          }),
        }
      );
      
      if (res.ok) {
        toast.success('Room pool created successfully!');
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create pool');
      }
    } catch (error) {
      console.error('Failed to create pool:', error);
      toast.error('Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPropertyId('');
    setSelectedProperty(null);
    setCheckIn('');
    setCheckOut('');
    setMaxMembers(4);
    setTotalPrice(0);
    setVisibility('public');
    setGenderPreference('no_preference');
    setSmokingAllowed(false);
    setPetsAllowed(false);
    setUseCompatibilityMatching(true);
    setMinCompatibilityScore(50);
    setBookingDeadline('');
    setStep(1);
  };
  
  const canProceedToStep2 = () => {
    return title.trim() !== '' && propertyId !== '';
  };
  
  const canProceedToStep3 = () => {
    return checkIn !== '' && checkOut !== '' && totalPrice > 0 && bookingDeadline !== '';
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      if (!canProceedToStep2()) {
        toast.error('Please enter a title and select a property');
        return;
      }
    } else if (step === 2) {
      if (!canProceedToStep3()) {
        toast.error('Please fill in all date and price fields');
        return;
      }
    }
    setStep(step + 1);
  };

  const pricePerPerson = maxMembers > 0 ? totalPrice / maxMembers : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create Room Pool</h2>
                <p className="text-sm text-white/80">Share a stay and split costs</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 rounded-full ${
                      step > s ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pool Title * {!title.trim() && <span className="text-red-500 text-xs ml-1">(Required)</span>}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Weekend Beach Trip Group"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    !title.trim() ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell potential members about your trip..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Property selection */}
              {selectedProperty ? (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HomeModernIcon className="w-6 h-6 text-indigo-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedProperty.title}</p>
                        <p className="text-sm text-gray-600">
                          ${selectedProperty.price_per_night}/night {selectedProperty.country && `• ${selectedProperty.country}`}
                        </p>
                      </div>
                    </div>
                    {!preselectedProperty && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProperty(null);
                          setPropertyId('');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Property * {!propertyId && <span className="text-red-500 text-xs ml-1">(Required)</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchProperties())}
                      placeholder="Search properties with room pooling..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={searchProperties}
                      disabled={searchingProperties}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {searchingProperties ? '...' : 'Search'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Search for properties that have room pooling enabled
                  </p>
                  {properties.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {properties.map((prop) => (
                        <button
                          key={prop.id}
                          type="button"
                          onClick={() => {
                            setPropertyId(prop.id);
                            setSelectedProperty(prop);
                          }}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            propertyId === prop.id
                              ? 'bg-indigo-100 border-indigo-300'
                              : 'bg-gray-50 hover:bg-gray-100'
                          } border`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{prop.title}</p>
                            {prop.allow_room_pooling && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <UserGroupIcon className="w-3 h-3" />
                                Pooling
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            ${prop.price_per_night}/night
                            {prop.max_pool_members && (
                              <span className="ml-2 text-xs text-gray-400">
                                • Max {prop.max_pool_members} members
                              </span>
                            )}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Dates & Capacity */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                    Check-in *
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                    Check-out *
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserGroupIcon className="w-4 h-4 inline mr-1" />
                  Max Members (including you) *
                  {selectedProperty?.max_pool_members && (
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Property allows up to {selectedProperty.max_pool_members})
                    </span>
                  )}
                </label>
                <input
                  type="range"
                  min={2}
                  max={selectedProperty?.max_pool_members || 6}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>2</span>
                  <span className="font-medium text-indigo-600">{maxMembers} members</span>
                  <span>{selectedProperty?.max_pool_members || 6}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Total Price *
                </label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  min={0}
                  step={0.01}
                  required
                />
                {totalPrice > 0 && (
                  <p className="mt-2 text-sm text-emerald-600">
                    ≈ ${pricePerPerson.toFixed(2)} per person
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={bookingDeadline}
                  onChange={(e) => setBookingDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Last date for members to join before booking
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
                      visibility === 'public'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <GlobeAltIcon className="w-6 h-6 mx-auto text-indigo-600" />
                    <p className="mt-2 font-medium">Public</p>
                    <p className="text-xs text-gray-500">Anyone can find & join</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
                      visibility === 'private'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <LockClosedIcon className="w-6 h-6 mx-auto text-indigo-600" />
                    <p className="mt-2 font-medium">Private</p>
                    <p className="text-xs text-gray-500">Invite only</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender Preference
                </label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="no_preference">No Preference</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-3 flex-1 p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smokingAllowed}
                    onChange={(e) => setSmokingAllowed(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                  <span>Smoking Allowed</span>
                </label>
                <label className="flex items-center gap-3 flex-1 p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={petsAllowed}
                    onChange={(e) => setPetsAllowed(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                  <span>Pets Allowed</span>
                </label>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCompatibilityMatching}
                    onChange={(e) => setUseCompatibilityMatching(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                  <div>
                    <span className="flex items-center gap-2 font-medium">
                      <SparklesIcon className="w-5 h-5 text-indigo-600" />
                      Enable Compatibility Matching
                    </span>
                    <p className="text-sm text-gray-600">
                      Only allow members with compatible roommate profiles
                    </p>
                  </div>
                </label>

                {useCompatibilityMatching && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Compatibility Score: {minCompatibilityScore}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={minCompatibilityScore}
                      onChange={(e) => setMinCompatibilityScore(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          {/* Validation status for step 1 */}
          {step === 1 && !canProceedToStep2() && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>To continue:</strong>
              <ul className="mt-1 list-disc list-inside">
                {!title.trim() && <li>Enter a pool title</li>}
                {!propertyId && <li>Select a property</li>}
              </ul>
            </div>
          )}
          
          {/* Validation status for step 2 */}
          {step === 2 && !canProceedToStep3() && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>To continue:</strong>
              <ul className="mt-1 list-disc list-inside">
                {!checkIn && <li>Select check-in date</li>}
                {!checkOut && <li>Select check-out date</li>}
                {totalPrice <= 0 && <li>Enter total price</li>}
                {!bookingDeadline && <li>Set booking deadline</li>}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={step === 1 ? !canProceedToStep2() : !canProceedToStep3()}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Pool'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoolModal;

