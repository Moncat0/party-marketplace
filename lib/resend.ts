import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'FESTEN. <onboarding@resend.dev>'

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

export async function sendBookingAccepted(
  to: string,
  plannerName: string,
  providerName: string,
  bookingId: string,
  priceOre?: number | null
) {
  const priceSek = priceOre ? Math.round(priceOre / 100).toLocaleString('sv-SE') : null
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${providerName} har accepterat din förfrågan! 🎉`,
    html: `
      <p>Hej ${plannerName}!</p>
      <p><strong>${providerName}</strong> har accepterat din förfrågan.</p>
      ${priceSek ? `
      <p>Pris för bokningen: <strong>${priceSek} kr</strong></p>
      <p><a href="${siteUrl()}/planner/bookings" style="background:#FF6B35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Betala ${priceSek} kr →</a></p>
      ` : `
      <p><a href="${siteUrl()}/booking/${bookingId}/messages">Öppna konversationen →</a></p>
      `}
      <p>/ FESTEN.</p>
    `,
  })
}

export async function sendBookingDeclined(
  to: string,
  plannerName: string,
  providerName: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Uppdatering om din förfrågan`,
    html: `
      <p>Hej ${plannerName}!</p>
      <p>${providerName} kunde tyvärr inte ta din förfrågan den här gången.</p>
      <p><a href="${siteUrl()}">Hitta fler talanger på FESTEN. →</a></p>
      <p>/ FESTEN.</p>
    `,
  })
}

export async function sendProviderInvite(
  to: string,
  inviterName: string,
  message: string | null
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} vill se dig på FESTEN.`,
    html: `
      <p>Hej!</p>
      <p><strong>${inviterName}</strong> tänkte på dig och vill att du skapar en profil på FESTEN. — ett nytt sätt att bli hittad av arrangörer i Stockholm.</p>
      ${message ? `<p>"${message}"</p>` : ''}
      <p>Det är helt gratis och tar bara några minuter.</p>
      <p><a href="${siteUrl()}/signup?intent=provider&next=/onboarding">Skapa din profil →</a></p>
      <p>/ FESTEN.</p>
    `,
  })
}

export async function sendReviewReminder(
  to: string,
  recipientName: string,
  otherName: string,
  bookingId: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Hur gick det? Lämna ett omdöme om ${otherName}`,
    html: `
      <p>Hej ${recipientName}!</p>
      <p>Vi hoppas att evenemanget gick bra! Ta ett ögonblick och lämna ett omdöme om <strong>${otherName}</strong> — det hjälper andra att hitta rätt talang.</p>
      <p><a href="${siteUrl()}/review/${bookingId}">Lämna omdöme →</a></p>
      <p>/ FESTEN.</p>
    `,
  })
}

export async function sendNewMessage(
  to: string,
  senderName: string,
  bookingId: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nytt meddelande från ${senderName}`,
    html: `
      <p>Du har ett nytt meddelande från <strong>${senderName}</strong>.</p>
      <p><a href="${siteUrl()}/booking/${bookingId}/messages">Läs och svara →</a></p>
      <p>/ FESTEN.</p>
    `,
  })
}

export async function sendDataExportReady(
  to: string,
  name: string,
  jsonPayload: string
) {
  const filename = `festen-data-export-${new Date().toISOString().slice(0, 10)}.json`
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Din personuppgiftsexport från FESTEN.',
    html: `
      <p>Hej ${name}!</p>
      <p>Här är den personuppgiftsexport du begärde från FESTEN. Filen bifogas som JSON.</p>
      <p>Om du inte begärde detta, kontakta oss via <a href="${siteUrl()}/privacy">integritetssidan</a>.</p>
      <p>/ FESTEN.</p>
    `,
    attachments: [
      {
        filename,
        content: Buffer.from(jsonPayload, 'utf-8'),
      },
    ],
  })
}
