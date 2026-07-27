import AccountLayout from '@/components/AccountLayout'
import { settingsLayout as L } from '@/components/settings/layout'

export const metadata = { title: 'Settings layout preview' }

/**
 * Unauthenticated layout preview for Playwright measurement.
 * Visit /dev/settings-layout — no login required.
 */
export default function SettingsLayoutPreviewPage() {
  return (
    <AccountLayout doneHref="/">
      <div
        data-settings-root
        className="grid w-full"
        style={{ gridTemplateColumns: `${L.navWidth}px minmax(0, 1fr)` }}
      >
        <aside
          data-settings-nav
          style={{
            borderRight: '1px solid #ebebeb',
            paddingRight: 24,
          }}
        >
          <h1 className="mb-6 text-[32px] font-semibold text-[#222222]">Kontoinställningar</h1>
          <div className="rounded-xl bg-[#f7f7f7] px-3 py-3 text-[16px] font-semibold text-[#222222]">
            Personlig information
          </div>
          <p className="mt-2 px-3 text-[14px] text-[#6a6a6a]">(layout preview)</p>
        </aside>

        <section data-settings-detail style={{ paddingLeft: L.panelGap }}>
          <div data-settings-form style={{ maxWidth: L.formMax }}>
            <h2 className="mb-6 text-[32px] font-semibold text-[#222222]">Personlig information</h2>
            <div className="space-y-0 border-t border-[#ebebeb]">
              {['Juridiskt namn', 'Föredraget förnamn', 'E-postadress', 'Telefonnummer', 'Bostadsadress'].map(
                label => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-8 border-b border-[#ebebeb] py-7"
                  >
                    <div>
                      <p className="text-[16px] font-medium text-[#222222]">{label}</p>
                      <p className="mt-1.5 text-[14px] text-[#6a6a6a]">Ej angivet</p>
                    </div>
                    <span className="text-[14px] font-medium underline">Lägg till</span>
                  </div>
                )
              )}
            </div>
            <div
              className="mt-10 rounded-xl border border-[#dddddd] p-6 text-[14px] text-[#6a6a6a]"
              data-settings-tip
            >
              Tip card preview — form max {L.formMax}px; shell uses marketplace Container gutters.
            </div>
          </div>
        </section>
      </div>
    </AccountLayout>
  )
}
