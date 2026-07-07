'use client';
import { useState, useCallback } from 'react';
import { 
  CreditCardIcon, 
  LockClosedIcon, 
  ShieldCheckIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onRequestConfirm: (card: string, expiry: string) => void;
}

interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

type PaymentMethod = 'card' | 'paypal' | 'applepay' | 'googlepay' | 'banktransfer';

function getCardType(card: string) {
  if (/^4/.test(card)) return 'visa';
  if (/^5[1-5]/.test(card)) return 'mastercard';
  if (/^3[47]/.test(card)) return 'amex';
  if (/^6/.test(card)) return 'discover';
  return '';
}

// Move components outside to prevent recreation
const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => setPaymentMethod('card')}
        className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
          paymentMethod === 'card' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <CreditCardIcon className="h-6 w-6" />
        <span className="font-medium">Card</span>
      </button>
      
      <button
        onClick={() => setPaymentMethod('paypal')}
        className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
          paymentMethod === 'paypal' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <GlobeAltIcon className="h-6 w-6" />
        <span className="font-medium">PayPal</span>
      </button>
      
      <button
        onClick={() => setPaymentMethod('applepay')}
        className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
          paymentMethod === 'applepay' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <DevicePhoneMobileIcon className="h-6 w-6" />
        <span className="font-medium">Apple Pay</span>
      </button>
      
      <button
        onClick={() => setPaymentMethod('banktransfer')}
        className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
          paymentMethod === 'banktransfer' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <BanknotesIcon className="h-6 w-6" />
        <span className="font-medium">Bank</span>
      </button>
    </div>
  </div>
);

