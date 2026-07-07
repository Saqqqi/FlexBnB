'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import RoommateMatchCard from '../../components/RoomPooling/RoommateMatchCard';
import { RoommateProfile, RoommateMatch } from '../../components/RoomPooling/types';
import {
  ArrowLeftIcon,
  HeartIcon,
  SparklesIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const RoommateMatchingPage: React.FC = () => {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<RoommateProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Profile form state
  const [gender, setGender] = useState('no_preference');
  const [preferredGender, setPreferredGender] = useState('no_preference');
  const [ageGroup, setAgeGroup] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('flexible');
  const [cleanliness, setCleanliness] = useState('moderate');
  const [noisePreference, setNoisePreference] = useState('moderate');
  const [smoking, setSmoking] = useState('no_preference');
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [isLooking, setIsLooking] = useState(true);

  const allInterests = [
    'Travel', 'Reading', 'Sports', 'Music', 'Movies', 'Gaming',
    'Cooking', 'Fitness', 'Photography', 'Art', 'Technology', 'Nature',
    'Dancing', 'Yoga', 'Hiking', 'Beach', 'Nightlife', 'Food'
  ];

  const fetchMyProfile = async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/profiles/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setMyProfile(data);
        
        // Populate form with existing data
        setGender(data.gender || 'no_preference');
        setPreferredGender(data.preferred_gender || 'no_preference');
        setAgeGroup(data.age_group || '');
        setSleepSchedule(data.sleep_schedule || 'flexible');
        setCleanliness(data.cleanliness || 'moderate');
        setNoisePreference(data.noise_preference || 'moderate');
        setSmoking(data.smoking || 'no_preference');
        setInterests(data.interests || []);
        setBio(data.bio || '');
        setIsLooking(data.is_looking_for_roommate);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchMatches = async () => {
    if (!isSignedIn) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/matching/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProfile();
    fetchMatches();
  }, [isSignedIn]);

  const saveProfile = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/roompooling/profiles/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gender,
            preferred_gender: preferredGender,
            age_group: ageGroup,
            sleep_schedule: sleepSchedule,
            cleanliness,
            noise_preference: noisePreference,
            smoking,
            interests,
            bio,
            is_looking_for_roommate: isLooking,
          }),
        }
      );
      
      if (res.ok) {
        toast.success('Profile saved successfully!');
        setShowProfileForm(false);
        fetchMyProfile();
        fetchMatches();
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Your Perfect Roommate</h2>
          <p className="text-gray-600 mb-6">Sign in to start matching with compatible travelers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push('/room-pooling')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Pools
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <HeartIcon className="w-8 h-8" />
                Roommate Matching
              </h1>
              <p className="text-white/80">Find compatible travelers based on your preferences</p>
            </div>
            
            <button
              onClick={() => setShowProfileForm(!showProfileForm)}
              className="px-6 py-3 bg-white text-rose-600 font-semibold rounded-xl hover:shadow-lg flex items-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              {myProfile ? 'Edit Profile' : 'Create Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Form */}
        {showProfileForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserCircleIcon className="w-6 h-6 text-rose-500" />
              Your Roommate Profile
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="no_preference">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Roommate Gender</label>
                <select
                  value={preferredGender}
                  onChange={(e) => setPreferredGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="no_preference">No Preference</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select age group</option>
                  <option value="18_25">18-25</option>
                  <option value="26_35">26-35</option>
                  <option value="36_45">36-45</option>
                  <option value="46_55">46-55</option>
                  <option value="56_plus">56+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Schedule</label>
                <select
                  value={sleepSchedule}
                  onChange={(e) => setSleepSchedule(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="early_bird">Early Bird (Sleep before 10pm)</option>
                  <option value="night_owl">Night Owl (Sleep after midnight)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cleanliness</label>
                <select
                  value={cleanliness}
                  onChange={(e) => setCleanliness(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="very_clean">Very Clean & Organized</option>
                  <option value="moderate">Moderately Clean</option>
                  <option value="relaxed">Relaxed about cleanliness</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Noise Preference</label>
                <select
                  value={noisePreference}
                  onChange={(e) => setNoisePreference(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="quiet">Prefer Quiet Environment</option>
                  <option value="moderate">Some noise is fine</option>
                  <option value="social">Love socializing & noise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
                <select
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                >
                  <option value="non_smoker">Non-Smoker</option>
                  <option value="smoker">Smoker</option>
                  <option value="outdoor_only">Outdoor Smoker Only</option>
                  <option value="no_preference">No Preference</option>
                </select>
              </div>
            </div>

            {/* Interests */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Interests</label>
              <div className="flex flex-wrap gap-2">
                {allInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      interests.includes(interest)
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">About You</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell potential roommates about yourself..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 resize-none"
                maxLength={500}
              />
            </div>

            {/* Looking for roommate toggle */}
            <div className="mt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLooking}
                  onChange={(e) => setIsLooking(e.target.checked)}
                  className="w-5 h-5 rounded text-rose-500"
                />
                <span className="font-medium">I'm actively looking for roommates</span>
              </label>
            </div>

            {/* Save button */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setShowProfileForm(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        {/* Matches */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                <SparklesIcon className="w-6 h-6 inline mr-2 text-rose-500" />
                {matches.length} Compatible Roommates Found
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, idx) => (
                <RoommateMatchCard
                  key={idx}
                  match={match}
                  onConnect={(id) => {
                    router.push(`/room-pooling/profile/${id}`);
                  }}
                  onInvite={(id) => {
                    toast.info('Invite feature coming soon!');
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found yet</h3>
            <p className="text-gray-600 mb-6">
              {myProfile
                ? 'We couldn\'t find compatible roommates. Try updating your preferences.'
                : 'Create your profile to start matching with compatible travelers!'}
            </p>
            <button
              onClick={() => setShowProfileForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg"
            >
              {myProfile ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoommateMatchingPage;

