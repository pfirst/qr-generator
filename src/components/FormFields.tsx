import { extractLatLng } from '../core/payloads'
import type { FieldData, ProxyType, QRType, WifiEnc } from '../core/types'
import type { FieldErrors } from '../core/validate'
import { CheckIcon } from '../ui/icons'
import { Field, Label, SegGroup, TextArea, Toggle } from '../ui/controls'

const WIFI_ENC: { id: WifiEnc; label: string }[] = [
  { id: 'WPA', label: 'WPA/WPA2' },
  { id: 'WEP', label: 'WEP' },
  { id: 'nopass', label: 'ไม่มี' },
]
const PROXY: { id: ProxyType; label: string }[] = [
  { id: 'phone', label: 'เบอร์มือถือ' },
  { id: 'natid', label: 'เลขบัตร ปชช.' },
  { id: 'ewallet', label: 'e-Wallet' },
]
const PROXY_LABEL: Record<ProxyType, [string, string]> = {
  phone: ['เบอร์มือถือ', '0812345678'],
  natid: ['เลขบัตรประชาชน', '1234567890123'],
  ewallet: ['e-Wallet ID', 'รหัส e-Wallet'],
}

interface Props {
  type: QRType
  data: FieldData
  errors: FieldErrors
  setData: (partial: Partial<FieldData>) => void
  setIn: <K extends keyof FieldData>(key: K, value: FieldData[K]) => void
}

