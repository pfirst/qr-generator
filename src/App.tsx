import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createMatrix } from './core/qr'
import { buildPayload } from './core/payloads'
import { renderQrSvg, type RenderInput } from './core/render'
import { contrastScan, decodeRendered } from './core/verify'
import { copyQRToClipboard, downloadQR, printQR, type ExportFormat } from './core/export'
import { defaultFieldData, defaultStyle, type Ecc, type FieldData, type QRType } from './core/types'
import { defaultPresetOn, defaultPresetBg, resolveLogo } from './core/logoPreset'
import { fieldErrors } from './core/validate'
import { clearRecent, loadRecent, pushRecent, type RecentItem } from './recent'
import { Header } from './components/Header'
import { DataCard } from './components/DataCard'
import { QrPanel } from './components/QrPanel'
import { CheckExport } from './components/CheckExport'
import { Toast } from './components/Toast'

export default function App() {
  const [type, setType] = useState<QRType>('url')
  const [data, setData] = useState<FieldData>(defaultFieldData)
  const [style, setStyle] = useState(defaultStyle)
  const [exportSize, setExportSize] = useState(1024)
  const [recent, setRecent] = useState<RecentItem[]>(loadRecent)
  const [toast, setToast] = useState<string | null>(null)
  const [decodeOk, setDecodeOk] = useState<boolean | null>(null)

  const toastTimer = useRef<number | undefined>(undefined)
  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  // --- state patch helpers ---
  const patchData = useCallback((partial: Partial<FieldData>) => setData((p) => ({ ...p, ...partial })), [])
  const setIn = useCallback(
    <K extends keyof FieldData>(key: K, value: FieldData[K]) => setData((p) => ({ ...p, [key]: value })),
    [],
  )
  const patchStyle = useCallback((p: Partial<typeof style>) => setStyle((prev) => ({ ...prev, ...p })), [])

  // Switching type resets the preset toggle to that type's default — unless a
  // custom upload is present (custom wins, preset stays off).
  const pickType = useCallback(
    (t: QRType) => {
      setType(t)
      if (!style.logo) {
        const on = defaultPresetOn(t)
        patchStyle({ presetLogo: on, ...(on ? { logoBg: defaultPresetBg(t) } : {}) })
      }
    },
    [style.logo, patchStyle],
  )

  // Deleting the custom upload restores the type's default preset.
  const onRemoveLogo = useCallback(() => {
    const on = defaultPresetOn(type)
    patchStyle({ logo: null, presetLogo: on, ...(on ? { logoBg: defaultPresetBg(type) } : {}) })
  }, [type, patchStyle])

  const onLogoFile = useCallback(
    (f: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        patchStyle({ logo: String(reader.result), ecc: 'H' as Ecc, presetLogo: false })
        showToast('ฝังโลโก้แล้ว · ตั้ง EC เป็น H อัตโนมัติ')
      }
      reader.readAsDataURL(f)
    },
    [patchStyle, showToast],
  )

  // --- derived QR ---
  const payload = useMemo(() => buildPayload(type, data), [type, data])
  const errors = useMemo(() => fieldErrors(type, data), [type, data])
  const effLogo = useMemo(() => resolveLogo(type, data, style), [type, data, style])
  const renderStyle = useMemo(() => ({ ...style, logo: effLogo }), [style, effLogo])
  const effEcc: Ecc = effLogo ? 'H' : style.ecc

  const matrix = useMemo(() => {
    if (!payload) return null
    try {
      return createMatrix(payload, effEcc)
    } catch {
      return null
    }
  }, [payload, effEcc])

  // Everything the renderer/export/verify need, derived once per matrix.
  const renderInput = useMemo<RenderInput | null>(
    () => (matrix ? { data: payload, ecc: effEcc, count: matrix.size } : null),
    [matrix, payload, effEcc],
  )

  // SVG render is async now (qr-code-styling), so it lives in state.
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    if (!renderInput) {
      setSvg(null)
      return
    }
    let cancelled = false
    renderQrSvg(renderInput.data, renderInput.ecc, renderStyle, renderStyle.size, renderInput.count)
      .then((s) => !cancelled && setSvg(s))
      .catch(() => !cancelled && setSvg(null))
    return () => {
      cancelled = true
    }
  }, [renderInput, renderStyle])

  const contrast = useMemo(() => contrastScan(style), [style])
  const ready = !!renderInput

  // --- real decode check (debounced) ---
  useEffect(() => {
    if (!renderInput) {
      setDecodeOk(null)
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      decodeRendered(renderInput, renderStyle)
        .then((res) => !cancelled && setDecodeOk(res !== null))
        .catch(() => !cancelled && setDecodeOk(null))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [renderInput, renderStyle])

  // --- combined warning message for the check card ---
  const warn = useMemo<string | null>(() => {
    if (payload && !matrix) return 'ข้อมูลยาวเกินกว่าจะสร้าง QR ได้ — ลองลดความยาวข้อมูล'
    if (decodeOk === false) return 'ตรวจแล้วสแกนไม่ติด — ลองเพิ่มความต่างของสี ลด shape ที่ซับซ้อน ลดขนาดโลโก้ หรือเพิ่มระดับ ECC'
    return contrast.warn
  }, [payload, matrix, decodeOk, contrast])

  // --- actions ---
  const recordRecent = useCallback(() => setRecent((r) => pushRecent(r, type, data, style)), [type, data, style])

  const runExport = useCallback(
    async (fmt: ExportFormat) => {
      if (!renderInput) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
      try {
        await downloadQR(renderInput, renderStyle, exportSize, fmt, type)
        recordRecent()
        showToast('ดาวน์โหลด ' + fmt.toUpperCase() + ' แล้ว')
      } catch {
        showToast('เกิดข้อผิดพลาดในการส่งออก')
      }
    },
    [renderInput, renderStyle, exportSize, type, recordRecent, showToast],
  )

  const onCopy = useCallback(async () => {
    if (!renderInput) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
    try {
      await copyQRToClipboard(renderInput, renderStyle, exportSize)
      recordRecent()
      showToast('คัดลอกรูปไปคลิปบอร์ดแล้ว')
    } catch {
      showToast('เบราว์เซอร์ไม่รองรับการคัดลอกรูป')
    }
  }, [renderInput, renderStyle, exportSize, recordRecent, showToast])

  const onPrint = useCallback(async () => {
    if (!renderInput) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
    try {
      await printQR(renderInput, renderStyle, exportSize)
    } catch {
      showToast('เปิดหน้าต่างพิมพ์ไม่ได้ (อาจถูกบล็อก popup)')
    }
  }, [renderInput, renderStyle, exportSize, showToast])

  const onLoadRecent = useCallback(
    (r: RecentItem) => {
      setType(r.type)
      setData(r.data)
      setStyle(r.style)
      showToast('โหลดค่าจากประวัติแล้ว')
    },
    [showToast],
  )

  const onClearRecent = useCallback(() => {
    setRecent(clearRecent())
    showToast('ล้างประวัติแล้ว')
  }, [showToast])

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto max-w-[1340px] px-4 py-6 sm:px-6 sm:py-8">
        <Header recent={recent} onLoad={onLoadRecent} onClear={onClearRecent} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
          <div className="order-1">
            <DataCard
              type={type}
              onPickType={pickType}
              data={data}
              errors={errors}
              setData={patchData}
              setIn={setIn}
              style={style}
              patchStyle={patchStyle}
              onLogoFile={onLogoFile}
              onRemoveLogo={onRemoveLogo}
            />
          </div>

          <div className="order-2 flex flex-col gap-5 lg:sticky lg:top-6 lg:gap-6 lg:self-start">
            <div className="relative z-20">
              <QrPanel svg={svg} hasData={ready} style={renderStyle} patchStyle={patchStyle} />
            </div>
            <CheckExport
              ready={ready}
              contrastLevel={contrast.level}
              scanOk={decodeOk}
              warn={warn}
              exportSize={exportSize}
              setExportSize={setExportSize}
              onDownload={runExport}
              onCopy={onCopy}
              onPrint={onPrint}
            />
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}
