import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const subaccountSchema = z.object({
  bankCode: z.string().min(3, 'Bank code is required').max(10),
  accountNumber: z.string().regex(/^\d{10,}$/, 'Account number must be at least 10 digits'),
  accountName: z.string().min(2, 'Account name is required').max(100),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = subaccountSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { bankCode, accountNumber, accountName } = validated.data

    // Call Paystack API to create subaccount
    const paystackRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: accountName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: Number(process.env.PLATFORM_PERCENTAGE_CHARGE) || 6,
        description: `Subaccount for Influencer ${user.id}`,
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack error:', paystackData)
      return NextResponse.json(
        { error: 'Failed to create payment account. Please check your bank details and try again.' },
        { status: 400 }
      )
    }

    const subaccountCode = paystackData.data.subaccount_code

    // Update Supabase profile with the generated subaccount code
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        paystack_subaccount_code: subaccountCode,
        is_onboarded: true,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Account created but profile update failed. Please contact support.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subaccount_code: subaccountCode })
  } catch (error: any) {
    console.error('Subaccount creation unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
