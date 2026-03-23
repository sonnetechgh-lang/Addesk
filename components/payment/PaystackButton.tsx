'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePaystackPayment } from 'react-paystack'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeliveryAddress {
  street: string
  city: string
  region: string
  zip: string
  country: string
  notes?: string
}

interface PaystackButtonProps {
  amount: number
  email: string
  subaccountCode?: string | null
  influencerId: string
  packageId: string
  clientName: string
  brief: string
  briefImageUrls: string[]
  isSubmitting: boolean
  creatorUsername: string
  deliveryType?: 'digital' | 'physical' | 'on_premise'
  deliveryAddress?: DeliveryAddress | null
  onPremiseDate?: string | null
  onPremiseLocation?: string | null
}

export default function PaystackButton({ 
  amount, 
  email, 
  subaccountCode, 
  influencerId,
  packageId,
  clientName,
  brief,
  briefImageUrls,
  isSubmitting,
  creatorUsername,
  deliveryType = 'digital',
  deliveryAddress = null,
  onPremiseDate = null,
  onPremiseLocation = null,
}: PaystackButtonProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [txReference, setTxReference] = useState('')

  useEffect(() => {
    setIsMounted(true)
    setTxReference(`ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`)
  }, [])

  const config = {
    reference: txReference,
    email: email,
    amount: amount, // In pesewas
    currency: 'GHS',
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  } as any;

  // Only attach subaccount if valid, otherwise Paystack hangs or rejects
  if (subaccountCode && subaccountCode.trim() !== '') {
    config.subaccount = subaccountCode;
  }

  config.metadata = {
    custom_fields: [
      {
        display_name: "Influencer ID",
        variable_name: "influencer_id",
        value: influencerId
      },
      {
        display_name: "Package ID",
        variable_name: "package_id",
        value: packageId
      },
      {
        display_name: "Client Name",
        variable_name: "client_name",
        value: clientName
      },
      {
        display_name: "Brief",
        variable_name: "brief",
        value: brief
      },
      {
        display_name: "Brief Image URLs",
        variable_name: "brief_image_urls",
        value: JSON.stringify(briefImageUrls || [])
      },
      {
        display_name: "Delivery Type",
        variable_name: "delivery_type",
        value: deliveryType
      },
      ...(deliveryAddress ? [{
        display_name: "Delivery Address",
        variable_name: "delivery_address",
        value: JSON.stringify(deliveryAddress)
      }] : []),
      ...(onPremiseDate ? [{
        display_name: "On-Premise Date",
        variable_name: "on_premise_date",
        value: onPremiseDate
      }] : []),
      ...(onPremiseLocation ? [{
        display_name: "On-Premise Location",
        variable_name: "on_premise_location",
        value: onPremiseLocation
      }] : []),
    ]
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    setIsProcessing(true);
    router.push(`/book/success?creator=${encodeURIComponent(creatorUsername)}`);
  };

  const onClose = () => {
    console.log("Paystack Modal closed.");
  };

  const startPayment = () => {
    try {
      if (!isMounted) return;
      initializePayment({ onSuccess, onClose });
    } catch (e) {
      console.error("Payment initialization failed:", e);
    }
  }

  if (!isMounted) {
    return (
      <Button disabled size="lg" className="w-full h-12 text-lg font-semibold">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing Gateway...
      </Button>
    )
  }

  return (
    <Button 
      type="button" 
      size="lg" 
      className="w-full h-12 text-lg font-semibold" 
      onClick={startPayment}
      disabled={isSubmitting || isProcessing}
    >
      {(isSubmitting || isProcessing) ? (
        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
      ) : (
        `Confirm Payment of GHS ${(amount / 100).toFixed(2)}`
      )}
    </Button>
  )
}
