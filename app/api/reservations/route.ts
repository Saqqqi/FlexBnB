import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
});

export async function POST(req: NextRequest) {
  try {
    const { propertyTitle, amount, propertyId, startDate, endDate, guests } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing reservation details' }, { status: 400 });
    }

    // Amount must be in cents and at least $0.50
    const amountInCents = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: propertyTitle || 'Property Reservation',
              description: `Check-in: ${startDate} → Check-out: ${endDate} · ${guests} guest(s)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      // Stripe redirects the user back here after payment
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reservations/success?session_id={CHECKOUT_SESSION_ID}&propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}&guests=${guests}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/Properties/${propertyId}?payment=cancelled`,
      metadata: {
        propertyId,
        startDate,
        endDate,
        guests: String(guests),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}
