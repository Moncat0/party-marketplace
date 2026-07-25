import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { trackServer } from '@/lib/track-server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { profile_id, service_title, category_tags } = await request.json()
  if (!profile_id) return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })

  // Verify this profile belongs to the user
  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('id', profile_id)
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tags = (category_tags as string[] ?? []).join(', ')
  const prompt = `A fun, whimsical illustration of a party animal character — a cute anthropomorphic animal wearing a festive outfit — representing a "${service_title ?? 'party entertainer'}" in Stockholm. Style: bright, playful, flat illustration, warm colors. The character is excited and ready to party. Tags: ${tags || 'entertainment'}. No text, no words in the image.`

  try {
    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    const imageUrl = image.data[0]?.url
    if (!imageUrl) throw new Error('No image URL returned')

    // Download the image and upload to Supabase Storage
    const imageRes = await fetch(imageUrl)
    const imageBuffer = await imageRes.arrayBuffer()
    const storagePath = `portraits/${user.id}/${profile_id}.png`

    const { error: uploadError } = await supabase.storage
      .from('provider-photos')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('provider-photos')
      .getPublicUrl(storagePath)

    // Save URL to provider_profiles
    await supabase
      .from('provider_profiles')
      .update({ party_animal_portrait_url: publicUrl })
      .eq('id', profile_id)

    await trackServer('portrait_generated', { provider_id: profile_id }, user.id)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Portrait generation failed:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
