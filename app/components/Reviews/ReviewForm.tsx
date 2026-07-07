"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";

interface ReviewFormProps {
  reservationId: string;
  onSubmitted?: () => void;
}

const ReviewForm = ({ reservationId, onSubmitted }: ReviewFormProps) => {
  const { getToken } = useAuth();
  const [rating, setRating] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [location, setLocation] = useState(5);
  const [value, setValue] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/booking/reviews/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          rating,
          cleanliness_rating: cleanliness,
          communication_rating: communication,
          location_rating: location,
          value_rating: value,
          comment,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit review");
      }
      toast.success("Review submitted successfully! Your review will appear on the property page.");
      if (onSubmitted) onSubmitted();
      setComment("");
    } catch (e: any) {
      const errorMessage = e.message || "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const Select = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <label className="flex items-center justify-between text-sm text-gray-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="ml-2 border border-gray-300 rounded px-2 py-1"
      >
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h4 className="font-semibold">Leave a review</h4>
      <Select label="Overall rating" value={rating} onChange={setRating} />
      <div className="grid grid-cols-2 gap-2">
        <Select label="Cleanliness" value={cleanliness} onChange={setCleanliness} />
        <Select label="Communication" value={communication} onChange={setCommunication} />
        <Select label="Location" value={location} onChange={setLocation} />
        <Select label="Value" value={value} onChange={setValue} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share details about your stay (no external links/contact info)"
        className="w-full border border-gray-300 rounded p-2 text-sm"
        rows={4}
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        onClick={submit}
        disabled={submitting}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
};

export default ReviewForm; 