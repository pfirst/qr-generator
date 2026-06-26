import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createMatrix } from './core/qr'
import { buildPayload } from './core/payloads'
import { renderSVG } from './core/renderer'
import { contrastScan, decodeRendered } from './core/verify'
import { copyQRToClipboard, downloadQR, printQR, type ExportFormat } from './core/export'
import { defaultFieldData, defaultStyle, type Ecc, type FieldData, type QRType } from './core/types'
import { fieldErrors } from './core/validate'
import { clearRecent, loadRecent, pushRecent, type RecentItem } from './recent'
import { Header } from './components/Header'
import { DataCard } from './components/DataCard'
import { QrPanel } from './components/QrPanel'
import { CheckExport } from './components/CheckExport'
import { HistoryCard } from './components/HistoryCard'
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

  const onLogoFile = useCallback(
    (f: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        patchStyle({ logo: String(reader.result), ecc: 'H' as Ecc })
        showToast('ฝังโลโก้แล้ว · ตั้ง EC เป็น H อัตโนมัติ')
      }
      reader.readAsDataURL(f)
    },
    [patchStyle, showToast],
  )

  // --- derived QR ---
  const payload = useMemo(() => buildPayload(type, data), [type, data])
  const errors = useMemo(() => fieldErrors(type, data), [type, data])
  const effEcc: Ecc = style.logo ? 'H' : style.ecc

  const matrix = useMemo(() => {
    if (!payload) return null
    try {
      return createMatrix(payload, effEcc)
    } catch {
      return null
    }
  }, [payload, effEcc])

  const svg = useMemo(() => (matrix ? renderSVG(matrix, style, style.size).svg : null), [matrix, style])
  const contrast = useMemo(() => contrastScan(style), [style])
  const ready = !!matrix

  // --- real decode check (debounced) ---
  useEffect(() => {
    if (!matrix) {
      setDecodeOk(null)
      return
    }
    let cancelled = false
    const t = window.setTimeout(() => {
      decodeRendered(matrix, style)
        .then((res) => !cancelled && setDecodeOk(res !== null))
        .catch(() => !cancelled && setDecodeOk(null))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [matrix, style])

  // --- combined warning message for the check card ---
  const warn = useMemo<string | null>(() => {
    if (payload && !matrix) return 'ข้อมูลยาวเกินกว่าจะสร้าง QR ได้ — ลองลดความยาวข้อมูล'
    if (decodeOk === false) return 'ตรวจแล้วสแกนไม่ติด — ลองเพิ่มความต่างของสี ลด shape ที่ซับซ้อน ลดขนาดโลโก้ หรือเพิ่มระดับ ECC'
    return contrast.warn
  }, [payload, matrix, decodeOk, contrast])

  // --- actions ---
  const recordRecent = useCallback(() => setRecent((r) => pushRecent(r, type, data)), [type, data])

  const runExport = useCallback(
    async (fmt: ExportFormat) => {
      if (!matrix) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
      try {
        await downloadQR(matrix, style, exportSize, fmt, type)
        recordRecent()
        showToast('ดาวน์โหลด ' + fmt.toUpperCase() + ' แล้ว')
      } catch {
        showToast('เกิดข้อผิดพลาดในการส่งออก')
      }
    },
    [matrix, style, exportSize, type, recordRecent, showToast],
  )

  const onCopy = useCallback(async () => {
    if (!matrix) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
    try {
      await copyQRToClipboard(matrix, style, exportSize)
      recordRecent()
      showToast('คัดลอกรูปไปคลิปบอร์ดแล้ว')
    } catch {
      showToast('เบราว์เซอร์ไม่รองรับการคัดลอกรูป')
    }
  }, [matrix, style, exportSize, recordRecent, showToast])

  const onPrint = useCallback(async () => {
    if (!matrix) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
    try {
      await printQR(matrix, style, exportSize)
    } catch {
      showToast('เปิดหน้าต่างพิมพ์ไม่ได้ (อาจถูกบล็อก popup)')
    }
  }, [matrix, style, exportSize, showToast])

  const onTestScan = useCallback(async () => {
    if (!matrix) return showToast('กรุณากรอกข้อมูลให้ครบก่อน')
    try {
      const res = await decodeRendered(matrix, style)
      setDecodeOk(res !== null)
      showToast(res !== null ? 'ทดสอบแล้ว · สแกนติด ✓' : 'ทดสอบแล้ว · สแกนไม่ติด')
    } catch {
      showToast('ทดสอบสแกนไม่สำเร็จ')
    }
  }, [matrix, style, showToast])

  const onLoadRecent = useCallback(
    (r: RecentItem) => {
      setType(r.type)
      setData(r.data)
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
        <Header />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <DataCard
              type={type}
              onPickType={setType}
              data={data}
              errors={errors}
              setData={patchData}
              setIn={setIn}
              style={style}
              patchStyle={patchStyle}
              onLogoFile={onLogoFile}
            />
          </div>

          <div className="relative z-20 order-2 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
            <QrPanel svg={svg} hasData={ready} style={style} patchStyle={patchStyle} />
          </div>

          <div className="order-3 lg:col-start-2 lg:row-start-2">
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
              onTestScan={onTestScan}
            />
          </div>

          <div className="order-4 lg:col-start-1 lg:row-start-2">
            <HistoryCard recent={recent} onLoad={onLoadRecent} onClear={onClearRecent} />
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}