export function FormFields({ type, data, errors, setData, setIn }: Props) {
  switch (type) {
    case 'url':
      return <Field label="ลิงก์ปลายทาง (URL)" value={data.url} onChange={(v) => setData({ url: v })} placeholder="https://example.com" type="url" error={errors.url} />

    case 'text':
      return <TextArea label="ข้อความ" value={data.text} onChange={(v) => setData({ text: v })} rows={5} placeholder="พิมพ์ข้อความที่ต้องการ…" />

    case 'email':
      return (
        <div className="flex flex-col gap-3.5">
          <Field label="อีเมลผู้รับ" value={data.email.to} onChange={(v) => setIn('email', { ...data.email, to: v })} placeholder="name@example.com" error={errors.email} />
          <Field label="หัวข้อ" value={data.email.subject} onChange={(v) => setIn('email', { ...data.email, subject: v })} placeholder="เรื่อง…" />
          <TextArea label="ข้อความ" value={data.email.body} onChange={(v) => setIn('email', { ...data.email, body: v })} rows={3} placeholder="เนื้อหาอีเมล…" />
        </div>
      )

    case 'sms':
      return (
        <div className="flex flex-col gap-3.5">
          <Field label="เบอร์ปลายทาง" value={data.sms.phone} onChange={(v) => setIn('sms', { ...data.sms, phone: v })} placeholder="0812345678" mono error={errors.smsPhone} />
          <TextArea label="ข้อความ" value={data.sms.message} onChange={(v) => setIn('sms', { ...data.sms, message: v })} rows={3} placeholder="ข้อความ SMS…" />
        </div>
      )

    case 'tel':
      return <Field label="เบอร์โทรศัพท์" value={data.tel} onChange={(v) => setData({ tel: v })} placeholder="0812345678" mono error={errors.tel} />

    case 'wifi':
      return (
        <div className="flex flex-col gap-3.5">
          <Field label="ชื่อเครือข่าย (SSID)" value={data.wifi.ssid} onChange={(v) => setIn('wifi', { ...data.wifi, ssid: v })} placeholder="MyWiFi" />
          <Field label="รหัสผ่าน" value={data.wifi.password} onChange={(v) => setIn('wifi', { ...data.wifi, password: v })} placeholder="รหัส Wi-Fi" mono />
          <div>
            <Label>ประเภทการเข้ารหัส</Label>
            <SegGroup options={WIFI_ENC} value={data.wifi.encryption} onChange={(v) => setIn('wifi', { ...data.wifi, encryption: v })} />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-[#cfcfe0]">
            <Toggle on={data.wifi.hidden} onChange={(v) => setIn('wifi', { ...data.wifi, hidden: v })} />
            เครือข่ายซ่อน (Hidden)
          </label>
        </div>
      )

    case 'vcard':
      return (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ชื่อ" value={data.vcard.first} onChange={(v) => setIn('vcard', { ...data.vcard, first: v })} />
            <Field label="นามสกุล" value={data.vcard.last} onChange={(v) => setIn('vcard', { ...data.vcard, last: v })} />
            <Field label="เบอร์โทร" value={data.vcard.phone} onChange={(v) => setIn('vcard', { ...data.vcard, phone: v })} mono />
            <Field label="อีเมล" value={data.vcard.email} onChange={(v) => setIn('vcard', { ...data.vcard, email: v })} />
            <Field label="บริษัท" value={data.vcard.org} onChange={(v) => setIn('vcard', { ...data.vcard, org: v })} />
            <Field label="ตำแหน่ง" value={data.vcard.title} onChange={(v) => setIn('vcard', { ...data.vcard, title: v })} />
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="เว็บไซต์" value={data.vcard.url} onChange={(v) => setIn('vcard', { ...data.vcard, url: v })} placeholder="https://…" />
            <Field label="ที่อยู่" value={data.vcard.address} onChange={(v) => setIn('vcard', { ...data.vcard, address: v })} />
          </div>
        </div>
      )

    case 'geo':
      return (
        <div className="flex flex-col gap-3.5">
          <Field
            label="วางลิงก์ Google Maps (จะดึงพิกัดอัตโนมัติ)"
            value={data.geo.maps}
            onChange={(v) => {
              const m = extractLatLng(v)
              setData({ geo: { ...data.geo, maps: v, ...(m ?? {}) } })
            }}
            placeholder="https://maps.google.com/…"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ละติจูด" value={data.geo.lat} onChange={(v) => setIn('geo', { ...data.geo, lat: v })} placeholder="13.7563" mono />
            <Field label="ลองจิจูด" value={data.geo.lng} onChange={(v) => setIn('geo', { ...data.geo, lng: v })} placeholder="100.5018" mono />
          </div>
          {errors.geo && <div className="text-[12px] text-[#ff8aae]">{errors.geo}</div>}
        </div>
      )

    case 'promptpay': {
      const [plabel, pplaceholder] = PROXY_LABEL[data.promptpay.proxyType]
      return (
        <div className="flex flex-col gap-3.5">
          <div>
            <Label>ชนิดพร็อกซี</Label>
            <SegGroup options={PROXY} value={data.promptpay.proxyType} onChange={(v) => setIn('promptpay', { ...data.promptpay, proxyType: v })} />
          </div>
          <Field label={plabel} value={data.promptpay.proxyValue} onChange={(v) => setIn('promptpay', { ...data.promptpay, proxyValue: v })} placeholder={pplaceholder} mono error={errors.ppProxy} />
          <Field label="จำนวนเงิน (บาท) — เว้นว่างได้ = จ่ายปลายเปิด" value={data.promptpay.amount} onChange={(v) => setIn('promptpay', { ...data.promptpay, amount: v })} placeholder="0.00" mono inputMode="decimal" error={errors.ppAmount} />
          <Field label="รหัสร้านค้า / อ้างอิง (ไม่บังคับ)" value={data.promptpay.storeLabel} onChange={(v) => setIn('promptpay', { ...data.promptpay, storeLabel: v })} placeholder="เช่น 223620406Y0858478ZM" mono />
          <div className="flex items-start gap-2.5 rounded-[12px] border border-[#5ee6a8]/20 bg-[#5ee6a8]/[0.07] px-3 py-[11px]">
            <CheckIcon size={15} className="mt-px shrink-0 text-[#5ee6a8]" />
            <span className="text-[12px] leading-[1.55] text-white/60">สร้างตามมาตรฐาน EMVCo (PromptPay) พร้อม checksum CRC16 — สแกนได้ในแอปธนาคารไทยทุกแอป</span>
          </div>
        </div>
      )
    }

    case 'bill':
      return (
        <div className="flex flex-col gap-3.5">
          <Field label="Biller ID (เลขประจำตัวผู้รับชำระ)" value={data.bill.billerId} onChange={(v) => setIn('bill', { ...data.bill, billerId: v })} placeholder="เช่น 010556012345601" mono error={errors.billId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ref 1" value={data.bill.ref1} onChange={(v) => setIn('bill', { ...data.bill, ref1: v })} mono />
            <Field label="Ref 2 (ออปชัน)" value={data.bill.ref2} onChange={(v) => setIn('bill', { ...data.bill, ref2: v })} mono />
          </div>
          <Field label="จำนวนเงิน (บาท) — เว้นว่างได้" value={data.bill.amount} onChange={(v) => setIn('bill', { ...data.bill, amount: v })} placeholder="0.00" mono inputMode="decimal" error={errors.billAmount} />
        </div>
      )
  }
}
