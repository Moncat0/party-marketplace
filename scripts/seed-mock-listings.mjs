/**
 * Seed mock provider listings, extra photos, and ~10 reviews per provider.
 * Run: node scripts/seed-mock-listings.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim()
if (!url || !key) throw new Error('Missing Supabase env vars in .env.local')

const sb = createClient(url, key, { auth: { persistSession: false } })

const PHOTO_SETS = {
  makeup: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
    'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800&q=80',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&q=80',
  ],
  dj: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  ],
  photo: [
    'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
    'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80',
  ],
  music: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  ],
  catering: [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
  ],
  kids: [
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
    'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800&q=80',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80',
    'https://images.unsplash.com/photo-1464047736614-af63643285bf?w=800&q=80',
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
  ],
  wedding: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
  ],
}

const NEW_PROVIDERS = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Erik Holm',
    email: 'erik.holm@example.com',
    title: 'Akustisk duo — gitarr & sång',
    description:
      'Vi spelar akustisk pop, indie och svenska klassiker på bröllop, privata middagar och företagsevent. Diskret setup, trevlig stämning och spellista som anpassas efter dig.',
    tags: ['musik', 'artist', 'sångare', 'bröllop'],
    city: 'Stockholm',
    min: 3500,
    max: 9000,
    photos: PHOTO_SETS.music,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Lisa Nyström',
    email: 'lisa.nystrom@example.com',
    title: 'Privatkock för festmiddagar',
    description:
      'Säsongsbaserade menyer hemma hos dig — från intim middag för 8 till mingelbuffé för 40. Jag tar med allt utom köket. Populär för födelsedagar och företagsmiddagar.',
    tags: ['catering', 'kock', 'mat'],
    city: 'Stockholm',
    min: 4000,
    max: 12000,
    photos: PHOTO_SETS.catering,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Johan Falk',
    email: 'johan.falk@example.com',
    title: 'Trollkarl & close-up magi',
    description:
      'Interaktiv magi som får gästerna att skratta och häpna. Perfekt för mingel, barnkalas och företagsfester. 45–90 minuter, helt utan teknikstrul.',
    tags: ['underhållning', 'trollkonstnär', 'barnkalas'],
    city: 'Stockholm',
    min: 2500,
    max: 5500,
    photos: PHOTO_SETS.entertainment,
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Maja Sandberg',
    email: 'maja.sandberg@example.com',
    title: 'Barnkalasvärd med lekar & show',
    description:
      'Jag tar hand om hela barnprogrammet: lekar, ansiktsmålning och en kort show. Föräldrarna kan njuta — barnen har fullt upp. Åldrar 4–10 år.',
    tags: ['barnkalas', 'barn', 'barnunderhållning', 'underhållning'],
    city: 'Stockholm',
    min: 2000,
    max: 4500,
    photos: PHOTO_SETS.kids,
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'Nora Ahlgren',
    email: 'nora.ahlgren@example.com',
    title: 'Bröllopskoordinator & ceremoni',
    description:
      'Från tidslinje till blomsterleverans — jag håller ihop dagen så ni kan vara närvarande. Specialiserad på intima bröllop i Stockholm och skärgården.',
    tags: ['bröllop', 'wedding'],
    city: 'Stockholm',
    min: 8000,
    max: 25000,
    photos: PHOTO_SETS.wedding,
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Kim Andersson',
    email: 'kim.andersson@example.com',
    title: 'Saxofonist för lounge & fest',
    description:
      'Live-saxofon till DJ, brunch eller ceremoni. Smooth jazz, soul och moderna hits. Jag anpassar volym och stil efter stämningen i rummet.',
    tags: ['musik', 'artist', 'bröllop'],
    city: 'Stockholm',
    min: 3000,
    max: 7000,
    photos: PHOTO_SETS.music,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Sara Viklund',
    email: 'sara.viklund@example.com',
    title: 'Eventfotograf — fest & företag',
    description:
      'Dokumentär stil med fokuslig färg. Jag jobbar snabbt i trånga lokaler och levererar ett urval samma kväll plus fullt galleri inom en vecka.',
    tags: ['fotografi', 'fotograf', 'företagsevent', 'födelsedag'],
    city: 'Stockholm',
    min: 2800,
    max: 7500,
    photos: PHOTO_SETS.photo,
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Alex Berg',
    email: 'alex.berg@example.com',
    title: 'Wedding DJ med ceremonimusik',
    description:
      'Från gången till dansgolvet. Jag tar med trådlös mick, speglade ljus och en spellista ni godkänt i förväg. Inga döda zoner på dansgolvet.',
    tags: ['dj', 'DJ', 'bröllop', 'musik'],
    city: 'Stockholm',
    min: 4500,
    max: 11000,
    photos: PHOTO_SETS.dj,
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Ellen Moss',
    email: 'ellen.moss@example.com',
    title: 'Bridal makeup & hårstyling',
    description:
      'Brudmakeup, brudtärnor och trial ingår i de flesta paket. Naturligt glow eller glam — alltid fotovänligt och hållbart hela natten.',
    tags: ['makeup', 'makeupartist', 'styling', 'bröllop'],
    city: 'Stockholm',
    min: 2200,
    max: 6500,
    photos: PHOTO_SETS.makeup,
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Oscar Lind',
    email: 'oscar.lind@example.com',
    title: 'Catering — tapas & mingel',
    description:
      'Smårätter, dryckesstation och serveringsteam. Populärt för vernissage, kickoff och stora födelsedagar. Vegetariskt och allergenvänligt utan krångel.',
    tags: ['catering', 'mat', 'företagsevent'],
    city: 'Stockholm',
    min: 5000,
    max: 18000,
    photos: PHOTO_SETS.catering,
  },
]

const PLANNER_NAMES = [
  ['Emma Karlsson', 'emma.k@example.com'],
  ['Lucas Bergman', 'lucas.b@example.com'],
  ['Ida Sjöberg', 'ida.s@example.com'],
  ['Noah Persson', 'noah.p@example.com'],
  ['Wilma Öberg', 'wilma.o@example.com'],
  ['Hugo Dahl', 'hugo.d@example.com'],
  ['Alice Ström', 'alice.s@example.com'],
  ['William Åkesson', 'william.a@example.com'],
  ['Ella Forsberg', 'ella.f@example.com'],
  ['Leo Månsson', 'leo.m@example.com'],
  ['Vera Lindqvist', 'vera.l@example.com'],
  ['Felix Holmgren', 'felix.h@example.com'],
]

const REVIEW_COMMENTS = [
  'Absolut fantastiskt! Professionellt, trevligt och leveransen överträffade förväntningarna.',
  'SuperNöjd — gästerna pratade om det resten av kvällen. Bokar igen!',
  'Smoth kommunikation och hög kvalitet. Kändes tryggt hela vägen.',
  'Väldigt bra, bara några små justeringar men totalt sett ett klart ja.',
  'Gjorde vår fest minnesvärd. Rekommenderas varmt till alla i Stockholm.',
  'Punktlig, lyhörd och riktigt duktig. Fem stjärnor utan tvekan.',
  'Perfekt för vårt bröllop — diskret och proffsigt. Tack!',
  'Barnen (och vi) älskade det. Enkelt att boka och tydlig info.',
  'Bra värde för pengarna och fin energi. Kommer tipsa vänner.',
  'Otroligt nöjd. Bilder/resultatet blev ännu bättre än vi hoppats.',
  'Flexibel när planen ändrades sista minuten. Riktigt proffs.',
  'Höjde hela stämningen. Skulle boka igen imorgon om det gick.',
]

const EVENT_TYPES = ['birthday', 'wedding', 'corporate', 'kids', 'other']
const LOCATIONS = [
  'Södermalm, Stockholm',
  'Östermalm, Stockholm',
  'Vasastan, Stockholm',
  'Nacka',
  'Lidingö',
  'Solna',
  'Hammarby Sjöstad',
  'Djurgården',
]

function plannerId(i) {
  return `e0000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function mergePhotos(existing, extras, max = 5) {
  const out = [...(existing || [])]
  for (const url of extras) {
    if (out.length >= max) break
    if (!out.includes(url)) out.push(url)
  }
  return out
}

function photoSetForTags(tags = []) {
  const t = tags.map(x => x.toLowerCase())
  if (t.some(x => x.includes('makeup') || x.includes('smink') || x.includes('styling'))) return PHOTO_SETS.makeup
  if (t.some(x => x === 'dj' || x.includes('dj'))) return PHOTO_SETS.dj
  if (t.some(x => x.includes('foto'))) return PHOTO_SETS.photo
  if (t.some(x => x.includes('catering') || x.includes('kock') || x.includes('mat'))) return PHOTO_SETS.catering
  if (t.some(x => x.includes('barn'))) return PHOTO_SETS.kids
  if (t.some(x => x.includes('bröllop') || x.includes('wedding'))) return PHOTO_SETS.wedding
  if (t.some(x => x.includes('underhåll') || x.includes('troll') || x.includes('komik'))) return PHOTO_SETS.entertainment
  if (t.some(x => x.includes('musik') || x.includes('artist') || x.includes('sång'))) return PHOTO_SETS.music
  return PHOTO_SETS.entertainment
}

async function upsertUsers(rows) {
  const { error } = await sb.from('users').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`users upsert: ${error.message}`)
}

async function ensureReviewsForProvider(profile, planners, target = 10) {
  const { count, error: cErr } = await sb
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewee_id', profile.user_id)
  if (cErr) throw new Error(`review count: ${cErr.message}`)

  const needed = Math.max(0, target - (count || 0))
  if (needed === 0) {
    console.log(`  reviews ok (${count}) — ${profile.service_title}`)
    return
  }

  for (let i = 0; i < needed; i++) {
    const planner = planners[i % planners.length]
    const eventDate = daysAgo(30 + i * 17 + (profile.id.charCodeAt(0) % 7))

    const { data: booking, error: bErr } = await sb
      .from('booking_requests')
      .insert({
        planner_id: planner.id,
        provider_profile_id: profile.id,
        event_date: eventDate,
        event_location: LOCATIONS[(i + profile.id.length) % LOCATIONS.length],
        guest_count: 20 + ((i * 7) % 80),
        event_type: EVENT_TYPES[i % EVENT_TYPES.length],
        description: `Mockbokning för recension (${i + 1})`,
        status: 'completed',
        payment_status: 'paid',
      })
      .select('id')
      .single()
    if (bErr) throw new Error(`booking insert: ${bErr.message}`)

    const rating = i % 7 === 0 ? 4 : 5
    const { error: rErr } = await sb.from('reviews').insert({
      booking_request_id: booking.id,
      reviewer_id: planner.id,
      reviewee_id: profile.user_id,
      rating,
      comment: REVIEW_COMMENTS[(i + profile.user_id.charCodeAt(0)) % REVIEW_COMMENTS.length],
      created_at: new Date(Date.now() - (i + 3) * 86400000).toISOString(),
    })
    if (rErr) throw new Error(`review insert: ${rErr.message}`)
  }
  console.log(`  +${needed} reviews — ${profile.service_title}`)
}

async function main() {
  console.log('Seeding mock listings…')

  // 1) Mock planners for reviews
  const plannerRows = PLANNER_NAMES.map(([name, email], i) => ({
    id: plannerId(i),
    email,
    name,
    user_type: 'planner',
    auth_provider: 'email',
    signup_source: 'organic',
  }))
  await upsertUsers(plannerRows)
  console.log(`Upserted ${plannerRows.length} mock planners`)

  // 2) New mock providers + profiles
  await upsertUsers(
    NEW_PROVIDERS.map(p => ({
      id: p.id,
      email: p.email,
      name: p.name,
      user_type: 'provider',
      auth_provider: 'email',
      signup_source: 'organic',
    }))
  )

  for (const p of NEW_PROVIDERS) {
    const { data: existing } = await sb
      .from('provider_profiles')
      .select('id')
      .eq('user_id', p.id)
      .maybeSingle()

    if (existing) {
      const { error } = await sb
        .from('provider_profiles')
        .update({
          service_title: p.title,
          service_description: p.description,
          category_tags: p.tags,
          city: p.city,
          price_range_min: p.min,
          price_range_max: p.max,
          photos: p.photos,
          is_published: true,
        })
        .eq('id', existing.id)
      if (error) throw new Error(`profile update ${p.name}: ${error.message}`)
      console.log(`Updated listing: ${p.title}`)
    } else {
      const { error } = await sb.from('provider_profiles').insert({
        user_id: p.id,
        service_title: p.title,
        service_description: p.description,
        category_tags: p.tags,
        city: p.city,
        price_range_min: p.min,
        price_range_max: p.max,
        photos: p.photos,
        is_published: true,
        profile_views: 40 + Math.floor(Math.random() * 200),
      })
      if (error) throw new Error(`profile insert ${p.name}: ${error.message}`)
      console.log(`Created listing: ${p.title}`)
    }
  }

  // 3) Enrich photos on existing published listings
  const { data: published, error: pErr } = await sb
    .from('provider_profiles')
    .select('id, user_id, service_title, category_tags, photos, is_published')
    .eq('is_published', true)
  if (pErr) throw new Error(pErr.message)

  for (const profile of published) {
    const merged = mergePhotos(profile.photos, photoSetForTags(profile.category_tags), 5)
    if (merged.length !== (profile.photos || []).length || merged.some((u, i) => u !== profile.photos?.[i])) {
      const { error } = await sb.from('provider_profiles').update({ photos: merged }).eq('id', profile.id)
      if (error) throw new Error(`photos update: ${error.message}`)
      console.log(`Photos → ${merged.length}: ${profile.service_title}`)
    }
  }

  // 4) ~10 reviews per published provider
  const planners = plannerRows.map(p => ({ id: p.id }))
  const { data: allPublished, error: aErr } = await sb
    .from('provider_profiles')
    .select('id, user_id, service_title')
    .eq('is_published', true)
  if (aErr) throw new Error(aErr.message)

  for (const profile of allPublished) {
    await ensureReviewsForProvider(profile, planners, 10)
  }

  // Summary
  const { count: listingCount } = await sb
    .from('provider_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
  const { count: reviewCount } = await sb.from('reviews').select('*', { count: 'exact', head: true })
  console.log('\nDone.')
  console.log(`Published listings: ${listingCount}`)
  console.log(`Total reviews: ${reviewCount}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
