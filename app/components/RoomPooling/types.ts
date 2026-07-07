// Room Pooling Types

export interface RoommateProfile {
  id: string;
  user: string;
  user_name: string;
  user_email: string;
  gender: 'male' | 'female' | 'other' | 'no_preference';
  preferred_gender: 'male' | 'female' | 'other' | 'no_preference';
  age_group: string;
  preferred_age_groups: string[];
  sleep_schedule: 'early_bird' | 'night_owl' | 'flexible';
  cleanliness: 'very_clean' | 'moderate' | 'relaxed';
  noise_preference: 'quiet' | 'moderate' | 'social';
  smoking: 'non_smoker' | 'smoker' | 'outdoor_only' | 'no_preference';
  interests: string[];
  languages: string[];
  occupation: string;
  bio: string;
  pets_allowed: boolean;
  has_pets: boolean;
  is_verified: boolean;
  is_looking_for_roommate: boolean;
  last_active: string;
  created_at: string;
}

export interface RoommateMatch {
  profile: RoommateProfile;
  compatibility_score: number;
  match_reasons: string[];
  compatibility_breakdown: {
    [key: string]: {
      score: number;
      max: number;
      shared?: string[];
    };
  };
}

export interface PropertyDetails {
  id: string;
  title: string;
  price_per_night: number;
  image_url: string;
  country: string;
  country_code: string;
}

export interface RoomPoolMember {
  id: string;
  pool: string;
  user: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'left' | 'removed';
  is_creator: boolean;
  compatibility_score: number;
  share_amount: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  payment_due_date: string | null;
  custom_split_percentage: number | null;
  joined_at: string;
  approved_at: string | null;
  request_message: string;
}

export interface CostSplit {
  id: string;
  pool: string;
  split_type: 'equal' | 'custom' | 'by_nights' | 'by_beds';
  base_accommodation: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_amount: number;
  custom_percentages: { [userId: string]: number };
  individual_amounts: { [userId: string]: number };
  created_at: string;
  updated_at: string;
}

export interface RoomPool {
  id: string;
  title: string;
  description: string;
  property: string;
  property_title: string;
  property_image: string | null;
  property_location: string;
  property_details?: PropertyDetails;
  creator: string;
  creator_name: string;
  check_in_date: string;
  check_out_date: string;
  max_members: number;
  current_members: number;
  spots_available: number;
  total_price: number;
  price_per_person: number;
  booking_fee_per_person: number;
  status: 'open' | 'full' | 'closed' | 'booked' | 'completed' | 'cancelled';
  visibility: 'public' | 'private' | 'friends';
  gender_preference: string;
  min_age: number | null;
  max_age: number | null;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  use_compatibility_matching: boolean;
  min_compatibility_score: number;
  reservation: string | null;
  booking_deadline: string;
  days_until_deadline?: number;
  members?: RoomPoolMember[];
  cost_split?: CostSplit;
  is_member?: boolean;
  is_creator?: boolean;
  my_membership?: RoomPoolMember | null;
  created_at: string;
  updated_at?: string;
}

export interface PoolChatMessage {
  id: string;
  pool: string;
  sender: string | null;
  sender_name: string;
  sender_avatar: string | null;
  message_type: 'text' | 'system' | 'payment' | 'join' | 'leave';
  message: string;
  metadata: { [key: string]: any };
  is_read_by: string[];
  created_at: string;
  is_mine: boolean;
}

export interface PoolInvitation {
  id: string;
  pool: string;
  pool_title: string;
  invited_user: string | null;
  invited_email: string;
  invited_by: string;
  invited_by_name: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string;
  expires_at: string;
  created_at: string;
}

export interface PaymentSummary {
  user_id: string;
  user_name: string;
  share_amount: number;
  amount_paid: number;
  payment_status: string;
  remaining: number;
}

