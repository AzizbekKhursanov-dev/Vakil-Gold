export const BRANCHES = [
  { id: "central", name: "Markaz (Ta'minotchi)", location: "Toshkent", isProvider: true },
  { id: "narpay", name: "Narpay", location: "Samarqand viloyati", isProvider: false },
  { id: "kitob", name: "Kitob", location: "Qashqadaryo viloyati", isProvider: false },
  { id: "bulungur", name: "Bulung'ur", location: "Samarqand viloyati", isProvider: false },
  { id: "qiziltepa", name: "Qizil Tepa", location: "Navoiy viloyati", isProvider: false },
]

export const CATEGORIES = [
  { id: "uzuk", name: "Uzuk", nameUz: "Uzuk" },
  { id: "sirga", name: "Sirg'a", nameUz: "Sirg'a" },
  { id: "bilakuzuk", name: "Bilakuzuk", nameUz: "Bilakuzuk" },
  { id: "zanjir", name: "Zanjir", nameUz: "Zanjir" },
  { id: "boshqa", name: "Boshqa", nameUz: "Boshqa" },
]

export const ITEM_STATUSES = [
  { id: "available", name: "Mavjud", color: "default" },
  { id: "sold", name: "Sotilgan", color: "secondary" },
  { id: "returned", name: "Qaytarilgan", color: "destructive" },
]

export const COLORS = [
  { id: "yellow", name: "Sariq oltin" },
  { id: "white", name: "Oq oltin" },
  { id: "rose", name: "Pushti oltin" },
  { id: "silver", name: "Kumush" },
  { id: "platinum", name: "Platina" },
]

export const PURITIES = [
  { id: "24k", name: "24K" },
  { id: "22k", name: "22K" },
  { id: "18k", name: "18K" },
  { id: "14k", name: "14K" },
  { id: "925", name: "925 Kumush" },
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const DEFAULT_PROFIT_PERCENTAGE = 20
export const DEFAULT_LOM_NARXI = 800000
export const DEFAULT_LOM_NARXI_KIRIM = 850000
export const DEFAULT_LABOR_COST = 70000
