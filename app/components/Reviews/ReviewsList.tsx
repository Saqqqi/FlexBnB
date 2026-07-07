"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";

interface ReviewsListProps {
  propertyId: string;
  pageSize?: number;
  refreshKey?: number; // When this changes, refresh the reviews
}

interface ReviewItem {
  id: string;
  rating: number;
  overall_rating?: number;
  comment: string;
  cleanliness_rating: number;
  communication_rating: number;
  location_rating: number;
  value_rating: number;
  created_at: string;
  guest: { id: string; email: string; name: string | null };
}

const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", { timeZone: "UTC" });

const ReviewsList = ({ propertyId, pageSize = 5, refreshKey }: ReviewsListProps) => {
  console.log('ReviewsList component initialized with propertyId:', propertyId);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async (pageNum: number) => {
    console.log('fetchReviews function called with pageNum:', pageNum);
    debugger;
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_HOST}/api/booking/reviews/?property_id=${propertyId}&page=${pageNum}&page_size=${pageSize}`;
      console.log('Fetching reviews from:', url);
      const res = await fetch(url);
      console.log('Reviews response:', res);
      console.log('Reviews response status:', res.status);
      const data = await res.json();
      console.log('Reviews data:', data);
      setReviews(data.results || []);
      setCount(data.count || 0);
    } catch (e) {
      console.error("Failed to load reviews", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchReviews(page);
    }
  }, [propertyId, page, refreshKey]);

  const average = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + (r.overall_rating || r.rating), 0) / reviews.length) * 10) / 10
    : 0;

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <StarIcon className="h-5 w-5 text-yellow-400" />
        <span className="font-semibold">{average || 0}</span>
        <span className="text-gray-500">({count} reviews)</span>
      </div>

      {loading && <div className="text-gray-500">Loading reviews…</div>}

      {!loading && reviews.length === 0 && (
        <div className="text-gray-500">No reviews yet.</div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">{r.overall_rating || r.rating}</span>
              </div>
              <div className="text-xs text-gray-500">{formatDate(r.created_at)}</div>
            </div>
            <div className="text-sm text-gray-800 mb-2">{r.comment}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Cleanliness: {r.cleanliness_rating}/5</div>
              <div>Communication: {r.communication_rating}/5</div>
              <div>Location: {r.location_rating}/5</div>
              <div>Value: {r.value_rating}/5</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Guest: {r.guest?.name || r.guest?.email}</div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList; 