const CardForm = ({ 
  card, 
  setCard, 
  expiry, 
  setExpiry, 
  cvv, 
  setCvv, 
  cardholderName, 
  setCardholderName, 
  saveCard, 
  setSaveCard 
}: {
  card: string;
  setCard: (value: string) => void;
  expiry: string;
  setExpiry: (value: string) => void;
  cvv: string;
  setCvv: (value: string) => void;
  cardholderName: string;
  setCardholderName: (value: string) => void;
  saveCard: boolean;
  setSaveCard: (value: boolean) => void;
}) => {
  const cardType = getCardType(card);
  const masked = card ? card.replace(/.(?=.{4})/g, '*') : '';

  const handleCardChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').replace(/\s/g, '');
    if (cleaned.length <= 16) {
      setCard(cleaned);
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      const formatted = cleaned.length >= 2 
        ? cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
        : cleaned;
      setExpiry(formatted);
    }
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setCvv(cleaned);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          placeholder="Ali Hassan Iqbal"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="1234567890123456"
            value={card}
            onChange={(e) => handleCardChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
            maxLength={16}
          />
          {cardType && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
                {cardType.toUpperCase()}
              </div>
            </div>
          )}
        </div>
        {card && (
          <p className="text-xs text-gray-500 mt-1">Preview: {masked}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="text"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => handleExpiryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={5}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            placeholder="123"
            value={cvv}
            onChange={(e) => handleCvvChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={4}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="saveCard"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="saveCard" className="text-sm text-gray-700">
          Save card for future payments
        </label>
      </div>
    </div>
  );
};

const BillingForm = ({ billingDetails, setBillingDetails }: {
  billingDetails: BillingDetails;
  setBillingDetails: (details: BillingDetails) => void;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          type="text"
          value={billingDetails.firstName}
          onChange={(e) => setBillingDetails({...billingDetails, firstName: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          type="text"
          value={billingDetails.lastName}
          onChange={(e) => setBillingDetails({...billingDetails, lastName: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        type="email"
        value={billingDetails.email}
        onChange={(e) => setBillingDetails({...billingDetails, email: e.target.value})}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number
      </label>
      <input
        type="tel"
        value={billingDetails.phone}
        onChange={(e) => setBillingDetails({...billingDetails, phone: e.target.value})}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Address
      </label>
      <input
        type="text"
        value={billingDetails.address}
        onChange={(e) => setBillingDetails({...billingDetails, address: e.target.value})}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          value={billingDetails.city}
          onChange={(e) => setBillingDetails({...billingDetails, city: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State
        </label>
        <input
          type="text"
          value={billingDetails.state}
          onChange={(e) => setBillingDetails({...billingDetails, state: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ZIP Code
        </label>
        <input
          type="text"
          value={billingDetails.zipCode}
          onChange={(e) => setBillingDetails({...billingDetails, zipCode: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
);

const PaymentModal = ({ isOpen, onClose, amount, onRequestConfirm }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'payment' | 'billing' | 'review'>('payment');
  
  // Billing details
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  // Security features
  const [saveCard, setSaveCard] = useState(false);
  const [isSecureConnection, setIsSecureConnection] = useState(true);
  const [fraudProtection, setFraudProtection] = useState(true);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
  };

  const handleCardChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').replace(/\s/g, '');
    if (cleaned.length <= 16) {
      setCard(cleaned);
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      const formatted = cleaned.length >= 2 
        ? cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
        : cleaned;
      setExpiry(formatted);
    }
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setCvv(cleaned);
    }
  };

  const validatePayment = () => {
    setError('');
    
    if (paymentMethod === 'card') {
      if (!/^\d{16}$/.test(card)) {
        setError('Card number must be 16 digits');
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setError('Expiry must be MM/YY format');
        return false;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        setError('CVV must be 3 or 4 digits');
        return false;
      }
      if (!cardholderName.trim()) {
        setError('Cardholder name is required');
        return false;
      }
    }
    
    return true;
  };

  const validateBilling = () => {
    const required = ['firstName', 'lastName', 'email', 'address', 'city', 'zipCode'];
    const missing = required.filter(field => !billingDetails[field as keyof BillingDetails].trim());
    
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}`);
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(billingDetails.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 'payment') {
      if (validatePayment()) {
        setStep('billing');
      }
    } else if (step === 'billing') {
      if (validateBilling()) {
        setStep('review');
      }
    }
  };

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onRequestConfirm(card, expiry);
    }, 2000);
  };

  const cardType = getCardType(card);
  const masked = card ? card.replace(/.(?=.{4})/g, '*') : '';
  const serviceFee = Math.round(amount * 0.029); // 2.9% service fee
  const taxes = Math.round(amount * 0.08); // 8% tax
  const totalAmount = amount + serviceFee + taxes;

  const ReviewStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review Your Payment</h3>
      
      {/* Payment Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Method:</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>
          {paymentMethod === 'card' && (
            <>
              <div className="flex justify-between">
                <span>Card:</span>
                <span>{masked}</span>
              </div>
              <div className="flex justify-between">
                <span>Cardholder:</span>
                <span>{cardholderName}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Billing Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Billing Address</h4>
        <div className="text-sm text-gray-600">
          <p>{billingDetails.firstName} {billingDetails.lastName}</p>
          <p>{billingDetails.address}</p>
          <p>{billingDetails.city}, {billingDetails.state} {billingDetails.zipCode}</p>
          <p>{billingDetails.email}</p>
        </div>
      </div>
      
      {/* Price Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service fee:</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes:</span>
            <span>${taxes.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isSecureConnection && <LockClosedIcon className="h-5 w-5 text-green-500" />}
              <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-green-50 border border-green-200 p-4 mx-6 mt-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">256-bit SSL Encryption</p>
              <p className="text-xs text-green-600">Your payment information is secure and protected</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            {['Payment', 'Billing', 'Review'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index === 0 && step === 'payment' ? 'bg-blue-500 text-white' :
                    index === 1 && step === 'billing' ? 'bg-blue-500 text-white' :
                    index === 2 && step === 'review' ? 'bg-blue-500 text-white' :
                    index < (['payment', 'billing', 'review'].indexOf(step)) ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }
                `}>
                  {index < (['payment', 'billing', 'review'].indexOf(step)) ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 text-sm ${
                  index <= (['payment', 'billing', 'review'].indexOf(step)) ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {stepName}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    index < (['payment', 'billing', 'review'].indexOf(step)) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {step === 'payment' && (
            <div className="space-y-6">
              <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
              {paymentMethod === 'card' && <CardForm card={card} setCard={setCard} expiry={expiry} setExpiry={setExpiry} cvv={cvv} setCvv={setCvv} cardholderName={cardholderName} setCardholderName={setCardholderName} saveCard={saveCard} setSaveCard={setSaveCard} />}
              {paymentMethod === 'paypal' && (
                <div className="text-center py-8">
                  <GlobeAltIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">PayPal Integration</p>
                  <p className="text-gray-600">You'll be redirected to PayPal to complete payment</p>
                </div>
              )}
              {paymentMethod === 'applepay' && (
                <div className="text-center py-8">
                  <DevicePhoneMobileIcon className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-lg font-medium">Apple Pay</p>
                  <p className="text-gray-600">Use Touch ID or Face ID to pay securely</p>
                </div>
              )}
              {paymentMethod === 'banktransfer' && (
                <div className="text-center py-8">
                  <BanknotesIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">Bank Transfer</p>
                  <p className="text-gray-600">Instructions will be provided after booking</p>
                </div>
              )}
            </div>
          )}
          
          {step === 'billing' && <BillingForm billingDetails={billingDetails} setBillingDetails={setBillingDetails} />}
          {step === 'review' && <ReviewStep />}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Fraud Protection Notice */}
          {fraudProtection && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-800">Protected by advanced fraud detection</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <div>
              {step !== 'payment' && (
                <button
                  onClick={() => setStep(step === 'review' ? 'billing' : 'payment')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {step === 'review' ? (
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 