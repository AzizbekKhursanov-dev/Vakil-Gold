/**
 * Calculate selling price based on weight, material costs, labor, and profit margin
 */
export function calculateSellingPrice(
  weight: number,
  lomNarxi: number,
  lomNarxiKirim: number,
  laborCost: number,
  profitPercentage: number,
  isProvider = false,
): number {
  if (!weight || weight <= 0) return 0

  // Use appropriate base price depending on inventory type
  const basePrice = isProvider ? lomNarxi : lomNarxiKirim

  // Calculate base cost (gold + labor)
  const goldCost = weight * basePrice
  const totalLaborCost = weight * laborCost
  const baseCost = goldCost + totalLaborCost

  // Apply profit margin
  const profitAmount = baseCost * (profitPercentage / 100)
  const sellingPrice = baseCost + profitAmount

  return Math.round(sellingPrice)
}

/**
 * Calculate profit amount and percentage
 */
export function calculateProfit(
  sellingPrice: number,
  weight: number,
  lomNarxi: number,
  lomNarxiKirim: number,
  laborCost: number,
  isProvider = false,
): { profitAmount: number; profitPercentage: number } {
  if (!weight || weight <= 0) return { profitAmount: 0, profitPercentage: 0 }

  const materialCostPerGram = isProvider ? lomNarxi : lomNarxiKirim
  const materialCost = weight * materialCostPerGram
  const laborTotal = weight * laborCost
  const totalCost = materialCost + laborTotal

  const profitAmount = sellingPrice - totalCost
  const profitPercentage = calculateProfitMargin(sellingPrice, totalCost)

  return {
    profitAmount: Math.round(profitAmount),
    profitPercentage: Math.round(profitPercentage * 100) / 100,
  }
}

/**
 * Calculate total cost breakdown
 */
export function calculateCostBreakdown(
  weight: number,
  lomNarxi: number,
  lomNarxiKirim: number,
  laborCost: number,
  isProvider = false,
): {
  materialCost: number
  laborTotal: number
  totalCost: number
} {
  if (!weight || weight <= 0) {
    return { materialCost: 0, laborTotal: 0, totalCost: 0 }
  }

  const materialCostPerGram = isProvider ? lomNarxi : lomNarxiKirim
  const materialCost = weight * materialCostPerGram
  const laborTotal = weight * laborCost
  const totalCost = calculateTotalCost(weight, materialCostPerGram, laborCost)

  return {
    materialCost: Math.round(materialCost),
    laborTotal: Math.round(laborTotal),
    totalCost: Math.round(totalCost),
  }
}

/**
 * Calculates item costs and profits based on weight, lom narxi, lom narxi kirim, and other factors
 *
 * @param data Item data containing weight, pricing information, and other details
 * @returns Object containing central and branch cost calculations
 */
export const calculateItemCosts = (data: {
  weight: number
  lomNarxi: number
  lomNarxiKirim: number
  laborCost: number
  profitPercentage: number
  quality?: string
  purity?: number
}) => {
  const { weight, lomNarxi, lomNarxiKirim, laborCost, profitPercentage, quality, purity } = data

  // Quality multiplier (A: 1.1, B: 1.0, C: 0.9)
  const qualityMultiplier = quality === "A" ? 1.1 : quality === "C" ? 0.9 : 1.0

  // Purity multiplier (defaults to 1.0 if not specified)
  const purityMultiplier = purity ? purity / 585 : 1.0 // 585 is 14K gold standard

  // Apply multipliers to base costs
  const adjustedLomNarxi = lomNarxi * qualityMultiplier * purityMultiplier
  const adjustedLomNarxiKirim = lomNarxiKirim * qualityMultiplier * purityMultiplier

  // Central inventory calculations
  const central = {
    materialCost: weight * adjustedLomNarxi,
    laborCost: weight * laborCost,
    totalCost: calculateTotalCost(weight, adjustedLomNarxi, laborCost),
    sellingPrice: calculateSellingPrice(
      weight,
      adjustedLomNarxi,
      adjustedLomNarxiKirim,
      laborCost,
      profitPercentage,
      true,
    ),
    profit: weight * (adjustedLomNarxi + laborCost) * (profitPercentage / 100),
    transferProfit: weight * (adjustedLomNarxiKirim - adjustedLomNarxi),
    profitMargin: profitPercentage, // Profit margin as percentage
  }

  // Branch inventory calculations
  const branch = {
    materialCost: weight * adjustedLomNarxiKirim,
    laborCost: weight * laborCost,
    totalCost: calculateTotalCost(weight, adjustedLomNarxiKirim, laborCost),
    sellingPrice: calculateSellingPrice(
      weight,
      adjustedLomNarxi,
      adjustedLomNarxiKirim,
      laborCost,
      profitPercentage,
      false,
    ),
    profit: weight * (adjustedLomNarxiKirim + laborCost) * (profitPercentage / 100),
    profitMargin: profitPercentage, // Profit margin as percentage
  }

  // Total system profit (central + branch)
  const totalSystemProfit = central.profit + central.transferProfit

  return {
    central,
    branch,
    totalSystemProfit,
    qualityMultiplier,
    purityMultiplier,
  }
}

/**
 * Calculates optimal Lom Narxi Kirim based on desired profit margin
 *
 * @param lomNarxi Base gold price per gram
 * @param desiredMargin Desired profit margin percentage for transfer
 * @returns Optimal Lom Narxi Kirim value
 */
export const calculateOptimalLomNarxiKirim = (lomNarxi: number, desiredMargin = 10): number => {
  // Apply the desired margin to the base price
  return lomNarxi * (1 + desiredMargin / 100)
}

/**
 * Calculates price adjustments based on market gold price changes
 *
 * @param items Array of inventory items
 * @param newLomNarxi New market gold price per gram
 * @returns Array of items with updated pricing
 */
export const calculatePriceAdjustments = (items: any[], newLomNarxi: number): any[] => {
  return items.map((item) => {
    const percentageChange = (newLomNarxi - item.lomNarxi) / item.lomNarxi

    // Update Lom Narxi
    const updatedLomNarxi = newLomNarxi

    // Update Lom Narxi Kirim proportionally
    const updatedLomNarxiKirim = item.lomNarxiKirim * (1 + percentageChange)

    // Recalculate costs and prices
    const { central, branch } = calculateItemCosts({
      weight: item.weight,
      lomNarxi: updatedLomNarxi,
      lomNarxiKirim: updatedLomNarxiKirim,
      laborCost: item.laborCost,
      profitPercentage: item.profitPercentage,
      quality: item.quality,
      purity: item.purity,
    })

    return {
      ...item,
      lomNarxi: updatedLomNarxi,
      lomNarxiKirim: updatedLomNarxiKirim,
      sellingPrice: item.isProvider ? central.sellingPrice : branch.sellingPrice,
      profit: item.isProvider ? central.profit : branch.profit,
    }
  })
}

/**
 * Calculates profit margin percentage
 */
export function calculateProfitMargin(sellingPrice: number, totalCost: number): number {
  if (totalCost <= 0) return 0
  return ((sellingPrice - totalCost) / totalCost) * 100
}

/**
 * Calculates total cost based on weight, material cost per gram, and labor cost
 */
export function calculateTotalCost(weight: number, lomNarxi: number, laborCost: number): number {
  if (!weight || weight <= 0) return 0
  return weight * lomNarxi + weight * laborCost
}
